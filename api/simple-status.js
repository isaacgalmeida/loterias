/**
 * API simples de status das loterias
 */

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        // For local development, use the correct protocol
        const protocol = req.headers.host?.includes('localhost') ? 'http' : 'https';
        const baseUrl = req.headers.host ? `${protocol}://${req.headers.host}` : 'https://loterias.guiadainternet.com';
        const lotteries = ['lotofacil', 'megasena'];
        const status = {};
        let totalDraws = 0;

        for (const lotteryId of lotteries) {
            try {
                const dataUrl = `${baseUrl}/data/${lotteryId}.json`;
                const response = await fetch(dataUrl);

                if (response.ok) {
                    const data = await response.json();
                    const draws = data.draws || [];

                    if (draws.length > 0) {
                        const contests = draws.map(d => d.concurso);
                        const firstContest = Math.min(...contests);
                        const lastContest = Math.max(...contests);

                        // Use metadata.totalDraws if available, otherwise count draws
                        const actualTotalDraws = data.metadata?.totalDraws || draws.length;

                        status[lotteryId] = {
                            success: true,
                            totalDraws: actualTotalDraws,
                            firstContest,
                            lastContest,
                            lastUpdate: data.metadata?.lastUpdate,
                            api: {
                                isUpToDate: true, // Simplificado - assume atualizado
                                missingCount: 0
                            }
                        };

                        totalDraws += actualTotalDraws;
                    } else {
                        status[lotteryId] = {
                            success: false,
                            message: 'Nenhum dado encontrado'
                        };
                    }
                } else {
                    status[lotteryId] = {
                        success: false,
                        message: `HTTP ${response.status}`
                    };
                }
            } catch (error) {
                status[lotteryId] = {
                    success: false,
                    error: error.message
                };
            }
        }

        return res.status(200).json({
            success: true,
            timestamp: new Date().toISOString(),
            lotteries: status,
            summary: {
                totalLotteries: lotteries.length,
                successfulLotteries: Object.values(status).filter(s => s.success).length,
                totalDraws: totalDraws
            }
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            timestamp: new Date().toISOString(),
            error: error.message
        });
    }
}