/**
 * API de teste para verificar se os arquivos estão acessíveis
 */

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        const results = {};
        
        // Informações do ambiente
        results.environment = {
            cwd: process.cwd(),
            host: req.headers.host,
            userAgent: req.headers['user-agent'],
            timestamp: new Date().toISOString()
        };
        
        // Testa acesso via fetch
        results.fetchTests = {};
        const baseUrl = req.headers.host ? `https://${req.headers.host}` : 'https://loterias.guiadainternet.com';
        
        for (const lottery of ['lotofacil', 'megasena']) {
            try {
                const dataUrl = `${baseUrl}/data/${lottery}.json`;
                const response = await fetch(dataUrl);
                
                results.fetchTests[lottery] = {
                    url: dataUrl,
                    status: response.status,
                    statusText: response.statusText,
                    ok: response.ok
                };
                
                if (response.ok) {
                    const data = await response.json();
                    results.fetchTests[lottery].dataSize = data.draws?.length || 0;
                    results.fetchTests[lottery].lastUpdate = data.metadata?.lastUpdate;
                }
            } catch (error) {
                results.fetchTests[lottery] = {
                    error: error.message
                };
            }
        }
        
        // Testa acesso via sistema de arquivos
        results.fsTests = {};
        try {
            const fs = await import('fs/promises');
            const path = await import('path');
            
            for (const lottery of ['lotofacil', 'megasena']) {
                const possiblePaths = [
                    path.join(process.cwd(), 'public', 'data', `${lottery}.json`),
                    path.join(process.cwd(), 'dist', 'data', `${lottery}.json`),
                    path.join(process.cwd(), 'data', `${lottery}.json`),
                    path.join(process.cwd(), `${lottery}.json`)
                ];
                
                results.fsTests[lottery] = {};
                
                for (const filePath of possiblePaths) {
                    try {
                        const stats = await fs.stat(filePath);
                        const fileContent = await fs.readFile(filePath, 'utf8');
                        const data = JSON.parse(fileContent);
                        
                        results.fsTests[lottery][filePath] = {
                            exists: true,
                            size: stats.size,
                            dataSize: data.draws?.length || 0,
                            lastUpdate: data.metadata?.lastUpdate
                        };
                    } catch (error) {
                        results.fsTests[lottery][filePath] = {
                            exists: false,
                            error: error.code || error.message
                        };
                    }
                }
            }
        } catch (error) {
            results.fsTests.error = error.message;
        }
        
        // Lista diretórios
        results.directories = {};
        try {
            const fs = await import('fs/promises');
            const path = await import('path');
            
            const dirsToCheck = [
                process.cwd(),
                path.join(process.cwd(), 'public'),
                path.join(process.cwd(), 'public', 'data'),
                path.join(process.cwd(), 'dist'),
                path.join(process.cwd(), 'dist', 'data')
            ];
            
            for (const dir of dirsToCheck) {
                try {
                    const files = await fs.readdir(dir);
                    results.directories[dir] = files;
                } catch (error) {
                    results.directories[dir] = { error: error.message };
                }
            }
        } catch (error) {
            results.directories.error = error.message;
        }
        
        return res.status(200).json({
            success: true,
            results
        });
        
    } catch (error) {
        return res.status(500).json({
            success: false,
            error: error.message,
            stack: error.stack
        });
    }
}