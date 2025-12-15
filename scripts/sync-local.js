#!/usr/bin/env node
/**
 * Script para sincronização local das loterias
 * Execute: node scripts/sync-local.js
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

async function syncLottery(lotteryId, config) {
  console.log(`🎰 Sincronizando ${lotteryId}...`);

  const filePath = path.join(__dirname, '..', 'public', 'data', `${lotteryId}.json`);

  // Carrega dados atuais
  let existingDraws = [];
  let metadata = {};

  try {
    const fileContent = await fs.readFile(filePath, 'utf8');
    const fileData = JSON.parse(fileContent);
    existingDraws = fileData.draws || [];
    metadata = fileData.metadata || {};
  } catch (error) {
    console.log(`📁 Arquivo ${lotteryId}.json não encontrado, criando novo...`);
  }

  // Verifica último concurso local
  const lastLocal = existingDraws.length > 0
    ? Math.max(...existingDraws.map(d => d.concurso))
    : 0;

  // Verifica último concurso na API
  console.log(`📡 Consultando API da Caixa para ${lotteryId}...`);
  const apiResponse = await fetch(config.apiUrl);
  const latestAPIData = await apiResponse.json();
  const latestAPI = latestAPIData.numero;

  console.log(`📊 ${lotteryId}: Local=${lastLocal}, API=${latestAPI}`);

  if (latestAPI <= lastLocal) {
    console.log(`✅ ${lotteryId}: Já está atualizado`);
    return {
      success: true,
      totalDraws: existingDraws.length,
      newDraws: 0,
      message: 'Já está atualizado'
    };
  }

  // Há novos concursos para baixar
  const newContests = [];
  for (let i = lastLocal + 1; i <= latestAPI; i++) {
    newContests.push(i);
  }

  console.log(`📥 Baixando ${newContests.length} novos concursos de ${lotteryId}...`);

  // Baixa novos concursos com delay para evitar rate limit
  const newDraws = [];
  let processed = 0;

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

      processed++;

      // Mostra progresso a cada 10 concursos
      if (processed % 10 === 0) {
        console.log(`   Processados: ${processed}/${newContests.length}`);
      }

      // Delay entre requisições para evitar rate limit
      if (processed < newContests.length) {
        await new Promise(resolve => setTimeout(resolve, 500));
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
        version: '1.0',
        syncSource: 'local-script'
      },
      draws: allDraws
    };

    await fs.writeFile(filePath, JSON.stringify(updatedData, null, 2), 'utf8');

    console.log(`✅ ${lotteryId}: +${newDraws.length} novos concursos salvos`);

    return {
      success: true,
      totalDraws: allDraws.length,
      newDraws: newDraws.length,
      lastContest: Math.max(...allDraws.map(d => d.concurso))
    };
  } else {
    console.log(`⚠️ ${lotteryId}: Nenhum novo concurso válido encontrado`);
    return {
      success: true,
      totalDraws: existingDraws.length,
      newDraws: 0,
      message: 'Nenhum novo concurso válido encontrado'
    };
  }
}

async function main() {
  console.log('🚀 Iniciando sincronização local das loterias...');
  console.log(`📅 ${new Date().toLocaleString('pt-BR')}`);

  const startTime = Date.now();
  const results = {};

  try {
    // Sincroniza cada loteria
    for (const [lotteryId, config] of Object.entries(lotteryConfigs)) {
      try {
        results[lotteryId] = await syncLottery(lotteryId, config);
      } catch (error) {
        console.error(`❌ Erro ao sincronizar ${lotteryId}:`, error.message);
        results[lotteryId] = {
          success: false,
          error: error.message
        };
      }
    }

    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);

    // Resumo final
    const totalNewDraws = Object.values(results).reduce((sum, r) => sum + (r.newDraws || 0), 0);
    const successfulLotteries = Object.values(results).filter(r => r.success).length;

    console.log('\n📊 RESUMO DA SINCRONIZAÇÃO:');
    console.log(`⏱️  Duração: ${duration}s`);
    console.log(`🎯 Loterias processadas: ${successfulLotteries}/${Object.keys(lotteryConfigs).length}`);
    console.log(`📈 Total de novos concursos: ${totalNewDraws}`);

    Object.entries(results).forEach(([lottery, result]) => {
      if (result.success) {
        console.log(`   ${lottery}: ${result.newDraws} novos (total: ${result.totalDraws})`);
      } else {
        console.log(`   ${lottery}: ERRO - ${result.error}`);
      }
    });

    if (totalNewDraws > 0) {
      console.log('\n✅ Sincronização concluída com sucesso!');

      // Para GitHub Actions - sinaliza que houve mudanças
      if (process.env.GITHUB_ACTIONS) {
        console.log('::notice title=Sync Success::Novos concursos sincronizados com sucesso');
      }
    } else {
      console.log('\n✅ Todos os dados já estão atualizados!');

      // Para GitHub Actions - sinaliza que não houve mudanças  
      if (process.env.GITHUB_ACTIONS) {
        console.log('::notice title=No Changes::Todos os dados já estão atualizados');
      }
    }

  } catch (error) {
    console.error('❌ Erro fatal na sincronização:', error);
    process.exit(1);
  }
}

// Executa o script
main().catch(console.error);