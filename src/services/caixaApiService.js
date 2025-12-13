/**
 * Caixa Lottery API Service
 * Fetches historical lottery data from Caixa's official APIs
 */

/**
 * Base URLs for Caixa lottery APIs
 */
const API_URLS = {
    LOTOFACIL: 'https://servicebus2.caixa.gov.br/portaldeloterias/api/lotofacil',
    MEGASENA: 'https://servicebus2.caixa.gov.br/portaldeloterias/api/megasena'
};

/**
 * Fetch data from Caixa API with retry logic
 * @param {string} url - API URL
 * @param {number} retries - Number of retries
 * @returns {Promise<Object>} API response data
 */
async function fetchWithRetry(url, retries = 3) {
    for (let i = 0; i < retries; i++) {
        try {
            console.log(`Fetching: ${url} (attempt ${i + 1}/${retries})`);
            
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json'
                },
                // Add mode to handle CORS if needed
                mode: 'cors'
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}`);
            }

            const data = await response.json();
            
            // Validate that we got valid data
            if (!data || typeof data !== 'object') {
                throw new Error('Invalid response format');
            }
            
            return data;
        } catch (error) {
            console.warn(`Attempt ${i + 1} failed:`, error.message);
            
            if (i === retries - 1) {
                throw error;
            }
            
            // Wait before retry (exponential backoff)
            await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
        }
    }
}

/**
 * Fetch single contest data from API
 * @param {string} gameType - 'lotofacil' or 'megasena'
 * @param {number} contestNumber - Contest number (optional, gets latest if not provided)
 * @returns {Promise<Object>} Contest data
 */
async function fetchSingleContest(gameType, contestNumber = null) {
    const baseUrl = gameType === 'lotofacil' ? API_URLS.LOTOFACIL : API_URLS.MEGASENA;
    const url = contestNumber ? `${baseUrl}/${contestNumber}` : baseUrl;
    
    return await fetchWithRetry(url);
}

/**
 * Fetch historical data for a game by fetching multiple contests
 * @param {string} gameType - 'lotofacil' or 'megasena'
 * @param {number} maxContests - Maximum number of contests to fetch (default: 20)
 * @returns {Promise<Array>} Array of contest data
 */
async function fetchHistoricalData(gameType, maxContests = 20) {
    console.log(`🔄 Fetching historical ${gameType} data...`);
    
    try {
        // First, get the latest contest to know the current contest number
        const latestContest = await fetchSingleContest(gameType);
        const latestNumber = latestContest.numero;
        
        console.log(`Latest ${gameType} contest: ${latestNumber}`);
        
        // Calculate starting contest number
        const startContest = Math.max(1, latestNumber - maxContests + 1);
        
        console.log(`Fetching contests ${startContest} to ${latestNumber} (${latestNumber - startContest + 1} contests)`);
        
        const contests = [];
        const batchSize = 5; // Smaller batches to be more respectful to the API
        
        for (let i = startContest; i <= latestNumber; i += batchSize) {
            const batchPromises = [];
            const batchEnd = Math.min(i + batchSize - 1, latestNumber);
            
            console.log(`Fetching batch: contests ${i} to ${batchEnd}`);
            
            for (let contestNum = i; contestNum <= batchEnd; contestNum++) {
                batchPromises.push(
                    fetchSingleContest(gameType, contestNum)
                        .catch(error => {
                            console.warn(`Failed to fetch contest ${contestNum}:`, error.message);
                            return null; // Return null for failed requests
                        })
                );
            }
            
            const batchResults = await Promise.all(batchPromises);
            
            // Filter out null results (failed requests)
            const validResults = batchResults.filter(result => result !== null);
            contests.push(...validResults);
            
            // Add delay between batches to be respectful to the API
            if (i + batchSize <= latestNumber) {
                await new Promise(resolve => setTimeout(resolve, 500)); // 500ms delay
            }
            
            // Show progress
            console.log(`Progress: ${contests.length}/${latestNumber - startContest + 1} contests fetched`);
        }
        
        console.log(`✅ Successfully fetched ${contests.length} ${gameType} contests`);
        return contests;
        
    } catch (error) {
        console.error(`❌ Error fetching ${gameType} historical data:`, error);
        throw error;
    }
}

/**
 * Transform Lotofácil API response to internal format
 * @param {Array} apiData - Array of API contest objects
 * @returns {Array} Array of draw objects in internal format
 */
function transformLotofacilData(apiData) {
    return apiData.map(contest => {
        try {
            // Use listaDezenas (sorted numbers) as primary source
            const numbers = contest.listaDezenas || contest.dezenasSorteadasOrdemSorteio || [];
            
            if (!Array.isArray(numbers) || numbers.length < 15) {
                console.warn(`Contest ${contest.numero}: Invalid numbers array`, numbers);
                return null;
            }
            
            const validNumbers = numbers.slice(0, 15)
                .map(num => parseInt(num))
                .filter(num => !isNaN(num) && num >= 1 && num <= 25);
            
            if (validNumbers.length !== 15) {
                console.warn(`Contest ${contest.numero}: Expected 15 numbers, got ${validNumbers.length}`);
                return null;
            }
            
            return {
                concurso: contest.numero,
                data: contest.dataApuracao || contest.dataRealizacao,
                numeros: validNumbers.sort((a, b) => a - b) // Ensure numbers are sorted
            };
        } catch (error) {
            console.warn(`Error transforming contest ${contest.numero}:`, error);
            return null;
        }
    }).filter(draw => draw !== null); // Remove failed transformations
}

/**
 * Transform Mega-Sena API response to internal format
 * @param {Array} apiData - Array of API contest objects
 * @returns {Array} Array of draw objects in internal format
 */
function transformMegaSenaData(apiData) {
    return apiData.map(contest => {
        try {
            // Use listaDezenas (sorted numbers) as primary source
            const numbers = contest.listaDezenas || contest.dezenasSorteadasOrdemSorteio || [];
            
            if (!Array.isArray(numbers) || numbers.length < 6) {
                console.warn(`Contest ${contest.numero}: Invalid numbers array`, numbers);
                return null;
            }
            
            const validNumbers = numbers.slice(0, 6)
                .map(num => parseInt(num))
                .filter(num => !isNaN(num) && num >= 1 && num <= 60);
            
            if (validNumbers.length !== 6) {
                console.warn(`Contest ${contest.numero}: Expected 6 numbers, got ${validNumbers.length}`);
                return null;
            }
            
            return {
                concurso: contest.numero,
                data: contest.dataApuracao || contest.dataRealizacao,
                numeros: validNumbers.sort((a, b) => a - b) // Ensure numbers are sorted
            };
        } catch (error) {
            console.warn(`Error transforming contest ${contest.numero}:`, error);
            return null;
        }
    }).filter(draw => draw !== null); // Remove failed transformations
}

/**
 * Fetch and parse Lotofácil data from Caixa API
 * @param {number} maxContests - Maximum number of contests to fetch
 * @returns {Promise<Array>} Array of draw objects
 */
export async function fetchLotofacilData(maxContests = 20) {
    try {
        console.log(`🔄 Attempting to fetch ${maxContests} Lotofácil contests...`);
        
        // Try to fetch historical data
        const apiData = await fetchHistoricalData('lotofacil', maxContests);
        const draws = transformLotofacilData(apiData);
        
        console.log(`📊 Processed ${draws.length} Lotofácil draws from API`);
        
        // Sort by contest number (oldest first)
        draws.sort((a, b) => a.concurso - b.concurso);
        
        return draws;
    } catch (error) {
        console.error('Error fetching Lotofácil historical data:', error);
        
        // Fallback: try to get just the latest contest
        try {
            console.log('🔄 Fallback: fetching only latest Lotofácil contest...');
            const latestContest = await fetchSingleContest('lotofacil');
            const draws = transformLotofacilData([latestContest]);
            
            if (draws.length > 0) {
                console.log(`📊 Using latest Lotofácil contest: ${draws[0].concurso}`);
                return draws;
            }
        } catch (fallbackError) {
            console.error('Fallback also failed:', fallbackError);
        }
        
        throw new Error(`Erro ao carregar dados da Lotofácil: ${error.message}`);
    }
}

/**
 * Fetch and parse Mega-Sena data from Caixa API
 * @param {number} maxContests - Maximum number of contests to fetch
 * @returns {Promise<Array>} Array of draw objects
 */
export async function fetchMegaSenaData(maxContests = 20) {
    try {
        console.log(`🔄 Attempting to fetch ${maxContests} Mega-Sena contests...`);
        
        // Try to fetch historical data
        const apiData = await fetchHistoricalData('megasena', maxContests);
        const draws = transformMegaSenaData(apiData);
        
        console.log(`📊 Processed ${draws.length} Mega-Sena draws from API`);
        
        // Sort by contest number (oldest first)
        draws.sort((a, b) => a.concurso - b.concurso);
        
        return draws;
    } catch (error) {
        console.error('Error fetching Mega-Sena historical data:', error);
        
        // Fallback: try to get just the latest contest
        try {
            console.log('🔄 Fallback: fetching only latest Mega-Sena contest...');
            const latestContest = await fetchSingleContest('megasena');
            const draws = transformMegaSenaData([latestContest]);
            
            if (draws.length > 0) {
                console.log(`📊 Using latest Mega-Sena contest: ${draws[0].concurso}`);
                return draws;
            }
        } catch (fallbackError) {
            console.error('Fallback also failed:', fallbackError);
        }
        
        throw new Error(`Erro ao carregar dados da Mega-Sena: ${error.message}`);
    }
}

/**
 * Test API connectivity
 * @returns {Promise<Object>} Test results
 */
export async function testApiConnectivity() {
    const results = {
        lotofacil: { success: false, error: null },
        megasena: { success: false, error: null }
    };
    
    try {
        console.log('🔍 Testing Lotofácil API...');
        await fetchSingleContest('lotofacil');
        results.lotofacil.success = true;
        console.log('✅ Lotofácil API working');
    } catch (error) {
        results.lotofacil.error = error.message;
        console.error('❌ Lotofácil API failed:', error.message);
    }
    
    try {
        console.log('🔍 Testing Mega-Sena API...');
        await fetchSingleContest('megasena');
        results.megasena.success = true;
        console.log('✅ Mega-Sena API working');
    } catch (error) {
        results.megasena.error = error.message;
        console.error('❌ Mega-Sena API failed:', error.message);
    }
    
    return results;
}