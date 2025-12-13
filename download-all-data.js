// Script para baixar TODOS os dados históricos das loterias
import dataManager from './src/services/dataManager.js';
import fs from 'fs/promises';
import path from 'path';

async function downloadAllHistoricalData() {
    console.log('🚀 Iniciando download COMPLETO de todos os dados históricos...');
    console.log('⚠️  Este processo pode demorar vários minutos...');
    
    try {
        // Limpa os arquivos de cache existentes para forçar download completo
        console.log('\n🗑️  Limpando cache existente...');
        
        const lotofacilPath = './public/data/lotofacil.json';
        const megasenaPath = './public/data/megasena.json';
        
        // Cria estrutura vazia para forçar download completo
        const emptyStructure = {
            metadata: {
                lastUpdate: null,
                totalDraws: 0,
                lotteryType: '',
                version: '1.0'
            },
            draws: []
        };
        
        // Garante que o diretório existe
        await fs.mkdir('./public/data', { recursive: true });
        
        // Limpa cache da Lotofácil
        const lotofacilEmpty = { ...emptyStructure, metadata: { ...emptyStructure.metadata, lotteryType: 'lotofacil' } };
        await fs.writeFile(lotofacilPath, JSON.stringify(lotofacilEmpty, null, 2));
        console.log('✅ Cache da Lotofácil limpo');
        
        // Limpa cache da Mega-Sena
        const megasenaEmpty = { ...emptyStructure, metadata: { ...emptyStructure.metadata, lotteryType: 'megasena' } };
        await fs.writeFile(megasenaPath, JSON.stringify(megasenaEmpty, null, 2));
        console.log('✅ Cache da Mega-Sena limpo');
        
        console.log('\n📊 Verificando concursos disponíveis...');
        
        // Verifica quantos concursos existem para cada loteria
        const lotofacilManager = dataManager.lotteryManagers.lotofacil;
        const megasenaManager = dataManager.lotteryManagers.megasena;
        
        const latestLotofacil = await lotofacilManager.fetchFromAPI();
        const latestMegasena = await megasenaManager.fetchFromAPI();
        
        console.log(`📈 Lotofácil: Concurso mais recente é ${latestLotofacil.numero}`);
        console.log(`📈 Mega-Sena: Concurso mais recente é ${latestMegasena.numero}`);
        console.log(`📊 Total estimado: ~${latestLotofacil.numero + latestMegasena.numero} concursos para baixar`);
        
        // Confirma se o usuário quer continuar
        console.log('\n⏱️  Tempo estimado: 15-30 minutos dependendo da conexão');
        console.log('🔄 Iniciando download completo em 3 segundos...');
        
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        console.log('\n🚀 INICIANDO DOWNLOAD COMPLETO...');
        
        // Executa sincronização completa forçada
        const startTime = Date.now();
        const { results, errors } = await dataManager.syncAllLotteries(true);
        const endTime = Date.now();
        
        const duration = ((endTime - startTime) / 1000 / 60).toFixed(2); // em minutos
        
        console.log('\n✅ DOWNLOAD COMPLETO FINALIZADO!');
        console.log(`⏱️  Tempo total: ${duration} minutos`);
        
        // Mostra estatísticas finais
        console.log('\n📊 ESTATÍSTICAS FINAIS:');
        Object.entries(results).forEach(([lottery, draws]) => {
            if (draws.length > 0) {
                const firstContest = Math.min(...draws.map(d => d.concurso));
                const lastContest = Math.max(...draws.map(d => d.concurso));
                console.log(`🎰 ${lottery.toUpperCase()}: ${draws.length} concursos (${firstContest} - ${lastContest})`);
            }
        });
        
        // Verifica se houve erros
        if (Object.keys(errors).length > 0) {
            console.log('\n⚠️  ERROS DURANTE O DOWNLOAD:');
            Object.entries(errors).forEach(([lottery, error]) => {
                console.log(`❌ ${lottery}: ${error}`);
            });
        }
        
        // Mostra tamanho dos arquivos
        console.log('\n📁 TAMANHO DOS ARQUIVOS:');
        try {
            const lotofacilStats = await fs.stat(lotofacilPath);
            const megasenaStats = await fs.stat(megasenaPath);
            
            console.log(`📄 lotofacil.json: ${(lotofacilStats.size / 1024 / 1024).toFixed(2)} MB`);
            console.log(`📄 megasena.json: ${(megasenaStats.size / 1024 / 1024).toFixed(2)} MB`);
        } catch (error) {
            console.log('⚠️  Não foi possível verificar tamanho dos arquivos');
        }
        
        console.log('\n🎉 SUCESSO! Todos os dados históricos foram baixados e salvos.');
        console.log('🚀 O sistema agora possui o histórico completo das loterias.');
        
    } catch (error) {
        console.error('\n❌ ERRO durante o download completo:', error);
        console.log('\n🔄 Você pode tentar executar novamente o script.');
        console.log('💡 Dica: Verifique sua conexão com a internet e tente novamente.');
    }
}

// Executa o download
downloadAllHistoricalData();