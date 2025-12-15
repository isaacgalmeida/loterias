/**
 * Number Generator Component
 * UI for generating lottery number combinations
 */

/**
 * Render number generator interface
 * @param {Function} onGenerate - Callback when generate button is clicked
 * @param {Object} currentGame - Current game configuration
 */
export function renderNumberGenerator(onGenerate, currentGame) {
  const container = document.getElementById('number-generator');
  if (!container) return;

  container.innerHTML = `
    <div class="generator-form">
      <div class="form-row">
        <div class="form-group">
          <label for="game-count">Quantos jogos você quer gerar?</label>
          <input 
            type="number" 
            id="game-count" 
            min="1" 
            max="100" 
            value="5"
            class="form-input"
          />
        </div>

        <div class="form-group">
          <label for="numbers-per-game">Números por jogo</label>
          <select id="numbers-per-game" class="form-select">
            <!-- Options will be populated by JavaScript based on current game -->
          </select>
        </div>
        
        <div class="form-group">
          <label for="strategy">Estratégia de Geração</label>
          <select id="strategy" class="form-select">
            <option value="smart-mix">🎯 Mix Inteligente (Recomendado)</option>
            <option value="frequency">📊 Baseado em Frequência</option>
            <option value="pattern">⚖️ Baseado em Padrões</option>
            <option value="random">🎲 Aleatório Puro</option>
            <option value="balanced">⚖️ Distribuição Balanceada</option>
            <option value="co-occurrence">🔗 Co-ocorrência</option>
            <option value="weighted-random">📈 Geração Ponderada</option>
            <option value="filtered">🔍 Exclusão de Improváveis</option>
            <option value="coverage">🎯 Varredura de Cobertura</option>
            <option value="combinatorial">🧮 Filtros Combinatórios</option>
          </select>
        </div>
      </div>
      
      <div class="form-row">
        <button id="generate-btn" class="btn-primary">
          <span class="btn-icon">✨</span>
          <span>Gerar Números</span>
        </button>
      </div>
      
      <div class="strategy-info">
        <div class="info-card" id="strategy-description">
          <strong>🎯 Mix Inteligente:</strong> Combina números quentes (40%), números atrasados (30%) e números aleatórios (30%) para criar uma combinação balanceada baseada em análise estatística.
        </div>
      </div>
    </div>
  `;

  // Populate numbers per game options based on current game
  populateNumbersPerGame(currentGame);

  // Add styles
  addGeneratorStyles();

  // Add event listeners
  const generateBtn = document.getElementById('generate-btn');
  const strategySelect = document.getElementById('strategy');
  const gameCountInput = document.getElementById('game-count');
  const numbersPerGameSelect = document.getElementById('numbers-per-game');

  // Update strategy description
  strategySelect.addEventListener('change', updateStrategyDescription);

  // Generate button click
  generateBtn.addEventListener('click', () => {
    const count = parseInt(gameCountInput.value);
    const strategy = strategySelect.value;
    const numbersPerGame = parseInt(numbersPerGameSelect.value);

    if (count < 1 || count > 100) {
      alert('Por favor, escolha entre 1 e 100 jogos.');
      return;
    }

    // Show loading state
    generateBtn.disabled = true;
    generateBtn.innerHTML = `
      <span class="spinner-small"></span>
      <span>Gerando...</span>
    `;

    // Call callback with slight delay for UX
    setTimeout(() => {
      onGenerate(strategy, count, numbersPerGame);

      // Reset button
      generateBtn.disabled = false;
      generateBtn.innerHTML = `
        <span class="btn-icon">✨</span>
        <span>Gerar Números</span>
      `;
    }, 300);
  });
}

/**
 * Populate numbers per game options based on current game
 * @param {Object} currentGame - Current game configuration
 */
function populateNumbersPerGame(currentGame) {
  const select = document.getElementById('numbers-per-game');
  if (!select) return;

  let options = '';
  let minNumbers, maxNumbers, defaultNumbers;

  if (currentGame.id === 'lotofacil') {
    minNumbers = 15;
    maxNumbers = 20;
    defaultNumbers = 15;
  } else if (currentGame.id === 'megasena') {
    minNumbers = 6;
    maxNumbers = 20;
    defaultNumbers = 6;
  }

  for (let i = minNumbers; i <= maxNumbers; i++) {
    const selected = i === defaultNumbers ? 'selected' : '';
    options += `<option value="${i}" ${selected}>${i} números</option>`;
  }

  select.innerHTML = options;
}



/**
 * Update strategy description based on selection
 */
function updateStrategyDescription() {
  const strategy = document.getElementById('strategy').value;
  const descriptionEl = document.getElementById('strategy-description');

  const descriptions = {
    'smart-mix': '<strong>🎯 Mix Inteligente:</strong> Combina automaticamente frequência, distribuição balanceada, padrões, co-ocorrência e filtros combinatórios para gerar jogos equilibrados e coerentes.',
    'frequency': '<strong>📊 Baseado em Frequência:</strong> Seleciona números com base em frequência absoluta e relativa. Mistura números quentes (alta frequência), médios e frios (baixa frequência) de forma proporcional.',
    'pattern': '<strong>⚖️ Baseado em Padrões:</strong> Identifica e replica padrões comuns encontrados no histórico: grupos, repetições típicas e formatos recorrentes de distribuição par/ímpar e baixo/alto.',
    'random': '<strong>🎲 Aleatório Puro:</strong> Geração totalmente aleatória sem filtros ou intervenções. Garante que não repita jogos idênticos já gerados.',
    'balanced': '<strong>⚖️ Distribuição Balanceada:</strong> Equilibra o jogo em pares/ímpares, baixos/altos e distribuição por faixas. Evita extremos estatisticamente improváveis.',
    'co-occurrence': '<strong>🔗 Co-ocorrência:</strong> Escolhe números que aparecem juntos com frequência no histórico. Usa pares e trios estatisticamente relevantes identificados nos sorteios.',
    'weighted-random': '<strong>📈 Geração Ponderada:</strong> Gera números aleatórios com pesos baseados em frequência, co-ocorrência e posição histórica. Mantém aleatoriedade com tendência suave.',
    'filtered': '<strong>🔍 Exclusão de Improváveis:</strong> Filtra automaticamente combinações improváveis: sequências longas, somas extremas, concentração regional excessiva e repetições recentes.',
    'coverage': '<strong>🎯 Varredura de Cobertura:</strong> Ao gerar múltiplos jogos, diversifica ao máximo, evita repetições entre jogos e maximiza a cobertura do conjunto total de números.',
    'combinatorial': '<strong>🧮 Filtros Combinatórios:</strong> Aplica filtros matemáticos: limita números consecutivos, controla repetições, equilibra somas e distribui por regiões.'
  };

  descriptionEl.innerHTML = descriptions[strategy] || descriptions['smart-mix'];
}

/**
 * Add component styles
 */
function addGeneratorStyles() {
  if (document.getElementById('generator-styles')) return;

  const style = document.createElement('style');
  style.id = 'generator-styles';
  style.textContent = `
    .generator-form {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-xl);
    }
    
    .form-row {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: var(--spacing-lg);
    }
    
    .form-group {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-sm);
    }
    
    .form-group label {
      font-size: var(--font-size-sm);
      font-weight: 600;
      color: var(--color-text-secondary);
    }
    
    .form-input, .form-select {
      padding: var(--spacing-md);
      background: rgba(30, 41, 59, 0.6);
      border: 1px solid var(--glass-border);
      border-radius: var(--radius-md);
      color: var(--color-text-primary);
      font-size: var(--font-size-base);
      font-family: var(--font-family);
      transition: all var(--transition-base);
    }
    
    .form-input:focus, .form-select:focus {
      outline: none;
      border-color: var(--color-accent-primary);
      box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1);
    }
    
    .form-input:hover, .form-select:hover {
      border-color: rgba(139, 92, 246, 0.3);
    }
    
    .btn-primary {
      padding: var(--spacing-lg) var(--spacing-2xl);
      background: var(--gradient-primary);
      border: none;
      border-radius: var(--radius-lg);
      color: white;
      font-size: var(--font-size-lg);
      font-weight: 600;
      font-family: var(--font-family);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: var(--spacing-md);
      transition: all var(--transition-base);
      box-shadow: var(--shadow-lg);
    }
    
    .btn-primary:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: var(--shadow-xl), var(--shadow-glow);
    }
    
    .btn-primary:active:not(:disabled) {
      transform: translateY(0);
    }
    
    .btn-primary:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
    
    .btn-icon {
      font-size: var(--font-size-xl);
      filter: drop-shadow(0 0 4px rgba(255, 255, 255, 0.3));
    }
    
    .strategy-info {
      margin-top: var(--spacing-md);
    }
    
    .info-card {
      padding: var(--spacing-lg);
      background: rgba(139, 92, 246, 0.1);
      border: 1px solid rgba(139, 92, 246, 0.2);
      border-radius: var(--radius-md);
      font-size: var(--font-size-sm);
      line-height: 1.6;
      color: var(--color-text-secondary);
    }
    
    .info-card strong {
      color: var(--color-text-primary);
    }
    
    .spinner-small {
      display: inline-block;
      width: 20px;
      height: 20px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
    
    /* Mobile responsiveness */
    @media (max-width: 480px) {
      .generator-form {
        gap: var(--spacing-lg);
      }
      
      .form-row {
        grid-template-columns: 1fr;
        gap: var(--spacing-md);
      }
      
      .form-group label {
        font-size: var(--font-size-sm);
      }
      
      .form-input, .form-select {
        padding: var(--spacing-sm);
        font-size: var(--font-size-sm);
      }
      
      .btn-primary {
        width: 100%;
        padding: var(--spacing-md) var(--spacing-lg);
        font-size: var(--font-size-base);
      }
      
      .info-card {
        padding: var(--spacing-md);
        font-size: var(--font-size-sm);
      }
    }
    
    @media (min-width: 481px) and (max-width: 768px) {
      .form-row {
        grid-template-columns: 1fr;
      }
      
      .btn-primary {
        width: 100%;
      }
    }
    
    @media (min-width: 769px) {
      .form-row {
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      }
    }
  `;

  document.head.appendChild(style);
}
