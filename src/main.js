import { GAMES } from './utils/dataModels.js';
import dataManager from './services/dataManager.js';
import { generateStatisticsReport } from './services/statisticsEngine.js';
import { generateMultipleCombinations } from './services/predictionEngine.js';
import { renderStatsDashboard } from './components/StatsDashboard.js';
import { renderNumberGenerator } from './components/NumberGenerator.js';
import { renderResults } from './components/ResultsDisplay.js';

/**
 * Main Application
 */

// Application state
const appState = {
    currentGame: GAMES.LOTOFACIL,
    lotofacilDraws: [],
    megasenaDraws: [],
    lotofacilStats: null,
    megasenaStats: null
};

/**
 * Initialize application
 */
async function initApp() {
    try {
        console.log('🚀 Initializing Lottery Analysis System...');
        console.log('💾 Using intelligent cache system with API sync');

        // Mostra loterias suportadas
        const supportedLotteries = dataManager.getSupportedLotteries();
        console.log('🎰 Supported lotteries:', supportedLotteries.map(l => l.name).join(', '));

        // Load data for both games
        await loadGameData();

        // Setup game selector
        setupGameSelector();

        // Render initial UI
        renderUI();

        // Hide loading, show content
        document.getElementById('loading-state').style.display = 'none';
        document.getElementById('main-content').style.display = 'block';

        console.log('✅ Application initialized successfully!');
    } catch (error) {
        console.error('❌ Failed to initialize application:', error);
        showError('Erro ao carregar dados das loterias. Verifique sua conexão com a internet e recarregue a página.');
    }
}

/**
 * Load game data using cache system with API sync
 */
async function loadGameData() {
    console.log('📊 Loading lottery data using cache system...');

    try {
        // Carrega dados da Lotofácil (cache + sync automático)
        console.log('Loading Lotofácil data...');
        appState.lotofacilDraws = await dataManager.getLotteryData('lotofacil', true);
        appState.lotofacilStats = generateStatisticsReport(
            appState.lotofacilDraws,
            GAMES.LOTOFACIL
        );
        console.log(`✅ Loaded ${appState.lotofacilDraws.length} Lotofácil draws`);

        // Carrega dados da Mega-Sena (cache + sync automático)
        console.log('Loading Mega-Sena data...');
        appState.megasenaDraws = await dataManager.getLotteryData('megasena', true);
        appState.megasenaStats = generateStatisticsReport(
            appState.megasenaDraws,
            GAMES.MEGASENA
        );
        console.log(`✅ Loaded ${appState.megasenaDraws.length} Mega-Sena draws`);

        // Mostra estatísticas do cache
        const stats = dataManager.getAllStats();
        console.log('📈 Cache statistics:', stats);

    } catch (error) {
        console.error('Error loading game data:', error);
        console.log('🔄 Attempting to use fallback data...');

        // Try to create minimal mock data for testing
        try {
            appState.lotofacilDraws = generateMockLotofacilData();
            appState.lotofacilStats = generateStatisticsReport(
                appState.lotofacilDraws,
                GAMES.LOTOFACIL
            );

            appState.megasenaDraws = generateMockMegaSenaData();
            appState.megasenaStats = generateStatisticsReport(
                appState.megasenaDraws,
                GAMES.MEGASENA
            );

            console.log('✅ Using fallback mock data');
        } catch (fallbackError) {
            console.error('Fallback also failed:', fallbackError);
            throw error; // Throw original API error
        }
    }
}

/**
 * Setup game selector buttons
 */
function setupGameSelector() {
    const buttons = document.querySelectorAll('.game-btn');

    buttons.forEach(btn => {
        btn.addEventListener('click', () => {
            const gameId = btn.dataset.game;

            // Update active state
            buttons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            // Switch game
            appState.currentGame = gameId === 'lotofacil' ? GAMES.LOTOFACIL : GAMES.MEGASENA;

            // Re-render UI
            renderUI();

            // Hide results section when switching games
            document.getElementById('results-section').style.display = 'none';
        });
    });
}

/**
 * Render UI for current game
 */
function renderUI() {
    const stats = appState.currentGame.id === 'lotofacil'
        ? appState.lotofacilStats
        : appState.megasenaStats;

    // Render statistics dashboard
    renderStatsDashboard(stats, appState.currentGame);

    // Render number generator
    renderNumberGenerator(handleGenerate, appState.currentGame);
}

/**
 * Handle number generation
 * @param {string} strategy - Generation strategy
 * @param {number} count - Number of combinations to generate
 * @param {number} numbersPerGame - Numbers per game (optional, uses default if not provided)
 */
function handleGenerate(strategy, count, numbersPerGame) {
    console.log(`🎲 Generating ${count} combinations using ${strategy} strategy...`);

    const stats = appState.currentGame.id === 'lotofacil'
        ? appState.lotofacilStats
        : appState.megasenaStats;

    try {
        // Create modified game config with custom numbers per game
        const gameConfig = { ...appState.currentGame };
        if (numbersPerGame) {
            gameConfig.numbersPerDraw = numbersPerGame;
        }

        const combinations = generateMultipleCombinations(
            strategy,
            count,
            gameConfig,
            stats
        );

        console.log(`✅ Generated ${combinations.length} combinations`);

        // Render results with the same modified game config
        renderResults(combinations, gameConfig);
    } catch (error) {
        console.error('Error generating combinations:', error);
        showError('Erro ao gerar números. Por favor, tente novamente.');
    }
}

/**
 * Generate mock Lotofácil data for testing
 * @returns {Array} Array of mock draw objects
 */
function generateMockLotofacilData() {
    const draws = [];
    for (let i = 1; i <= 50; i++) {
        const numbers = [];
        while (numbers.length < 15) {
            const num = Math.floor(Math.random() * 25) + 1;
            if (!numbers.includes(num)) {
                numbers.push(num);
            }
        }
        numbers.sort((a, b) => a - b);

        draws.push({
            concurso: 3500 + i,
            data: `${String(i).padStart(2, '0')}/11/2024`,
            numeros: numbers
        });
    }
    return draws;
}

/**
 * Generate mock Mega-Sena data for testing
 * @returns {Array} Array of mock draw objects
 */
function generateMockMegaSenaData() {
    const draws = [];
    for (let i = 1; i <= 50; i++) {
        const numbers = [];
        while (numbers.length < 6) {
            const num = Math.floor(Math.random() * 60) + 1;
            if (!numbers.includes(num)) {
                numbers.push(num);
            }
        }
        numbers.sort((a, b) => a - b);

        draws.push({
            concurso: 2700 + i,
            data: `${String(i).padStart(2, '0')}/11/2024`,
            numeros: numbers
        });
    }
    return draws;
}

/**
 * Show error message
 * @param {string} message - Error message
 */
function showError(message) {
    const loadingState = document.getElementById('loading-state');
    loadingState.innerHTML = `
    <div style="text-align: center; color: var(--color-accent-danger);">
      <h2>⚠️ Erro</h2>
      <p>${message}</p>
      <button onclick="location.reload()" style="
        margin-top: 1rem;
        padding: 0.75rem 1.5rem;
        background: var(--gradient-primary);
        border: none;
        border-radius: var(--radius-md);
        color: white;
        font-weight: 600;
        cursor: pointer;
      ">
        Recarregar Página
      </button>
    </div>
  `;
}

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}
