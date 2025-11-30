/**
 * Number Generator Component
 * UI for generating lottery number combinations
 */

/**
 * Render number generator interface
 * @param {Function} onGenerate - Callback when generate button is clicked
 */
export function renderNumberGenerator(onGenerate) {
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
          <label for="strategy">Estratégia de Geração</label>
          <select id="strategy" class="form-select">
            <option value="smart-mix">🎯 Mix Inteligente (Recomendado)</option>
            <option value="weighted">📊 Baseado em Frequência</option>
            <option value="pattern">⚖️ Baseado em Padrões</option>
            <option value="random">🎲 Aleatório Puro</option>
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

    // Add styles
    addGeneratorStyles();

    // Add event listeners
    const generateBtn = document.getElementById('generate-btn');
    const strategySelect = document.getElementById('strategy');
    const gameCountInput = document.getElementById('game-count');

    // Update strategy description
    strategySelect.addEventListener('change', updateStrategyDescription);

    // Generate button click
    generateBtn.addEventListener('click', () => {
        const count = parseInt(gameCountInput.value);
        const strategy = strategySelect.value;

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
            onGenerate(strategy, count);

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
 * Update strategy description based on selection
 */
function updateStrategyDescription() {
    const strategy = document.getElementById('strategy').value;
    const descriptionEl = document.getElementById('strategy-description');

    const descriptions = {
        'smart-mix': '<strong>🎯 Mix Inteligente:</strong> Combina números quentes (40%), números atrasados (30%) e números aleatórios (30%) para criar uma combinação balanceada baseada em análise estatística.',
        'weighted': '<strong>📊 Baseado em Frequência:</strong> Gera números dando maior peso para aqueles que foram sorteados com mais frequência no histórico. Números mais sorteados têm maior chance de serem escolhidos.',
        'pattern': '<strong>⚖️ Baseado em Padrões:</strong> Segue os padrões mais comuns de distribuição par/ímpar encontrados nos sorteios históricos.',
        'random': '<strong>🎲 Aleatório Puro:</strong> Geração completamente aleatória, sem considerar dados históricos. Todas as combinações têm a mesma probabilidade.'
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
    
    @media (max-width: 768px) {
      .form-row {
        grid-template-columns: 1fr;
      }
      
      .btn-primary {
        width: 100%;
      }
    }
  `;

    document.head.appendChild(style);
}
