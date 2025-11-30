import { GAMES } from './utils/dataModels.js';
import { parseLotofacilData, parseMegaSenaData } from './utils/excelParser.js';
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
        showError('Erro ao carregar dados. Por favor, recarregue a página.');
    }
}

/**
 * Load game data from Excel files
 */
async function loadGameData() {
    console.log('📊 Loading lottery data...');

    try {
        // Load Lotofácil data
        console.log('Loading Lotofácil data...');
        appState.lotofacilDraws = await parseLotofacilData();
        appState.lotofacilStats = generateStatisticsReport(
            appState.lotofacilDraws,
            GAMES.LOTOFACIL
        );
        console.log(`✅ Loaded ${appState.lotofacilDraws.length} Lotofácil draws`);

        // Load Mega-Sena data
        console.log('Loading Mega-Sena data...');
        appState.megasenaDraws = await parseMegaSenaData();
        appState.megasenaStats = generateStatisticsReport(
            appState.megasenaDraws,
            GAMES.MEGASENA
        );
        console.log(`✅ Loaded ${appState.megasenaDraws.length} Mega-Sena draws`);
    } catch (error) {
        console.error('Error loading game data:', error);
        throw error;
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
    renderNumberGenerator(handleGenerate);
}

/**
 * Handle number generation
 * @param {string} strategy - Generation strategy
 * @param {number} count - Number of combinations to generate
 */
function handleGenerate(strategy, count) {
    console.log(`🎲 Generating ${count} combinations using ${strategy} strategy...`);

    const stats = appState.currentGame.id === 'lotofacil'
        ? appState.lotofacilStats
        : appState.megasenaStats;

    try {
        const combinations = generateMultipleCombinations(
            strategy,
            count,
            appState.currentGame,
            stats
        );

        console.log(`✅ Generated ${combinations.length} combinations`);

        // Render results
        renderResults(combinations, appState.currentGame);
    } catch (error) {
        console.error('Error generating combinations:', error);
        showError('Erro ao gerar números. Por favor, tente novamente.');
    }
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
