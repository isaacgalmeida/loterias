/**
 * Vercel Serverless Function para sincronização diária das loterias
 * Endpoint: /api/sync-lottery
 * Método: GET ou POST
 */

export default async function handler(req, res) {
    // Configurar CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const startTime = Date.now();
    
    try {
        console.log('🚀 Iniciando sincronização automática das loterias...');
        
        // Log da requisição
        console.log(`📊 Sincronização iniciada em: ${new Date().toISOString()}`);
        
        const results = {};
        const errors = {};
        
        // Configurações das loterias
        const lotteryConfigs = {
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
        
        const fs = await import('fs/promises');
        const path = await import('path');
        
        // Sincroniza cada loteria individualmente
        for (const [lotteryId, config] of Object.entries(lotteryConfigs)) {
            try {
                console.log(`🎰 Sincronizando ${lotteryId}...`);
                
                // Carrega dados atuais do arquivo
                const filePath = path.join(process.cwd(), 'public', 'data', `${lotteryId}.json`);
                
                let existingDraws = [];
                try {
                    const fileContent = await fs.readFile(filePath, 'utf8');
                    const fileData = JSON.parse(fileContent);
                    existingDraws = fileData.draws || [];
                } catch (fileError) {
                    console.log(`📁 Arquivo ${lotteryId}.json não encontrado, criando novo...`);
                }
                
                // Verifica último concurso local
                const lastLocal = existingDraws.length > 0 
                    ? Math.max(...existingDraws.map(d => d.concurso))
                    : 0;
                
                // Verifica último concurso na API
                const apiResponse = await fetch(config.apiUrl);
                const latestAPIData = await apiResponse.json();
                const latestAPI = latestAPIData.numero;
                
                console.log(`📊 ${lotteryId}: Local=${lastLocal}, API=${latestAPI}`);
                
                if (latestAPI > lastLocal) {
                    // Há novos concursos para baixar
                    const newContests = [];
                    for (let i = lastLocal + 1; i <= latestAPI; i++) {
                        newContests.push(i);
                    }
                    
                    console.log(`📥 Baixando ${newContests.length} novos concursos de ${lotteryId}...`);
                    
                    // Baixa novos concursos com delay para evitar rate limit
                    const newDraws = [];
                    for (const contestNumber of newContests) {
                        try {
                            const contestResponse = await fetch(`${config.apiUrl}/${contestNumber}`);
                            const apiData = await contestResponse.json();
                            
                            // Transforma dados da API
                            const numbers = apiData.listaDezenas || apiData.dezenasSorteadasOrdemSorteio || [];
                            
                            if (Array.isArray(numbers) && numbers.length >= config.numbersCount) {
                                const validNumbers = numbers.slice(0, config.numbersCount)
                                    .map(num => parseInt(num))
                                    .filter(num => !isNaN(num) && num >= config.minNumber && num <= config.maxNumber);
                                
                                if (validNumbers.length === config.numbersCount) {
                                    const transformed = {
                                        concurso: apiData.numero,
                                        data: apiData.dataApuracao || apiData.dataRealizacao,
                                        numeros: validNumbers.sort((a, b) => a - b),
                                        acumulado: apiData.acumulado || false,
                                        valorEstimadoProximoConcurso: apiData.valorEstimadoProximoConcurso || 0,
                                        dataProximoConcurso: apiData.dataProximoConcurso || null
                                    };
                                    
                                    newDraws.push(transformed);
                                }
                            }
                            
                            // Delay entre requisições
                            if (newContests.length > 1) {
                                await new Promise(resolve => setTimeout(resolve, 1000));
                            }
                        } catch (error) {
                            console.warn(`⚠️ Falha no concurso ${contestNumber}: ${error.message}`);
                        }
                    }
                    
                    if (newDraws.length > 0) {
                        // Combina com dados existentes
                        const allDraws = [...existingDraws, ...newDraws].sort((a, b) => a.concurso - b.concurso);
                        
                        // Salva arquivo atualizado
                        const updatedData = {
                            metadata: {
                                lastUpdate: new Date().toISOString(),
                                totalDraws: allDraws.length,
                                lotteryType: lotteryId,
                                version: '1.0'
                            },
                            draws: allDraws
                        };
                        
                        await fs.writeFile(filePath, JSON.stringify(updatedData, null, 2), 'utf8');
                        
                        results[lotteryId] = {
                            success: true,
                            totalDraws: allDraws.length,
                            newDraws: newDraws.length,
                            lastContest: Math.max(...allDraws.map(d => d.concurso))
                        };
                        
                        console.log(`✅ ${lotteryId}: +${newDraws.length} novos concursos`);
                    } else {
                        results[lotteryId] = {
                            success: true,
                            totalDraws: existingDraws.length,
                            newDraws: 0,
                            message: 'Nenhum novo concurso válido encontrado'
                        };
                    }
                } else {
                    // Já está atualizado
                    results[lotteryId] = {
                        success: true,
                        totalDraws: existingDraws.length,
                        newDraws: 0,
                        message: 'Já está atualizado'
                    };
                    
                    console.log(`✅ ${lotteryId}: Já está atualizado`);
                }
                
            } catch (error) {
                console.error(`❌ Erro ao sincronizar ${lotteryId}:`, error);
                errors[lotteryId] = error.message;
                results[lotteryId] = {
                    success: false,
                    error: error.message
                };
            }
        }
        
        const endTime = Date.now();
        const duration = ((endTime - startTime) / 1000).toFixed(2);
        
        // Resposta de sucesso
        const response = {
            success: true,
            timestamp: new Date().toISOString(),
            duration: `${duration}s`,
            results,
            errors: Object.keys(errors).length > 0 ? errors : undefined,
            summary: {
                totalNewDraws: Object.values(results).reduce((sum, r) => sum + (r.newDraws || 0), 0),
                lotteriesUpdated: Object.values(results).filter(r => r.success).length,
                lotteriesWithErrors: Object.keys(errors).length
            }
        };
        
        console.log('✅ Sincronização concluída:', response.summary);
        
        return res.status(200).json(response);
        
    } catch (error) {
        console.error('❌ Erro fatal na sincronização:', error);
        
        const endTime = Date.now();
        const duration = ((endTime - startTime) / 1000).toFixed(2);
        
        return res.status(500).json({
            success: false,
            timestamp: new Date().toISOString(),
            duration: `${duration}s`,
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
}