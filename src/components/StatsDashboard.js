import Chart from 'chart.js/auto';

/**
 * Statistics Dashboard Component
 * Displays comprehensive statistical analysis
 */

/**
 * Render statistics dashboard
 * @param {Object} stats - Statistics report
 * @param {Object} gameConfig - Game configuration
 */
export function renderStatsDashboard(stats, gameConfig) {
    const container = document.getElementById('stats-dashboard');
    if (!container) return;

    container.innerHTML = `
    <div class="stats-overview">
      <div class="stat-card">
        <div class="stat-icon">📈</div>
        <div class="stat-content">
          <div class="stat-value">${stats.totalDraws}</div>
          <div class="stat-label">Total de Concursos</div>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon">🔥</div>
        <div class="stat-content">
          <div class="stat-value">${stats.hotNumbers[0]?.number || '-'}</div>
          <div class="stat-label">Número Mais Frequente</div>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon">❄️</div>
        <div class="stat-content">
          <div class="stat-value">${stats.coldNumbers[0]?.number || '-'}</div>
          <div class="stat-label">Número Menos Frequente</div>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon">⏳</div>
        <div class="stat-content">
          <div class="stat-value">${stats.overdueNumbers[0]?.number || '-'}</div>
          <div class="stat-label">Número Mais Atrasado</div>
        </div>
      </div>
    </div>
    
    <div class="stats-details">
      <div class="stats-section">
        <h3>🔥 Números Mais Sorteados (Top 10)</h3>
        <div class="number-list hot-numbers">
          ${stats.hotNumbers.map((item, index) => `
            <div class="number-item">
              <span class="number-rank">#${index + 1}</span>
              <span class="number-ball hot">${item.number}</span>
              <span class="number-stats">${item.count}x (${item.percentage}%)</span>
            </div>
          `).join('')}
        </div>
      </div>
      
      <div class="stats-section">
        <h3>❄️ Números Menos Sorteados (Top 10)</h3>
        <div class="number-list cold-numbers">
          ${stats.coldNumbers.map((item, index) => `
            <div class="number-item">
              <span class="number-rank">#${index + 1}</span>
              <span class="number-ball cold">${item.number}</span>
              <span class="number-stats">${item.count}x (${item.percentage}%)</span>
            </div>
          `).join('')}
        </div>
      </div>
      
      <div class="stats-section">
        <h3>⏳ Números Mais Atrasados (Top 10)</h3>
        <div class="number-list overdue-numbers">
          ${stats.overdueNumbers.map((item, index) => `
            <div class="number-item">
              <span class="number-rank">#${index + 1}</span>
              <span class="number-ball overdue">${item.number}</span>
              <span class="number-stats">${item.delay} sorteios atrás</span>
            </div>
          `).join('')}
        </div>
      </div>
      
      <div class="stats-section full-width">
        <h3>📊 Gráfico de Frequência</h3>
        <div class="chart-container">
          <canvas id="frequency-chart"></canvas>
        </div>
      </div>
      
      <div class="stats-section">
        <h3>⚖️ Padrões Par/Ímpar</h3>
        <div class="pattern-list">
          ${stats.evenOddPatterns.slice(0, 5).map((pattern, index) => `
            <div class="pattern-item">
              <span class="pattern-rank">#${index + 1}</span>
              <span class="pattern-name">${pattern.pattern}</span>
              <span class="pattern-count">${pattern.count}x (${pattern.percentage}%)</span>
            </div>
          `).join('')}
        </div>
      </div>
      
      <div class="stats-section">
        <h3>📈 Tendências Recentes (Últimos 10 Sorteios)</h3>
        <div class="number-list trending-numbers">
          ${stats.recentTrends.trending.slice(0, 10).map((item, index) => `
            <div class="number-item">
              <span class="number-rank">#${index + 1}</span>
              <span class="number-ball trending">${item.number}</span>
              <span class="number-stats">${item.count}x nos últimos ${stats.recentTrends.recentDrawCount}</span>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;

    // Add styles for the components
    addStatsDashboardStyles();

    // Render frequency chart
    setTimeout(() => renderFrequencyChart(stats, gameConfig), 100);
}

/**
 * Render frequency chart using Chart.js
 */
function renderFrequencyChart(stats, gameConfig) {
    const canvas = document.getElementById('frequency-chart');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');

    // Sort frequencies by number
    const sortedFrequencies = [...stats.frequencies].sort((a, b) => a.number - b.number);

    const labels = sortedFrequencies.map(f => f.number);
    const data = sortedFrequencies.map(f => f.count);

    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Frequência de Sorteio',
                data: data,
                backgroundColor: 'rgba(139, 92, 246, 0.6)',
                borderColor: 'rgba(139, 92, 246, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    labels: {
                        color: '#f8fafc',
                        font: { size: 14 }
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(30, 41, 59, 0.9)',
                    titleColor: '#f8fafc',
                    bodyColor: '#cbd5e1',
                    borderColor: 'rgba(139, 92, 246, 0.3)',
                    borderWidth: 1
                }
            },
            scales: {
                x: {
                    ticks: { color: '#cbd5e1', font: { size: 10 } },
                    grid: { color: 'rgba(148, 163, 184, 0.1)' }
                },
                y: {
                    ticks: { color: '#cbd5e1' },
                    grid: { color: 'rgba(148, 163, 184, 0.1)' }
                }
            }
        }
    });
}

/**
 * Add component-specific styles
 */
function addStatsDashboardStyles() {
    if (document.getElementById('stats-dashboard-styles')) return;

    const style = document.createElement('style');
    style.id = 'stats-dashboard-styles';
    style.textContent = `
    .stats-grid {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-xl);
    }
    
    .stats-overview {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: var(--spacing-lg);
      margin-bottom: var(--spacing-xl);
    }
    
    .stat-card {
      background: var(--glass-bg);
      backdrop-filter: var(--glass-blur);
      border: 1px solid var(--glass-border);
      border-radius: var(--radius-lg);
      padding: var(--spacing-lg);
      display: flex;
      align-items: center;
      gap: var(--spacing-md);
      transition: all var(--transition-base);
    }
    
    .stat-card:hover {
      border-color: var(--color-accent-primary);
      transform: translateY(-2px);
      box-shadow: var(--shadow-lg);
    }
    
    .stat-icon {
      font-size: var(--font-size-3xl);
      filter: drop-shadow(0 0 8px rgba(255, 255, 255, 0.3));
    }
    
    .stat-value {
      font-size: var(--font-size-2xl);
      font-weight: 700;
      background: var(--gradient-primary);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    
    .stat-label {
      font-size: var(--font-size-sm);
      color: var(--color-text-muted);
    }
    
    .stats-details {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: var(--spacing-xl);
    }
    
    .stats-section {
      background: var(--glass-bg);
      backdrop-filter: var(--glass-blur);
      border: 1px solid var(--glass-border);
      border-radius: var(--radius-lg);
      padding: var(--spacing-xl);
    }
    
    .stats-section.full-width {
      grid-column: 1 / -1;
    }
    
    .stats-section h3 {
      font-size: var(--font-size-lg);
      margin-bottom: var(--spacing-lg);
      color: var(--color-text-primary);
    }
    
    .number-list, .pattern-list {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-sm);
    }
    
    .number-item, .pattern-item {
      display: flex;
      align-items: center;
      gap: var(--spacing-md);
      padding: var(--spacing-sm);
      background: rgba(30, 41, 59, 0.4);
      border-radius: var(--radius-md);
      transition: all var(--transition-fast);
    }
    
    .number-item:hover, .pattern-item:hover {
      background: rgba(51, 65, 85, 0.6);
      transform: translateX(4px);
    }
    
    .number-rank, .pattern-rank {
      font-size: var(--font-size-xs);
      color: var(--color-text-muted);
      min-width: 30px;
    }
    
    .number-ball {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      border-radius: var(--radius-full);
      font-weight: 700;
      font-size: var(--font-size-base);
      box-shadow: var(--shadow-md);
    }
    
    .number-ball.hot {
      background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
      color: white;
    }
    
    .number-ball.cold {
      background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%);
      color: white;
    }
    
    .number-ball.overdue {
      background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
      color: white;
    }
    
    .number-ball.trending {
      background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
      color: white;
    }
    
    .number-stats {
      font-size: var(--font-size-sm);
      color: var(--color-text-secondary);
      margin-left: auto;
    }
    
    .pattern-name {
      flex: 1;
      color: var(--color-text-primary);
      font-weight: 500;
    }
    
    .pattern-count {
      font-size: var(--font-size-sm);
      color: var(--color-text-secondary);
    }
    
    .chart-container {
      position: relative;
      height: 300px;
      padding: var(--spacing-md);
    }
    
    /* Mobile responsiveness */
    @media (max-width: 480px) {
      .stats-overview {
        grid-template-columns: repeat(2, 1fr);
        gap: var(--spacing-sm);
      }
      
      .stat-card {
        padding: var(--spacing-sm);
        flex-direction: column;
        text-align: center;
        gap: var(--spacing-sm);
      }
      
      .stat-icon {
        font-size: var(--font-size-2xl);
      }
      
      .stat-value {
        font-size: var(--font-size-xl);
      }
      
      .stat-label {
        font-size: var(--font-size-xs);
      }
      
      .stats-details {
        grid-template-columns: 1fr;
        gap: var(--spacing-md);
      }
      
      .stats-section {
        padding: var(--spacing-md);
      }
      
      .stats-section h3 {
        font-size: var(--font-size-base);
        margin-bottom: var(--spacing-md);
        text-align: center;
      }
      
      .number-ball {
        width: 32px;
        height: 32px;
        font-size: var(--font-size-sm);
      }
      
      .number-item, .pattern-item {
        padding: var(--spacing-sm);
        gap: var(--spacing-sm);
      }
      
      .number-stats, .pattern-count {
        font-size: var(--font-size-xs);
      }
      
      .chart-container {
        height: 200px;
        padding: var(--spacing-sm);
      }
    }
    
    @media (min-width: 481px) and (max-width: 768px) {
      .stats-overview {
        grid-template-columns: repeat(2, 1fr);
      }
      
      .stats-details {
        grid-template-columns: 1fr;
      }
      
      .chart-container {
        height: 250px;
      }
    }
    
    @media (min-width: 769px) and (max-width: 1024px) {
      .stats-overview {
        grid-template-columns: repeat(4, 1fr);
      }
      
      .stats-details {
        grid-template-columns: repeat(2, 1fr);
      }
    }
    
    @media (min-width: 1025px) {
      .stats-overview {
        grid-template-columns: repeat(4, 1fr);
      }
      
      .stats-details {
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      }
    }
  `;

    document.head.appendChild(style);
}
