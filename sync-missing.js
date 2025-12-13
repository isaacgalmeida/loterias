#!/usr/bin/env node
/**
 * Script de Sincronização Inteligente
 * Baixa apenas os concursos que não estão nos arquivos JSON
 * 
 * Uso:
 * node sync-missing.js                    # Sincroniza ambas as loterias
 * node sync-missing.js lotofacil          # Sincroniza apenas Lotofácil
 * node sync-missing.js megasena           # Sincroniza apenas Mega-Sena
 * node sync-missing.js --help             # Mostra ajuda
 */

import dataManager from './src/services/dataManager.js';
import fs from 'fs/promises';
import path from 'path';

// Configurações
const SUPPORTED_LOTTERIES = ['lotofacil', 'megasena'];

/**
 * Mostra ajuda do script
 */
function showHelp() {
    console.log(`
🎰 Script de Sincronização Inteligente de Loterias

📋 USO:
  node sync-missing.js                    # Sincroniza ambas as loterias
  node sync-missing.js lotofacil          # Sincroniza apenas Lotofácil  
  node sync-missing.js megasena           # Sincroniza apenas Mega-Sena
  node sync-missing.js --help             # Mostra esta ajuda

🎯 FUNCIONALIDADE:
  • Analisa os arquivos JSON existentes
  • Identifica quais concursos estão faltando
  • Baixa apenas os concursos que não existem
  • Atualiza os arquivos com os novos dados

📁 ARQUIVOS:
  • public/data/lotofacil.json
  • public/data/megasena.json

🔄 ESTRATÉGIA:
  • Verifica último concurso no arquivo local
  • Consulta último concurso disponível na API
  • Baixa apenas os concursos intermediários que faltam
`);
}

/**
 * Analisa quais concursos estão faltando
 */
async function analyzeMissingContests(lotteryId) {
    const manager = dataManager.lotteryManagers[lotteryId];
    if (!manager) {
        throw new Error(`Loteria '${lotteryId}' não suportada. Use: ${SUPPORTED_LOTTERIES.join(', ')}`);
    }

    console.log(`\n🔍 Analisando ${manager.config.name}...`);

    // Carrega dados do cache local
    const cachedData = await manager.loadFromCache();
    const existingDraws = cachedData.draws || [];
    
    console.log(`📊 Concursos no cache local: ${existingDraws.length}`);

    // Busca último concurso disponível na API
    const latestAPIData = await manager.fetchFromAPI();
    const latestContestNumber = latestAPIData.numero;
    
    console.log(`📊 Último concurso na API: ${latestContestNumber}`);

    if (existingDraws.length === 0) {
        // Nenhum dado local - baixar últimos 1000 concursos
        const startContest = Math.max(1, latestContestNumber - 999);
        const missingContests = Array.from(
            { length: latestContestNumber - startContest + 1 }, 
            (_, i) => startContest + i
        );
        
        console.log(`📥 Nenhum dado local encontrado`);
        console.log(`📥 Baixando últimos 1000 concursos: ${startContest} - ${latestContestNumber}`);
        
        return { missingContests, existingDraws };
    }

    // Identifica concursos existentes
    const existingContests = new Set(existingDraws.map(d => d.concurso));
    const firstExisting = Math.min(...existingDraws.map(d => d.concurso));
    const lastExisting = Math.max(...existingDraws.map(d => d.concurso));
    
    console.log(`📊 Intervalo local: ${firstExisting} - ${lastExisting}`);

    // Identifica concursos que faltam
    const missingContests = [];
    
    // 1. Concursos entre o primeiro e último existente (buracos)
    for (let i = firstExisting; i <= lastExisting; i++) {
        if (!existingContests.has(i)) {
            missingContests.push(i);
        }
    }
    
    // 2. Concursos mais recentes que o último existente
    if (latestContestNumber > lastExisting) {
        for (let i = lastExisting + 1; i <= latestContestNumber; i++) {
            missingContests.push(i);
        }
    }

    console.log(`📊 Concursos faltando: ${missingContests.length}`);
    
    if (missingContests.length > 0) {
        const ranges = getContestRanges(missingContests);
        console.log(`📊 Intervalos a baixar: ${ranges.join(', ')}`);
    }

    return { missingContests, existingDraws };
}

/**
 * Converte lista de concursos em intervalos legíveis
 */
function getContestRanges(contests) {
    if (contests.length === 0) return [];
    
    contests.sort((a, b) => a - b);
    const ranges = [];
    let start = contests[0];
    let end = contests[0];
    
    for (let i = 1; i < contests.length; i++) {
        if (contests[i] === end + 1) {
            end = contests[i];
        } else {
            ranges.push(start === end ? `${start}` : `${start}-${end}`);
            start = end = contests[i];
        }
    }
    
    ranges.push(start === end ? `${start}` : `${start}-${end}`);
    return ranges;
}

/**
 * Baixa concursos faltantes
 */
async function downloadMissingContests(lotteryId, missingContests, existingDraws) {
    if (missingContests.length === 0) {
        console.log(`✅ ${lotteryId}: Todos os concursos estão atualizados!`);
        return existingDraws;
    }

    const manager = dataManager.lotteryManagers[lotteryId];
    
    console.log(`\n📥 Baixando ${missingContests.length} concursos faltantes de ${manager.config.name}...`);
    
    const startTime = Date.now();
    
    // Baixa concursos em lotes
    const newDraws = await manager.fetchContestsInBatches(missingContests);
    
    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);
    
    console.log(`📥 Baixados ${newDraws.length}/${missingContests.length} concursos em ${duration}s`);
    
    // Combina dados existentes com novos
    const allDraws = manager.mergeDraws(existingDraws, newDraws);
    
    // Salva no cache
    await manager.saveToCache(allDraws);
    
    console.log(`💾 Salvos ${allDraws.length} concursos total no cache`);
    
    return allDraws;
}

/**
 * Sincroniza uma loteria específica
 */
async function syncLottery(lotteryId) {
    try {
        console.log(`\n🎰 Sincronizando ${lotteryId.toUpperCase()}...`);
        
        // Analisa concursos faltantes
        const { missingContests, existingDraws } = await analyzeMissingContests(lotteryId);
        
        // Baixa concursos faltantes
        const finalDraws = await downloadMissingContests(lotteryId, missingContests, existingDraws);
        
        // Estatísticas finais
        if (finalDraws.length > 0) {
            const firstContest = Math.min(...finalDraws.map(d => d.concurso));
            const lastContest = Math.max(...finalDraws.map(d => d.concurso));
            console.log(`✅ ${lotteryId}: ${finalDraws.length} concursos (${firstContest} - ${lastContest})`);
        }
        
        return { success: true, draws: finalDraws.length, new: missingContests.length };
        
    } catch (error) {
        console.error(`❌ Erro ao sincronizar ${lotteryId}:`, error.message);
        return { success: false, error: error.message };
    }
}

/**
 * Função principal
 */
async function main() {
    const args = process.argv.slice(2);
    
    // Verifica se é pedido de ajuda
    if (args.includes('--help') || args.includes('-h')) {
        showHelp();
        return;
    }
    
    console.log('🚀 Script de Sincronização Inteligente de Loterias');
    console.log('=' .repeat(50));
    
    let lotteriestoSync = [];
    
    // Determina quais loterias sincronizar
    if (args.length === 0) {
        // Nenhum argumento - sincroniza todas
        lotteriestoSync = SUPPORTED_LOTTERIES;
        console.log('📊 Sincronizando todas as loterias...');
    } else {
        // Argumentos específicos
        for (const arg of args) {
            if (SUPPORTED_LOTTERIES.includes(arg.toLowerCase())) {
                lotteriestoSync.push(arg.toLowerCase());
            } else {
                console.error(`❌ Loteria '${arg}' não suportada. Use: ${SUPPORTED_LOTTERIES.join(', ')}`);
                return;
            }
        }
        console.log(`📊 Sincronizando: ${lotteriestoSync.join(', ')}`);
    }
    
    const startTime = Date.now();
    const results = {};
    
    // Sincroniza cada loteria
    for (const lotteryId of lotteriestoSync) {
        results[lotteryId] = await syncLottery(lotteryId);
    }
    
    const endTime = Date.now();
    const totalDuration = ((endTime - startTime) / 1000 / 60).toFixed(2);
    
    // Relatório final
    console.log('\n' + '='.repeat(50));
    console.log('📊 RELATÓRIO FINAL');
    console.log('='.repeat(50));
    
    let totalNew = 0;
    let totalDraws = 0;
    
    Object.entries(results).forEach(([lottery, result]) => {
        if (result.success) {
            console.log(`✅ ${lottery.toUpperCase()}: ${result.draws} concursos total (+${result.new} novos)`);
            totalNew += result.new;
            totalDraws += result.draws;
        } else {
            console.log(`❌ ${lottery.toUpperCase()}: ${result.error}`);
        }
    });
    
    console.log(`\n📊 Total: ${totalDraws} concursos (${totalNew} novos baixados)`);
    console.log(`⏱️  Tempo total: ${totalDuration} minutos`);
    
    // Verifica tamanho dos arquivos
    console.log('\n📁 Tamanho dos arquivos:');
    for (const lotteryId of lotteriestoSync) {
        try {
            const filePath = `./public/data/${lotteryId}.json`;
            const stats = await fs.stat(filePath);
            console.log(`📄 ${lotteryId}.json: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
        } catch (error) {
            console.log(`⚠️  ${lotteryId}.json: arquivo não encontrado`);
        }
    }
    
    console.log('\n🎉 Sincronização concluída!');
}

// Executa o script
if (import.meta.url === `file://${process.argv[1]}`) {
    main().catch(error => {
        console.error('❌ Erro fatal:', error);
        process.exit(1);
    });
}