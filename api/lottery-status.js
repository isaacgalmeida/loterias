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
        
        const status = {};
        const lotteries = ['lotofacil', 'megasena'];
        
        // Constrói URL base
        const baseUrl = req.headers.host ? `https://${req.headers.host}` : 'https://loterias.guiadainternet.com';
        
        for (const lotteryId of lotteries) {
            try {
                // Carrega dados via fetch (sabemos que funciona)
                const dataUrl = `${baseUrl}/data/${lotteryId}.json`;
                console.log(`Carregando: ${dataUrl}`);
                
                const response = await fetch(dataUrl);
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                
                const fileData = await response.json();
                console.log(`✅ Carregado: ${lotteryId} - ${fileData.draws?.length || 0} concursos`);
                
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