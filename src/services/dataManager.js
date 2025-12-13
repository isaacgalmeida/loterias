/**
 * Data Manager - Sistema de cache local para dados das loterias
 * Gerencia armazenamento local em JSON e sincronização com APIs
 */

/**
 * Configuração dos jogos suportados
 */
const LOTTERY_CONFIGS = {
    lotofacil: {
        id: 'lotofacil',
        name: 'Lotofácil',
        apiUrl: 'https://servicebus2.caixa.gov.br/portaldeloterias/api/lotofacil',
        numbersCount: 15,
        minNumber: 1,
        maxNumber: 25,
        cacheFile: 'data/lotofacil.json'
    },
    megasena: {
        id: 'megasena',
        name: 'Mega-Sena',
        apiUrl: 'https://servicebus2.caixa.gov.br/portaldeloterias/api/megasena',
        numbersCount: 6,
        minNumber: 1,
        maxNumber: 60,
        cacheFile: 'data/megasena.json'
    }
    // Estrutura preparada para adicionar outras loterias:
    // quina: {
    //     id: 'quina',
    //     name: 'Quina',
    //     apiUrl: 'https://servicebus2.caixa.gov.br/portaldeloterias/api/quina',
    //     numbersCount: 5,
    //     minNumber: 1,
    //     maxNumber: 80,
    //     cacheFile: 'data/quina.json'
    // }
};

/**
 * Classe para gerenciar dados de uma loteria específica
 */
class LotteryDataManager {
    constructor(lotteryConfig) {
        this.config = lotteryConfig;
        this.cachedData = null;
        this.lastSync = null;
    }

    /**
     * Carrega dados do cache local
     * @returns {Promise<Array>} Array de sorteios
     */
    async loadFromCache() {
        try {
            // Detecta se está rodando em Node.js (servidor) ou browser
            const isNodeJS = typeof process !== 'undefined' && process.versions && process.versions.node;
            
            if (isNodeJS) {
                // Ambiente Node.js - lê arquivo diretamente
                const fs = await import('fs/promises');
                const path = await import('path');
                
                const filePath = path.join('./public', this.config.cacheFile);
                
                try {
                    const fileContent = await fs.readFile(filePath, 'utf8');
                    const data = JSON.parse(fileContent);
                    
                    console.log(`📁 Loaded ${data.draws.length} ${this.config.name} draws from cache`);
                    
                    this.cachedData = data.draws;
                    this.lastSync = data.metadata.lastUpdate;
                    
                    return data;
                } catch (fileError) {
                    if (fileError.code === 'ENOENT') {
                        console.log(`📁 Cache file not found for ${this.config.name}, will create new one`);
                    } else {
                        console.warn(`⚠️ Error reading cache file for ${this.config.name}:`, fileError.message);
                    }
                    return { draws: [], metadata: { lastUpdate: null, totalDraws: 0 } };
                }
            } else {
                // Ambiente browser - usa fetch
                const response = await fetch(`/${this.config.cacheFile}`);
                if (!response.ok) {
                    console.log(`📁 Cache file not found for ${this.config.name}, will create new one`);
                    return { draws: [], metadata: { lastUpdate: null, totalDraws: 0 } };
                }
                
                const data = await response.json();
                console.log(`📁 Loaded ${data.draws.length} ${this.config.name} draws from cache`);
                
                this.cachedData = data.draws;
                this.lastSync = data.metadata.lastUpdate;
                
                return data;
            }
        } catch (error) {
            console.warn(`⚠️ Error loading cache for ${this.config.name}:`, error);
            return { draws: [], metadata: { lastUpdate: null, totalDraws: 0 } };
        }
    }

    /**
     * Salva dados no cache local
     * @param {Array} draws - Array de sorteios
     * @returns {Promise<void>}
     */
    async saveToCache(draws) {
        const data = {
            metadata: {
                lastUpdate: new Date().toISOString(),
                totalDraws: draws.length,
                lotteryType: this.config.id,
                version: '1.0'
            },
            draws: draws.sort((a, b) => a.concurso - b.concurso) // Sempre ordenado por concurso
        };

        try {
            // Detecta se está rodando em Node.js (servidor) ou browser
            const isNodeJS = typeof process !== 'undefined' && process.versions && process.versions.node;
            
            if (isNodeJS) {
                // Ambiente Node.js - salva arquivo real
                const fs = await import('fs/promises');
                const path = await import('path');
                
                const filePath = path.join('./public', this.config.cacheFile);
                
                // Garante que o diretório existe
                await fs.mkdir(path.dirname(filePath), { recursive: true });
                
                // Salva arquivo JSON
                await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
                
                console.log(`💾 Saved ${draws.length} ${this.config.name} draws to ${filePath}`);
            } else {
                // Ambiente browser - apenas simula (não pode escrever arquivos)
                console.log(`💾 Would save ${draws.length} ${this.config.name} draws to ${this.config.cacheFile} (browser mode)`);
            }
            
            this.cachedData = draws;
            this.lastSync = data.metadata.lastUpdate;
            
            return data;
        } catch (error) {
            console.error(`❌ Error saving cache for ${this.config.name}:`, error);
            throw error;
        }
    }

    /**
     * Busca dados da API da Caixa
     * @param {number} contestNumber - Número do concurso (opcional)
     * @returns {Promise<Object>} Dados do concurso
     */
    async fetchFromAPI(contestNumber = null) {
        const url = contestNumber ? `${this.config.apiUrl}/${contestNumber}` : this.config.apiUrl;
        
        try {
            const response = await fetch(url, {
                method: 'GET',
                headers: { 'Accept': 'application/json' },
                mode: 'cors'
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error(`❌ API fetch failed for ${this.config.name}:`, error);
            throw error;
        }
    }

    /**
     * Transforma dados da API para formato interno
     * @param {Object} apiData - Dados da API
     * @returns {Object|null} Sorteio formatado ou null se inválido
     */
    transformAPIData(apiData) {
        try {
            const numbers = apiData.listaDezenas || apiData.dezenasSorteadasOrdemSorteio || [];
            
            if (!Array.isArray(numbers) || numbers.length < this.config.numbersCount) {
                console.warn(`Contest ${apiData.numero}: Invalid numbers array`, numbers);
                return null;
            }
            
            const validNumbers = numbers.slice(0, this.config.numbersCount)
                .map(num => parseInt(num))
                .filter(num => !isNaN(num) && num >= this.config.minNumber && num <= this.config.maxNumber);
            
            if (validNumbers.length !== this.config.numbersCount) {
                console.warn(`Contest ${apiData.numero}: Expected ${this.config.numbersCount} numbers, got ${validNumbers.length}`);
                return null;
            }
            
            return {
                concurso: apiData.numero,
                data: apiData.dataApuracao || apiData.dataRealizacao,
                numeros: validNumbers.sort((a, b) => a - b),
                // Dados extras que podem ser úteis
                acumulado: apiData.acumulado || false,
                valorEstimadoProximoConcurso: apiData.valorEstimadoProximoConcurso || 0,
                dataProximoConcurso: apiData.dataProximoConcurso || null
            };
        } catch (error) {
            console.warn(`Error transforming contest ${apiData.numero}:`, error);
            return null;
        }
    }

    /**
     * Sincroniza dados - baixa apenas novos sorteios
     * @param {boolean} forceFullSync - Força sincronização completa
     * @returns {Promise<Array>} Array de sorteios atualizados
     */
    async syncData(forceFullSync = false) {
        console.log(`🔄 Starting sync for ${this.config.name}...`);
        
        try {
            // Carrega dados do cache
            const cachedData = await this.loadFromCache();
            let existingDraws = cachedData.draws || [];
            
            // Busca o último concurso disponível na API
            const latestAPIData = await this.fetchFromAPI();
            const latestContestNumber = latestAPIData.numero;
            
            console.log(`📊 Latest ${this.config.name} contest: ${latestContestNumber}`);
            
            // Determina quais concursos precisam ser baixados
            let contestsToFetch = [];
            
            if (forceFullSync || existingDraws.length === 0) {
                // Sincronização completa - baixa todos os concursos disponíveis
                console.log(`🔄 Full sync for ${this.config.name} - fetching all contests`);
                
                // Baixa todos os concursos disponíveis (começando do concurso 1)
                const startContest = 1;
                contestsToFetch = Array.from(
                    { length: latestContestNumber - startContest + 1 }, 
                    (_, i) => startContest + i
                );
            } else {
                // Sincronização incremental - baixa apenas novos concursos
                const lastCachedContest = Math.max(...existingDraws.map(d => d.concurso));
                
                if (latestContestNumber > lastCachedContest) {
                    contestsToFetch = Array.from(
                        { length: latestContestNumber - lastCachedContest }, 
                        (_, i) => lastCachedContest + i + 1
                    );
                    console.log(`🔄 Incremental sync for ${this.config.name} - fetching contests ${lastCachedContest + 1} to ${latestContestNumber}`);
                } else {
                    console.log(`✅ ${this.config.name} is up to date (latest: ${lastCachedContest})`);
                    return existingDraws;
                }
            }
            
            // Baixa novos concursos em lotes
            const newDraws = await this.fetchContestsInBatches(contestsToFetch);
            
            // Combina dados existentes com novos (remove duplicatas)
            const allDraws = this.mergeDraws(existingDraws, newDraws);
            
            // Salva no cache
            await this.saveToCache(allDraws);
            
            console.log(`✅ ${this.config.name} sync completed: ${allDraws.length} total draws (${newDraws.length} new)`);
            
            return allDraws;
            
        } catch (error) {
            console.error(`❌ Sync failed for ${this.config.name}:`, error);
            
            // Em caso de erro, retorna dados do cache se disponíveis
            const cachedData = await this.loadFromCache();
            if (cachedData.draws.length > 0) {
                console.log(`🔄 Using cached data for ${this.config.name}: ${cachedData.draws.length} draws`);
                return cachedData.draws;
            }
            
            throw error;
        }
    }

    /**
     * Baixa concursos em lotes para não sobrecarregar a API
     * @param {Array} contestNumbers - Array de números de concursos
     * @returns {Promise<Array>} Array de sorteios
     */
    async fetchContestsInBatches(contestNumbers) {
        const batchSize = 5; // Lotes menores para evitar erro 429
        const delay = 1000; // Delay maior para ser mais conservador com a API
        const allDraws = [];
        
        for (let i = 0; i < contestNumbers.length; i += batchSize) {
            const batch = contestNumbers.slice(i, i + batchSize);
            
            console.log(`📥 Fetching ${this.config.name} batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(contestNumbers.length/batchSize)}: contests ${batch[0]} to ${batch[batch.length-1]}`);
            
            const batchPromises = batch.map(async (contestNumber) => {
                try {
                    const apiData = await this.fetchFromAPI(contestNumber);
                    return this.transformAPIData(apiData);
                } catch (error) {
                    console.warn(`⚠️ Failed to fetch contest ${contestNumber}:`, error.message);
                    return null;
                }
            });
            
            const batchResults = await Promise.all(batchPromises);
            const validDraws = batchResults.filter(draw => draw !== null);
            
            allDraws.push(...validDraws);
            
            // Delay entre lotes (exceto no último)
            if (i + batchSize < contestNumbers.length) {
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
        
        return allDraws;
    }

    /**
     * Combina dados existentes com novos, removendo duplicatas
     * @param {Array} existingDraws - Sorteios existentes
     * @param {Array} newDraws - Novos sorteios
     * @returns {Array} Array combinado sem duplicatas
     */
    mergeDraws(existingDraws, newDraws) {
        const existingContests = new Set(existingDraws.map(d => d.concurso));
        const uniqueNewDraws = newDraws.filter(d => !existingContests.has(d.concurso));
        
        return [...existingDraws, ...uniqueNewDraws].sort((a, b) => a.concurso - b.concurso);
    }

    /**
     * Obtém estatísticas dos dados
     * @returns {Object} Estatísticas
     */
    getStats() {
        if (!this.cachedData) return null;
        
        return {
            totalDraws: this.cachedData.length,
            firstContest: this.cachedData.length > 0 ? Math.min(...this.cachedData.map(d => d.concurso)) : null,
            lastContest: this.cachedData.length > 0 ? Math.max(...this.cachedData.map(d => d.concurso)) : null,
            lastSync: this.lastSync
        };
    }
}

/**
 * Gerenciador principal de dados
 */
class DataManager {
    constructor() {
        this.lotteryManagers = {};
        
        // Inicializa gerenciadores para cada loteria
        Object.values(LOTTERY_CONFIGS).forEach(config => {
            this.lotteryManagers[config.id] = new LotteryDataManager(config);
        });
    }

    /**
     * Sincroniza dados de todas as loterias
     * @param {boolean} forceFullSync - Força sincronização completa
     * @returns {Promise<Object>} Dados de todas as loterias
     */
    async syncAllLotteries(forceFullSync = false) {
        console.log('🚀 Starting sync for all lotteries...');
        
        const results = {};
        const errors = {};
        
        for (const [lotteryId, manager] of Object.entries(this.lotteryManagers)) {
            try {
                results[lotteryId] = await manager.syncData(forceFullSync);
            } catch (error) {
                console.error(`❌ Failed to sync ${lotteryId}:`, error);
                errors[lotteryId] = error.message;
                results[lotteryId] = []; // Array vazio em caso de erro
            }
        }
        
        console.log('✅ Sync completed for all lotteries');
        
        return { results, errors };
    }

    /**
     * Obtém dados de uma loteria específica
     * @param {string} lotteryId - ID da loteria
     * @param {boolean} autoSync - Se deve sincronizar automaticamente
     * @returns {Promise<Array>} Array de sorteios
     */
    async getLotteryData(lotteryId, autoSync = true) {
        const manager = this.lotteryManagers[lotteryId];
        if (!manager) {
            throw new Error(`Lottery ${lotteryId} not supported`);
        }
        
        if (autoSync) {
            return await manager.syncData();
        } else {
            const cachedData = await manager.loadFromCache();
            return cachedData.draws;
        }
    }

    /**
     * Adiciona suporte para nova loteria
     * @param {Object} config - Configuração da loteria
     */
    addLotterySupport(config) {
        LOTTERY_CONFIGS[config.id] = config;
        this.lotteryManagers[config.id] = new LotteryDataManager(config);
        console.log(`✅ Added support for ${config.name}`);
    }

    /**
     * Lista loterias suportadas
     * @returns {Array} Array de configurações
     */
    getSupportedLotteries() {
        return Object.values(LOTTERY_CONFIGS);
    }

    /**
     * Obtém estatísticas de todas as loterias
     * @returns {Object} Estatísticas por loteria
     */
    getAllStats() {
        const stats = {};
        
        Object.entries(this.lotteryManagers).forEach(([lotteryId, manager]) => {
            stats[lotteryId] = manager.getStats();
        });
        
        return stats;
    }
}

// Instância singleton do gerenciador
const dataManager = new DataManager();

export default dataManager;
export { LOTTERY_CONFIGS, LotteryDataManager, DataManager };