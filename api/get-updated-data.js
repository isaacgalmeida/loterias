/**
 * API para obter dados atualizados das loterias
 * Combina dados do cache local com novos dados da API da Caixa
 */

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { lottery } = req.query;

  if (!lottery || !['lotofacil', 'megasena'].includes(lottery)) {
    return res.status(400).json({
      success: false,
      error: 'Parâmetro lottery inválido. Use: lotofacil ou megasena'
    });
  }

  try {
    // Configurações das loterias
    const configs = {
      lotofacil: {
        apiUrl: 'https://servicebus2.caixa.gov.br/portaldeloterias/api/lotofacil',
        numbersCount: 15,
        minNumber: 1,
        maxNumber: 25
      },
      megasena: {
        apiUrl: 'https://servicebus2.caixa.gov.br/portaldeloterias/api/megasena',
        numbersCount: 6,
        minNumber: 1,
        maxNumber: 60
      }
    };

    const config = configs[lottery];
    // For local development, use the correct protocol
    const protocol = req.headers.host?.includes('localhost') ? 'http' : 'https';
    const baseUrl = req.headers.host ? `${protocol}://${req.headers.host}` : 'https://loterias.guiadainternet.com';

    // 1. Carrega dados do cache local
    const cacheResponse = await fetch(`${baseUrl}/data/${lottery}.json`);
    let cachedData = { draws: [], metadata: {} };

    if (cacheResponse.ok) {
      cachedData = await cacheResponse.json();
    }

    const existingDraws = cachedData.draws || [];
    const lastLocalContest = existingDraws.length > 0
      ? Math.max(...existingDraws.map(d => d.concurso))
      : 0;

    // 2. Verifica último concurso disponível na API
    const latestResponse = await fetch(config.apiUrl);
    const latestData = await latestResponse.json();
    const latestAPIContest = latestData.numero;

    console.log(`${lottery}: Local=${lastLocalContest}, API=${latestAPIContest}`);

    // 3. Se há novos concursos, busca eles
    const newDraws = [];
    if (latestAPIContest > lastLocalContest) {
      console.log(`Buscando ${latestAPIContest - lastLocalContest} novos concursos...`);

      // Busca novos concursos (máximo 50 para evitar timeout)
      const maxNew = Math.min(50, latestAPIContest - lastLocalContest);
      const startContest = Math.max(lastLocalContest + 1, latestAPIContest - maxNew + 1);

      for (let i = startContest; i <= latestAPIContest; i++) {
        try {
          const contestResponse = await fetch(`${config.apiUrl}/${i}`);
          const contestData = await contestResponse.json();

          // Transforma dados da API
          const numbers = contestData.listaDezenas || contestData.dezenasSorteadasOrdemSorteio || [];

          if (Array.isArray(numbers) && numbers.length >= config.numbersCount) {
            const validNumbers = numbers.slice(0, config.numbersCount)
              .map(num => parseInt(num))
              .filter(num => !isNaN(num) && num >= config.minNumber && num <= config.maxNumber);

            if (validNumbers.length === config.numbersCount) {
              const transformed = {
                concurso: contestData.numero,
                data: contestData.dataApuracao || contestData.dataRealizacao,
                numeros: validNumbers.sort((a, b) => a - b),
                acumulado: contestData.acumulado || false,
                valorEstimadoProximoConcurso: contestData.valorEstimadoProximoConcurso || 0,
                dataProximoConcurso: contestData.dataProximoConcurso || null
              };

              newDraws.push(transformed);
            }
          }

          // Pequeno delay para evitar rate limit
          if (i < latestAPIContest) {
            await new Promise(resolve => setTimeout(resolve, 100));
          }
        } catch (error) {
          console.warn(`Erro no concurso ${i}:`, error.message);
        }
      }
    }

    // 4. Combina dados existentes com novos
    const allDraws = [...existingDraws, ...newDraws]
      .filter((draw, index, arr) =>
        // Remove duplicatas baseado no número do concurso
        arr.findIndex(d => d.concurso === draw.concurso) === index
      )
      .sort((a, b) => a.concurso - b.concurso);

    // 5. Prepara resposta
    const updatedData = {
      metadata: {
        lastUpdate: new Date().toISOString(),
        totalDraws: allDraws.length,
        lotteryType: lottery,
        version: '1.0',
        newDrawsAdded: newDraws.length,
        lastLocalContest,
        latestAPIContest,
        cacheSource: cacheResponse.ok ? 'file' : 'empty'
      },
      draws: allDraws
    };

    return res.status(200).json({
      success: true,
      data: updatedData,
      summary: {
        totalDraws: allDraws.length,
        newDraws: newDraws.length,
        firstContest: allDraws.length > 0 ? Math.min(...allDraws.map(d => d.concurso)) : 0,
        lastContest: allDraws.length > 0 ? Math.max(...allDraws.map(d => d.concurso)) : 0,
        upToDate: newDraws.length === 0
      }
    });

  } catch (error) {
    console.error(`Erro ao buscar dados de ${lottery}:`, error);

    return res.status(500).json({
      success: false,
      error: error.message,
      lottery
    });
  }
}