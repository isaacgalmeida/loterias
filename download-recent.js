// Download apenas dos dados recentes (últimos 1000 concursos)
import dataManager from './src/services/dataManager.js';
import fs from 'fs/promises';

async function downloadRecent() {
    console.log('🚀 Baixando dados recentes (últimos 1000 concursos de cada loteria)...');
    
    try {
        // Limpa cache atual
        console.log('🗑️  Limpando cache...');
        await clearCache();
        
        // Modifica temporariamente para baixar últimos 1000
        const originalStartContest = 1;
        
        // Override temporário do método syncData
        for (const [lotteryId, manager] of Object.entries(dataManager.lotteryManagers)) {
            const originalSyncData = manager.syncData;
            
            manager.syncData = async function(forceFullSync = false) {
                console.log(`🔄 Starting recent sync for ${this.config.name}...`);
                
                try {
                    const cachedData = await this.loadFromCache();
                    let existingDraws = cachedData.draws || [];
                    
                    const latestAPIData = await this.fetchFromAPI();
                    const latestContestNumber = latestAPIData.numero;
                    
                    console.log(`📊 Latest ${this.config.name} contest: ${latestContestNumber}`);
                    
                    // Baixa últimos 1000 concursos
                    const startContest = Math.max(1, latestContestNumber - 999);
                    const contestsToFetch = Array.from(
                        { length: latestContestNumber - startContest + 1 }, 
                        (_, i) => startContest + i
                    );
                    
                    console.log(`📥 Fetching ${this.config.name}: contests ${startContest} to ${latestContestNumber} (${contestsToFetch.length} total)`);
                    
                    const newDraws = await this.fetchContestsInBatches(contestsToFetch);
                    const allDraws = this.mergeDraws(existingDraws, newDraws);
                    
                    await this.saveToCache(allDraws);
                    
                    console.log(`✅ ${this.config.name} recent sync completed: ${allDraws.length} total draws`);
                    return allDraws;
                    
                } catch (error) {
                    console.error(`❌ Recent sync failed for ${this.config.name}:`, error);
                    throw error;
                }
            };
        }
        
        // Executa download
        console.log('📊 Iniciando download dos dados recentes...');
        const startTime = Date.now();
        
        const { results, errors } = await dataManager.syncAllLotteries(true);
        
        const endTime = Date.now();
        const duration = ((endTime - startTime) / 1000 / 60).toFixed(2);
        
        console.log(`\n✅ Download concluído em ${duration} minutos!`);
        
        // Estatísticas
        console.log('\n📊 DADOS BAIXADOS:');
        Object.entries(results).forEach(([lottery, draws]) => {
            if (draws.length > 0) {
                const firstContest = Math.min(...draws.map(d => d.concurso));
                const lastContest = Math.max(...draws.map(d => d.concurso));
                console.log(`🎰 ${lottery.toUpperCase()}: ${draws.length} concursos (${firstContest} - ${lastContest})`);
            }
        });
        
        // Erros
        if (Object.keys(errors).length > 0) {
            console.log('\n⚠️  ERROS:');
            Object.entries(errors).forEach(([lottery, error]) => {
                console.log(`❌ ${lottery}: ${error}`);
            });
        }
        
        // Tamanho dos arquivos
        console.log('\n📁 Tamanho dos arquivos:');
        try {
            const lotofacilStats = await fs.stat('./public/data/lotofacil.json');
            const megasenaStats = await fs.stat('./public/data/megasena.json');
            
            console.log(`📄 lotofacil.json: ${(lotofacilStats.size / 1024 / 1024).toFixed(2)} MB`);
            console.log(`📄 megasena.json: ${(megasenaStats.size / 1024 / 1024).toFixed(2)} MB`);
        } catch (error) {
            console.log('⚠️  Não foi possível verificar tamanho dos arquivos');
        }
        
        console.log('\n🎉 SUCESSO! Sistema pronto com dados recentes.');
        console.log('💡 Para baixar histórico completo, use: npm run download:all');
        
    } catch (error) {
        console.error('\n❌ Erro durante download:', error);
    }
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
    
    console.log('✅ Cache limpo');
}

downloadRecent();