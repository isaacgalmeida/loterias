/**
 * Vercel Serverless Function para verificar status das loterias
 * Endpoint: /api/lottery-status
 * Método: GET
 */

export default async function handler(req, res) {
    // Configurar CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        console.log('📊 Verificando status das loterias...');
        
        // Carrega dados diretamente dos arquivos JSON
        const fs = await import('fs/promises');
        const path = await import('path');
        
        const status = {};
        const lotteries = ['lotofacil', 'megasena'];
        
        for (const lotteryId of lotteries) {
            try {
                // Tenta carregar arquivo JSON diretamente
                const filePath = path.join(process.cwd(), 'public', 'data', `${lotteryId}.json`);
                
                let fileData;
                try {
                    const fileContent = await fs.readFile(filePath, 'utf8');
                    fileData = JSON.parse(fileContent);
                } catch (fileError) {
                    status[lotteryId] = {
                        success: false,
                        message: 'Arquivo de cache não encontrado'
                    };
                    continue;
                }
                
                const draws = fileData.draws || [];
                
                if (draws.length > 0) {
                    const contests = draws.map(d => d.concurso);
                    const firstContest = Math.min(...contests);
                    const lastContest = Math.max(...contests);
                    
                    // Verifica último concurso na API
                    let apiStatus = null;
                    try {
                        const apiUrl = lotteryId === 'lotofacil' 
                            ? 'https://servicebus2.caixa.gov.br/portaldeloterias/api/lotofacil'
                            : 'https://servicebus2.caixa.gov.br/portaldeloterias/api/megasena';
                            
                        const response = await fetch(apiUrl);
                        const latestData = await response.json();
                        const apiLatest = latestData.numero;
                        
                        apiStatus = {
                            latestAvailable: apiLatest,
                            isUpToDate: lastContest >= apiLatest,
                            missingCount: Math.max(0, apiLatest - lastContest)
                        };
                    } catch (error) {
                        apiStatus = {
                            error: 'Não foi possível verificar API',
                            message: error.message
                        };
                    }
                    
                    status[lotteryId] = {
                        success: true,
                        totalDraws: draws.length,
                        firstContest,
                        lastContest,
                        lastUpdate: fileData.metadata?.lastUpdate,
                        api: apiStatus
                    };
                } else {
                    status[lotteryId] = {
                        success: false,
                        message: 'Nenhum dado encontrado no arquivo'
                    };
                }
                
            } catch (error) {
                status[lotteryId] = {
                    success: false,
                    error: error.message
                };
            }
        }
        
        const response = {
            success: true,
            timestamp: new Date().toISOString(),
            lotteries: status,
            summary: {
                totalLotteries: lotteries.length,
                successfulLotteries: Object.values(status).filter(s => s.success).length,
                totalDraws: Object.values(status).reduce((sum, s) => sum + (s.totalDraws || 0), 0)
            }
        };
        
        return res.status(200).json(response);
        
    } catch (error) {
        console.error('❌ Erro ao verificar status:', error);
        
        return res.status(500).json({
            success: false,
            timestamp: new Date().toISOString(),
            error: error.message
        });
    }
}