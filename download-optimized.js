// Script otimizado para baixar todos os dados históricos
import dataManager from './src/services/dataManager.js';
import fs from 'fs/promises';

async function downloadOptimized() {
    console.log('🚀 Download otimizado de dados históricos...');
    
    try {
        // Configurações específicas para cada loteria
        const lotteryConfigs = {
            lotofacil: {
                name: 'Lotofácil',
                // Lotofácil começou em setembro de 2003 (concurso 1)
                startContest: 1,
                manager: dataManager.lotteryManagers.lotofacil
            },
            megasena: {
                name: 'Mega-Sena', 
                // Mega-Sena começou em março de 1996 (concurso 1)
                startContest: 1,
                manager: dataManager.lotteryManagers.megasena
            }
        };
        
        for (const [lotteryId, config] of Object.entries(lotteryConfigs)) {
            console.log(`\n🎰 Processando ${config.name}...`);
            
            // Busca o último concurso
            const latestData = await config.manager.fetchFromAPI();
            const latestContest = latestData.numero;
            
            console.log(`📊 ${config.name}: Concursos ${config.startContest} - ${latestContest} (${latestContest - config.startContest + 1} total)`);
            
            // Limpa cache para forçar download completo
            const emptyCache = {
                metadata: {
                    lastUpdate: null,
                    totalDraws: 0,
                    lotteryType: lotteryId,
                    version: '1.0'
                },
                draws: []
            };
            
            const cachePath = `./public/data/${lotteryId}.json`;
            await fs.mkdir('./public/data', { recursive: true });
            await fs.writeFile(cachePath, JSON.stringify(emptyCache, null, 2));
            
            console.log(`🗑️  Cache limpo para ${config.name}`);
            
            // Executa sync completo
            console.log(`🔄 Iniciando download de ${config.name}...`);
            const startTime = Date.now();
            
            const draws = await config.manager.syncData(true);
            
            const endTime = Date.now();
            const duration = ((endTime - startTime) / 1000 / 60).toFixed(2);
            
            console.log(`✅ ${config.name} concluído: ${draws.length} concursos em ${duration} minutos`);
            
            if (draws.length > 0) {
                const firstContest = Math.min(...draws.map(d => d.concurso));
                const lastContest = Math.max(...draws.map(d => d.concurso));
                console.log(`📈 Intervalo: ${firstContest} - ${lastContest}`);
            }
        }
        
        // Estatísticas finais
        console.log('\n📊 DOWNLOAD COMPLETO FINALIZADO!');
        const stats = dataManager.getAllStats();
        
        Object.entries(stats).forEach(([lottery, stat]) => {
            if (stat && stat.totalDraws > 0) {
                console.log(`🎰 ${lottery.toUpperCase()}: ${stat.totalDraws} concursos (${stat.firstContest} - ${stat.lastContest})`);
            }
        });
        
        // Verifica tamanho dos arquivos
        console.log('\n📁 Tamanho dos arquivos:');
        try {
            const lotofacilStats = await fs.stat('./public/data/lotofacil.json');
            const megasenaStats = await fs.stat('./public/data/megasena.json');
            
            console.log(`📄 lotofacil.json: ${(lotofacilStats.size / 1024 / 1024).toFixed(2)} MB`);
            console.log(`📄 megasena.json: ${(megasenaStats.size / 1024 / 1024).toFixed(2)} MB`);
        } catch (error) {
            console.log('⚠️  Não foi possível verificar tamanho dos arquivos');
        }
        
        console.log('\n🎉 SUCESSO! Sistema pronto com histórico completo.');
        
    } catch (error) {
        console.error('\n❌ Erro durante download:', error);
    }
}

downloadOptimized();