import { saveAs } from 'file-saver';

/**
 * Results Display Component
 * Shows generated lottery number combinations
 */

/**
 * Render results display
 * @param {Array} combinations - Array of generated combinations
 * @param {Object} gameConfig - Game configuration
 */
export function renderResults(combinations, gameConfig) {
  const container = document.getElementById('results-display');
  const section = document.getElementById('results-section');

  if (!container || !section) return;

  // Show results section
  section.style.display = 'block';

  // Scroll to results
  setTimeout(() => {
    section.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, 100);

  const strategyNames = {
    'smart-mix': '🎯 Mix Inteligente',
    'frequency': '📊 Baseado em Frequência',
    'pattern': '⚖️ Baseado em Padrões',
    'random': '🎲 Aleatório Puro',
    'balanced': '⚖️ Distribuição Balanceada',
    'co-occurrence': '🔗 Co-ocorrência',
    'weighted-random': '📈 Geração Ponderada',
    'filtered': '🔍 Exclusão de Improváveis',
    'coverage': '🎯 Varredura de Cobertura',
    'combinatorial': '🧮 Filtros Combinatórios'
  };

  const strategyName = strategyNames[combinations[0]?.strategy] || 'Personalizado';

  container.innerHTML = `
    <div class="results-header">
      <div class="results-info">
        <p><strong>${combinations.length}</strong> ${combinations.length === 1 ? 'jogo gerado' : 'jogos gerados'} usando <strong>${strategyName}</strong></p>
      </div>
      <div class="results-actions">
        <button id="export-txt-btn" class="btn-secondary">
          <span>📄</span>
          <span>Exportar TXT</span>
        </button>
        <button id="copy-btn" class="btn-secondary">
          <span>📋</span>
          <span>Copiar</span>
        </button>
      </div>
    </div>
    
    <div class="results-grid">
      ${combinations.map(combo => `
        <div class="result-card" data-combo-id="${combo.id}">
          <div class="result-header">
            <span class="result-number">Jogo #${combo.id}</span>
          </div>
          <div class="result-numbers">
            ${combo.numbers.map((num, index) => `
              <div class="number-ball-large" style="animation-delay: ${index * 0.05}s">
                ${num}
              </div>
            `).join('')}
          </div>
          ${combo.explanation ? `
          <div class="result-explanation">
            <div class="explanation-icon">💡</div>
            <div class="explanation-text">${combo.explanation}</div>
          </div>
          ` : ''}
        </div>
      `).join('')}
    </div>
  `;

  // Add styles
  addResultsStyles();

  // Add event listeners
  document.getElementById('export-txt-btn').addEventListener('click', () => {
    exportToTxt(combinations, gameConfig);
  });

  document.getElementById('copy-btn').addEventListener('click', () => {
    copyToClipboard(combinations, gameConfig);
  });
}

/**
 * Export combinations to TXT file
 */
function exportToTxt(combinations, gameConfig) {
  const strategyNames = {
    'smart-mix': 'Mix Inteligente',
    'frequency': 'Baseado em Frequência',
    'pattern': 'Baseado em Padrões',
    'random': 'Aleatório Puro',
    'balanced': 'Distribuição Balanceada',
    'co-occurrence': 'Co-ocorrência',
    'weighted-random': 'Geração Ponderada',
    'filtered': 'Exclusão de Improváveis',
    'coverage': 'Varredura de Cobertura',
    'combinatorial': 'Filtros Combinatórios'
  };

  const strategy = strategyNames[combinations[0]?.strategy] || 'Personalizado';
  const date = new Date().toLocaleDateString('pt-BR');

  let content = `${gameConfig.name} - Números Gerados\n`;
  content += `Data: ${date}\n`;
  content += `Estratégia: ${strategy}\n`;
  content += `Total de Jogos: ${combinations.length}\n`;
  content += `\n${'='.repeat(50)}\n\n`;

  combinations.forEach(combo => {
    content += `Jogo #${combo.id}: ${combo.numbers.join(' - ')}\n`;
  });

  content += `\n${'='.repeat(50)}\n`;
  content += `\nGerado por: Sistema de Análise de Loterias\n`;
  content += `⚠️ Aviso: Jogue com responsabilidade. Loterias são jogos de azar.\n`;

  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const filename = `${gameConfig.id}_numeros_${date.replace(/\//g, '-')}.txt`;

  saveAs(blob, filename);

  // Show success message
  showNotification('✅ Arquivo exportado com sucesso!');
}

/**
 * Copy combinations to clipboard
 */
function copyToClipboard(combinations, gameConfig) {
  let text = `${gameConfig.name} - Números Gerados\n\n`;

  combinations.forEach(combo => {
    text += `Jogo #${combo.id}: ${combo.numbers.join(' - ')}\n`;
  });

  navigator.clipboard.writeText(text).then(() => {
    showNotification('✅ Copiado para a área de transferência!');
  }).catch(err => {
    console.error('Failed to copy:', err);
    showNotification('❌ Erro ao copiar. Tente novamente.');
  });
}

/**
 * Show notification message
 */
function showNotification(message) {
  // Remove existing notification
  const existing = document.querySelector('.notification');
  if (existing) existing.remove();

  const notification = document.createElement('div');
  notification.className = 'notification';
  notification.textContent = message;

  document.body.appendChild(notification);

  // Animate in
  setTimeout(() => notification.classList.add('show'), 10);

  // Remove after 3 seconds
  setTimeout(() => {
    notification.classList.remove('show');
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

/**
 * Add component styles
 */
function addResultsStyles() {
  if (document.getElementById('results-styles')) return;

  const style = document.createElement('style');
  style.id = 'results-styles';
  style.textContent = `
    .results-container {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-xl);
    }
    
    .results-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: var(--spacing-lg);
      padding: var(--spacing-lg);
      background: var(--glass-bg);
      backdrop-filter: var(--glass-blur);
      border: 1px solid var(--glass-border);
      border-radius: var(--radius-lg);
    }
    
    .results-info p {
      margin: 0;
      color: var(--color-text-secondary);
      font-size: var(--font-size-base);
    }
    
    .results-info strong {
      color: var(--color-text-primary);
    }
    
    .results-actions {
      display: flex;
      gap: var(--spacing-md);
    }
    
    .btn-secondary {
      padding: var(--spacing-sm) var(--spacing-lg);
      background: rgba(30, 41, 59, 0.6);
      border: 1px solid var(--glass-border);
      border-radius: var(--radius-md);
      color: var(--color-text-primary);
      font-size: var(--font-size-sm);
      font-weight: 500;
      font-family: var(--font-family);
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
      transition: all var(--transition-base);
    }
    
    .btn-secondary:hover {
      background: rgba(51, 65, 85, 0.8);
      border-color: var(--color-accent-primary);
      transform: translateY(-2px);
      box-shadow: var(--shadow-md);
    }
    
    .results-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: var(--spacing-lg);
    }
    
    .result-card {
      background: var(--glass-bg);
      backdrop-filter: var(--glass-blur);
      border: 1px solid var(--glass-border);
      border-radius: var(--radius-xl);
      padding: var(--spacing-xl);
      transition: all var(--transition-base);
      animation: slideInUp 0.4s ease-out backwards;
    }
    
    .result-card:hover {
      border-color: var(--color-accent-primary);
      transform: translateY(-4px);
      box-shadow: var(--shadow-glow);
    }
    
    .result-header {
      margin-bottom: var(--spacing-lg);
      padding-bottom: var(--spacing-md);
      border-bottom: 1px solid var(--glass-border);
    }
    
    .result-number {
      font-size: var(--font-size-base);
      font-weight: 600;
      color: var(--color-text-secondary);
    }
    
    .result-numbers {
      display: flex;
      flex-wrap: wrap;
      gap: var(--spacing-sm);
      justify-content: center;
    }
    
    .number-ball-large {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 48px;
      height: 48px;
      border-radius: var(--radius-full);
      background: var(--gradient-primary);
      color: white;
      font-weight: 700;
      font-size: var(--font-size-lg);
      box-shadow: var(--shadow-lg);
      animation: popIn 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55) backwards;
    }
    
    .result-explanation {
      margin-top: var(--spacing-lg);
      padding-top: var(--spacing-lg);
      border-top: 1px solid var(--glass-border);
      display: flex;
      gap: var(--spacing-md);
      align-items: flex-start;
    }
    
    .explanation-icon {
      font-size: var(--font-size-xl);
      flex-shrink: 0;
      filter: drop-shadow(0 0 8px rgba(251, 191, 36, 0.5));
    }
    
    .explanation-text {
      flex: 1;
      font-size: var(--font-size-sm);
      line-height: 1.6;
      color: var(--color-text-secondary);
    }
    
    .explanation-text strong {
      color: var(--color-text-primary);
      font-weight: 600;
    }
    
    .notification {
      position: fixed;
      bottom: var(--spacing-xl);
      right: var(--spacing-xl);
      padding: var(--spacing-lg) var(--spacing-xl);
      background: rgba(30, 41, 59, 0.95);
      backdrop-filter: blur(12px);
      border: 1px solid var(--glass-border);
      border-radius: var(--radius-lg);
      color: var(--color-text-primary);
      font-weight: 500;
      box-shadow: var(--shadow-xl);
      z-index: 1000;
      opacity: 0;
      transform: translateY(20px);
      transition: all var(--transition-base);
    }
    
    .notification.show {
      opacity: 1;
      transform: translateY(0);
    }
    
    @keyframes slideInUp {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    
    @keyframes popIn {
      from {
        opacity: 0;
        transform: scale(0);
      }
      to {
        opacity: 1;
        transform: scale(1);
      }
    }
    
    /* Mobile responsiveness */
    @media (max-width: 480px) {
      .results-header {
        flex-direction: column;
        align-items: stretch;
        gap: var(--spacing-md);
        padding: var(--spacing-md);
      }
      
      .results-info p {
        font-size: var(--font-size-sm);
        text-align: center;
      }
      
      .results-actions {
        width: 100%;
        flex-direction: column;
        gap: var(--spacing-sm);
      }
      
      .btn-secondary {
        flex: 1;
        justify-content: center;
        padding: var(--spacing-md);
        font-size: var(--font-size-sm);
      }
      
      .results-grid {
        grid-template-columns: 1fr;
        gap: var(--spacing-md);
      }
      
      .result-card {
        padding: var(--spacing-md);
      }
      
      .result-numbers {
        gap: var(--spacing-xs);
      }
      
      .number-ball-large {
        width: 40px;
        height: 40px;
        font-size: var(--font-size-base);
      }
      
      .result-explanation {
        margin-top: var(--spacing-md);
        padding-top: var(--spacing-md);
        gap: var(--spacing-sm);
      }
      
      .explanation-icon {
        font-size: var(--font-size-lg);
      }
      
      .explanation-text {
        font-size: var(--font-size-xs);
      }
      
      .notification {
        left: var(--spacing-md);
        right: var(--spacing-md);
        bottom: var(--spacing-md);
        padding: var(--spacing-md);
        font-size: var(--font-size-sm);
      }
    }
    
    @media (min-width: 481px) and (max-width: 768px) {
      .results-header {
        flex-direction: column;
        align-items: flex-start;
      }
      
      .results-actions {
        width: 100%;
        flex-direction: row;
      }
      
      .btn-secondary {
        flex: 1;
      }
      
      .results-grid {
        grid-template-columns: 1fr;
      }
      
      .notification {
        left: var(--spacing-lg);
        right: var(--spacing-lg);
      }
    }
    
    @media (min-width: 769px) and (max-width: 1024px) {
      .results-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }
    
    @media (min-width: 1025px) {
      .results-grid {
        grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      }
    }
    
    /* Landscape orientation adjustments */
    @media (max-width: 768px) and (orientation: landscape) {
      .results-header {
        flex-direction: row;
        align-items: center;
      }
      
      .results-actions {
        width: auto;
        flex-direction: row;
      }
      
      .number-ball-large {
        width: 36px;
        height: 36px;
        font-size: var(--font-size-sm);
      }
    }
  `;

  document.head.appendChild(style);
}
