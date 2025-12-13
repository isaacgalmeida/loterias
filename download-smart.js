// Download inteligente - começa pelos mais recentes
import dataManager from './src/services/dataManager.js';
import fs from 'fs/promises';

async function smartDownload() {
    console.log('🧠 Download inteligente - priorizando dados recentes...');
    
    try {
        // Estratégia: baixar primeiro os últimos 500 concursos de cada loteria
        // Depois expandir gradualmente para o histórico completo
        
        const strategies = [
            { name: 'Últimos 500 concursos', count: 500 },
            { name: 'Últimos 1000 concursos', count: 1000 },
            { name: 'Últimos 2000 concursos', count: 2000 },
            { name: 'Histórico completo', count: null }
        ];
        
        for (const strategy of strategies) {
            console.log(`\n📊 Executando: ${strategy.name}`);
            
            // Ajusta temporariamente a configuração do dataManager
            if (strategy.count) {
                // Modifica temporariamente o método para baixar apenas X concursos
                await downloadWithLimit(strategy.count);
            } else {
                // Download completo
                await downloadComplete();
            }
            
            // Verifica se temos dados suficientes
            const stats = dataManager.getAllStats();
            console.log('📈 Status atual:');
            Object.entries(stats).forEach(([lottery, stat]) => {
                if (stat) {
                    console.log(`   ${lottery}: ${stat.totalDraws} concursos`);
                }
            });
            
            // Se já temos dados suficientes, para aqui
            if (stats.lotofacil?.totalDraws > 3000 && stats.megasena?.totalDraws > 2500) {
                console.log('✅ Dados suficientes obtidos!');
                break;
            }
        }
        
        console.log('\n🎉 Download inteligente concluído!');
        
    } catch (error) {
        console.error('❌ Erro no download inteligente:', error);
    }
}

async function downloadWithLimit(maxConcursos) {
    console.log(`📥 Baixando últimos ${maxConcursos} concursos...`);
    
    // Limpa cache
    await clearCache();
    
    // Modifica temporariamente a lógica de sync
    const originalSyncData = dataManager.lotteryManagers.lotofacil.syncData;
    
    // Override temporário para limitar concursos
    for (const [lotteryId, manager] of Object.entries(dataManager.lotteryManagers)) {
        const originalMethod = manager.syncData;
        
        manager.syncData = async function(forceFullSync = false) {
            console.log(`🔄 Starting limited sync for ${this.config.name} (max ${maxConcursos})...`);
            
            try {
                const cachedData = await this.loadFromCache();
                let existingDraws = cachedData.draws || [];
                
                const latestAPIData = await this.fetchFromAPI();
                const latestContestNumber = latestAPIData.numero;
                
                console.log(`📊 Latest ${this.config.name} contest: ${latestContestNumber}`);
                
                // Calcula início baseado no limite
                const startContest = Math.max(1, latestContestNumber - maxConcursos + 1);
                const contestsToFetch = Array.from(
                    { length: latestContestNumber - startContest + 1 }, 
                    (_, i) => startContest + i
                );
                
                console.log(`📥 Fetching ${this.config.name}: contests ${startContest} to ${latestContestNumber} (${contestsToFetch.length} total)`);
                
                const newDraws = await this.fetchContestsInBatches(contestsToFetch);
                const allDraws = this.mergeDraws(existingDraws, newDraws);
                
                await this.saveToCache(allDraws);
                
                console.log(`✅ ${this.config.name} limited sync completed: ${allDraws.length} total draws`);
                return allDraws;
                
            } catch (error) {
                console.error(`❌ Limited sync failed for ${this.config.name}:`, error);
                throw error;
            }
        };
    }
    
    // Executa sync
    await dataManager.syncAllLotteries(true);
    
    // Restaura métodos originais
    for (const [lotteryId, manager] of Object.entries(dataManager.lotteryManagers)) {
        manager.syncData = originalSyncData;
    }
}

async function downloadComplete() {
    console.log('📥 Baixando histórico completo...');
    await clearCache();
    await dataManager.syncAllLotteries(true);
}

async function clearCache() {
    const emptyStructure = {
        metadata: {
            lastUpdate: null,
            totalDraws: 0,
            lotteryType: '',
            version: '1.0'
        },
        draws: []
    };
    
    await fs.mkdir('./public/data', { recursive: true });
    
    const lotofacilEmpty = { ...emptyStructure, metadata: { ...emptyStructure.metadata, lotteryType: 'lotofacil' } };
    await fs.writeFile('./public/data/lotofacil.json', JSON.stringify(lotofacilEmpty, null, 2));
    
    const megasenaEmpty = { ...emptyStructure, metadata: { ...emptyStructure.metadata, lotteryType: 'megasena' } };
    await fs.writeFile('./public/data/megasena.json', JSON.stringify(megasenaEmpty, null, 2));
}

smartDownload();