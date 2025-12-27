/**
 * History Checker Component
 * Permite ao usuário selecionar números e verificar se já saíram na história
 */

import { GAMES } from '../utils/dataModels.js';

/**
 * Renderiza o componente de verificação histórica
 */
export function renderHistoryChecker(container, currentGame, draws) {
  const gameConfig = GAMES[currentGame];

  // Determina as opções de números por jogo
  const minNumbers = gameConfig.numbersPerDraw;
  const maxNumbers = 20;
  const numbersOptions = [];

  for (let i = minNumbers; i <= maxNumbers; i++) {
    numbersOptions.push(i);
  }

  container.innerHTML = `
        <div class="history-checker-card">
            <div class="card-header">
                <h3 class="card-title">
                    <span class="card-icon">🔍</span>
                    Verificar Combinação na História
                </h3>
                <p class="card-description">
                    Escolha quantos números jogar e descubra se essa combinação já saiu alguma vez
                </p>
            </div>
            
            <div class="numbers-per-game-selector">
                <label for="numbers-per-game-checker" class="selector-label">
                    <span class="label-icon">🎯</span>
                    Quantos números jogar:
                </label>
                <select id="numbers-per-game-checker" class="numbers-select">
                    ${numbersOptions.map(num => `
                        <option value="${num}" ${num === minNumbers ? 'selected' : ''}>
                            ${num} números
                        </option>
                    `).join('')}
                </select>
            </div>
            
            <div class="number-selector">
                <div class="selector-header">
                    <span class="selector-title">Escolha seus números:</span>
                    <span class="selected-count">
                        <span id="selected-count">0</span>/<span id="target-count">${minNumbers}</span>
                    </span>
                </div>
                
                <div class="numbers-grid" id="numbers-grid">
                    ${generateNumbersGrid(gameConfig)}
                </div>
            </div>
            
            <div class="checker-actions">
                <button class="btn-primary" id="check-combination" disabled>
                    <span class="btn-icon">🔍</span>
                    Verificar
                </button>
                <button class="btn-secondary" id="clear-selection">
                    <span class="btn-icon">🗑️</span>
                    Limpar Seleção
                </button>
            </div>
            
            <div class="result-area" id="result-area" style="display: none;">
                <!-- Resultado será mostrado aqui -->
            </div>
        </div>
    `;

  // Setup event listeners
  setupHistoryChecker(container, currentGame, draws);
}

/**
 * Gera a grade de números para seleção
 */
function generateNumbersGrid(gameConfig) {
  let html = '';

  for (let i = gameConfig.minNumber; i <= gameConfig.maxNumber; i++) {
    html += `
            <button class="number-btn" data-number="${i}">
                ${i.toString().padStart(2, '0')}
            </button>
        `;
  }

  return html;
}

/**
 * Configura os event listeners do componente
 */
function setupHistoryChecker(container, currentGame, draws) {
  const gameConfig = GAMES[currentGame];
  const selectedNumbers = new Set();
  let currentNumbersPerGame = gameConfig.numbersPerDraw;

  const numbersGrid = container.querySelector('#numbers-grid');
  const selectedCountEl = container.querySelector('#selected-count');
  const targetCountEl = container.querySelector('#target-count');
  const checkButton = container.querySelector('#check-combination');
  const clearButton = container.querySelector('#clear-selection');
  const resultArea = container.querySelector('#result-area');
  const numbersPerGameSelect = container.querySelector('#numbers-per-game-checker');

  // Carrega dados salvos do localStorage
  loadSavedSelection();

  // Event listener para mudança na quantidade de números
  numbersPerGameSelect.addEventListener('change', (e) => {
    currentNumbersPerGame = parseInt(e.target.value);
    targetCountEl.textContent = currentNumbersPerGame;

    // Limpa seleção se exceder o novo limite
    if (selectedNumbers.size > currentNumbersPerGame) {
      selectedNumbers.clear();
      container.querySelectorAll('.number-btn').forEach(btn => {
        btn.classList.remove('selected');
      });
      resultArea.style.display = 'none';
    }

    // Salva a nova quantidade no localStorage
    saveSelectionToStorage();
    updateUI();
  });

  // Event listener para seleção de números
  numbersGrid.addEventListener('click', (e) => {
    if (e.target.classList.contains('number-btn')) {
      const number = parseInt(e.target.dataset.number);

      if (selectedNumbers.has(number)) {
        // Remove número
        selectedNumbers.delete(number);
        e.target.classList.remove('selected');
      } else if (selectedNumbers.size < currentNumbersPerGame) {
        // Adiciona número
        selectedNumbers.add(number);
        e.target.classList.add('selected');
      }

      // Salva seleção no localStorage
      saveSelectionToStorage();
      updateUI();
    }
  });

  // Event listener para verificar combinação
  checkButton.addEventListener('click', () => {
    if (selectedNumbers.size === currentNumbersPerGame) {
      checkCombinationInHistory(
        Array.from(selectedNumbers).sort((a, b) => a - b),
        draws,
        resultArea,
        currentGame,
        currentNumbersPerGame
      );
    }
  });

  // Event listener para limpar seleção
  clearButton.addEventListener('click', () => {
    selectedNumbers.clear();
    container.querySelectorAll('.number-btn').forEach(btn => {
      btn.classList.remove('selected');
    });
    resultArea.style.display = 'none';

    // Remove do localStorage
    clearStoredSelection();
    updateUI();
  });

  /**
   * Salva a seleção atual no localStorage
   */
  function saveSelectionToStorage() {
    const selectionData = {
      game: currentGame,
      numbersPerGame: currentNumbersPerGame,
      selectedNumbers: Array.from(selectedNumbers),
      timestamp: Date.now()
    };

    try {
      localStorage.setItem('history-checker-selection', JSON.stringify(selectionData));
    } catch (error) {
      console.warn('Erro ao salvar seleção no localStorage:', error);
    }
  }

  /**
   * Carrega a seleção salva do localStorage
   */
  function loadSavedSelection() {
    try {
      const savedData = localStorage.getItem('history-checker-selection');
      if (!savedData) return;

      const selectionData = JSON.parse(savedData);

      // Verifica se os dados são do mesmo jogo
      if (selectionData.game !== currentGame) return;

      // Verifica se os dados não são muito antigos (24 horas)
      const maxAge = 24 * 60 * 60 * 1000; // 24 horas em ms
      if (Date.now() - selectionData.timestamp > maxAge) {
        clearStoredSelection();
        return;
      }

      // Restaura a quantidade de números
      if (selectionData.numbersPerGame && selectionData.numbersPerGame >= gameConfig.numbersPerDraw && selectionData.numbersPerGame <= 20) {
        currentNumbersPerGame = selectionData.numbersPerGame;
        numbersPerGameSelect.value = currentNumbersPerGame;
        targetCountEl.textContent = currentNumbersPerGame;
      }

      // Restaura os números selecionados
      if (selectionData.selectedNumbers && Array.isArray(selectionData.selectedNumbers)) {
        selectionData.selectedNumbers.forEach(number => {
          if (number >= gameConfig.minNumber && number <= gameConfig.maxNumber) {
            selectedNumbers.add(number);
            const btn = container.querySelector(`[data-number="${number}"]`);
            if (btn) {
              btn.classList.add('selected');
            }
          }
        });
      }

      updateUI();
    } catch (error) {
      console.warn('Erro ao carregar seleção do localStorage:', error);
      clearStoredSelection();
    }
  }

  /**
   * Remove a seleção salva do localStorage
   */
  function clearStoredSelection() {
    try {
      localStorage.removeItem('history-checker-selection');
    } catch (error) {
      console.warn('Erro ao limpar localStorage:', error);
    }
  }

  function updateUI() {
    selectedCountEl.textContent = selectedNumbers.size;
    checkButton.disabled = selectedNumbers.size !== currentNumbersPerGame;

    // Adiciona classe visual quando limite atingido
    if (selectedNumbers.size === currentNumbersPerGame) {
      numbersGrid.classList.add('selection-complete');
    } else {
      numbersGrid.classList.remove('selection-complete');
    }
  }
}

/**
 * Verifica se a combinação já saiu na história
 */
function checkCombinationInHistory(selectedNumbers, draws, resultArea, currentGame, numbersPerGame) {
  // Para combinações com mais números que o padrão do jogo, 
  // verifica se algum sorteio histórico está contido na seleção
  const isExtendedGame = numbersPerGame > GAMES[currentGame].numbersPerDraw;

  let exactMatches = [];
  let partialMatches = [];

  if (isExtendedGame) {
    // Para jogos estendidos, verifica se algum resultado histórico está contido na seleção
    exactMatches = draws.filter(draw => {
      const drawNumbers = draw.numeros;
      // Verifica se todos os números do sorteio estão na seleção do usuário
      return drawNumbers.every(num => selectedNumbers.includes(num));
    });

    // Para matches parciais em jogos estendidos, busca sorteios com alta coincidência
    partialMatches = draws.filter(draw => {
      const drawNumbers = draw.numeros;
      const matches = selectedNumbers.filter(num => drawNumbers.includes(num));
      const standardGameSize = GAMES[currentGame].numbersPerDraw;
      // Para jogos estendidos, mostra com pelo menos 3 matches e que não seja um match exato
      const minMatches = standardGameSize <= 6 ? 3 : Math.max(4, standardGameSize - 2);
      return matches.length >= minMatches &&
        !drawNumbers.every(num => selectedNumbers.includes(num));
    }).slice(0, 5);

  } else {
    // Para jogos padrão, busca combinações exatas
    exactMatches = draws.filter(draw => {
      const drawNumbers = draw.numeros.sort((a, b) => a - b);
      return arraysEqual(selectedNumbers, drawNumbers);
    });

    // Busca por combinações com alta coincidência (sempre mostra, mesmo com matches exatos)
    partialMatches = draws.filter(draw => {
      const drawNumbers = draw.numeros;
      const matches = selectedNumbers.filter(num => drawNumbers.includes(num));
      // Para 6 números: mostra com 3+ matches, para outros: ajusta conforme o tamanho
      let minMatches;
      if (numbersPerGame <= 6) {
        minMatches = 3; // Para 6 números ou menos, mostra com 3+ matches
      } else if (numbersPerGame <= 10) {
        minMatches = Math.max(4, numbersPerGame - 3); // Para 7-10 números
      } else {
        minMatches = Math.max(8, numbersPerGame - 2); // Para 11+ números
      }
      return matches.length >= minMatches && matches.length < numbersPerGame;
    }).slice(0, 5);
  }

  displayResults(selectedNumbers, exactMatches, partialMatches, resultArea, currentGame, numbersPerGame, isExtendedGame);
}

/**
 * Exibe os resultados da verificação
 */
function displayResults(selectedNumbers, exactMatches, partialMatches, resultArea, currentGame, numbersPerGame, isExtendedGame = false) {
  const gameConfig = GAMES[currentGame];
  const gameName = currentGame === 'LOTOFACIL' ? 'Lotofácil' : 'Mega-Sena';

  let html = '';

  if (exactMatches.length > 0) {
    // Combinação já saiu ou está contida nos resultados históricos
    const messageText = isExtendedGame
      ? `Sua combinação de ${numbersPerGame} números <strong>contém ${exactMatches.length} resultado(s)</strong> que já saíram na história da ${gameName}!`
      : `Essa combinação já saiu <strong>${exactMatches.length} vez(es)</strong> na história da ${gameName}!`;

    html = `
            <div class="result-card result-found">
                <div class="result-header">
                    <span class="result-icon">🎯</span>
                    <h4>${isExtendedGame ? 'Resultados Encontrados!' : 'Combinação Encontrada!'}</h4>
                </div>
                <div class="result-content">
                    <p class="result-message">
                        ${messageText}
                    </p>
                    
                    <div class="selected-numbers">
                        <span class="numbers-label">Seus ${numbersPerGame} números:</span>
                        <div class="numbers-display">
                            ${selectedNumbers.map(num =>
      `<span class="number-ball ${currentGame.toLowerCase()}">${num.toString().padStart(2, '0')}</span>`
    ).join('')}
                        </div>
                    </div>
                    
                    <div class="match-details">
                        <h5>${isExtendedGame ? 'Resultados históricos contidos na sua seleção:' : 'Quando saiu:'}</h5>
                        ${exactMatches.slice(0, 10).map(match => `
                            <div class="match-item">
                                <span class="match-contest">Concurso ${match.concurso}</span>
                                <span class="match-date">${match.data}</span>
                                ${isExtendedGame ? `
                                    <div class="match-numbers">
                                        ${match.numeros.map(num =>
      `<span class="number-ball-small ${currentGame.toLowerCase()}">${num.toString().padStart(2, '0')}</span>`
    ).join('')}
                                    </div>
                                ` : ''}
                            </div>
                        `).join('')}
                        ${exactMatches.length > 10 ? `<p class="more-results">... e mais ${exactMatches.length - 10} resultado(s)</p>` : ''}
                    </div>
                    
                    <div class="probability-info">
                        <p class="probability-text">
                            <strong>Probabilidade de ${numbersPerGame} números:</strong> 1 em ${formatNumber(calculateExtendedProbability(gameConfig, numbersPerGame))}
                        </p>
                        <p class="curiosity">
                            💡 <strong>${isExtendedGame ? 'Dica:' : 'Curiosidade:'}</strong> ${isExtendedGame
        ? 'Jogos com mais números aumentam suas chances de acertar, mas custam mais caro!'
        : 'A probabilidade de uma combinação específica sair novamente é a mesma de qualquer outra combinação!'
      }
                        </p>
                    </div>
                    
                    ${partialMatches.length > 0 ? `
                        <div class="partial-matches">
                            <h5>Combinações similares que já saíram:</h5>
                            <div class="similar-combinations">
                                ${partialMatches.slice(0, 3).map(match => {
        const matchCount = selectedNumbers.filter(num => match.numeros.includes(num)).length;
        return `
                                        <div class="similar-item">
                                            <div class="similar-header">
                                                <span class="similar-contest">Concurso ${match.concurso}</span>
                                                <span class="similar-matches">${matchCount}/${gameConfig.numbersPerDraw} números iguais</span>
                                            </div>
                                            <div class="similar-numbers">
                                                ${match.numeros.map(num => {
          const isMatch = selectedNumbers.includes(num);
          return `<span class="number-ball ${currentGame.toLowerCase()} ${isMatch ? 'match' : 'no-match'}">${num.toString().padStart(2, '0')}</span>`;
        }).join('')}
                                            </div>
                                        </div>
                                    `;
      }).join('')}
                            </div>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
  } else {
    // Combinação nunca saiu
    html = `
            <div class="result-card result-not-found">
                <div class="result-header">
                    <span class="result-icon">🆕</span>
                    <h4>${isExtendedGame ? 'Combinação Inédita!' : 'Combinação Inédita!'}</h4>
                </div>
                <div class="result-content">
                    <p class="result-message">
                        <strong>${isExtendedGame
        ? `Sua combinação de ${numbersPerGame} números nunca conteve um resultado completo da ${gameName}!`
        : `Essa combinação nunca saiu na história da ${gameName}!`
      }</strong>
                    </p>
                    
                    <div class="selected-numbers">
                        <span class="numbers-label">Seus ${numbersPerGame} números:</span>
                        <div class="numbers-display">
                            ${selectedNumbers.map(num =>
        `<span class="number-ball ${currentGame.toLowerCase()}">${num.toString().padStart(2, '0')}</span>`
      ).join('')}
                        </div>
                    </div>
                    
                    <div class="probability-info">
                        <p class="probability-text">
                            <strong>Probabilidade de ${numbersPerGame} números:</strong> 1 em ${formatNumber(calculateExtendedProbability(gameConfig, numbersPerGame))}
                        </p>
                        <p class="encouragement">
                            🍀 <strong>Boa sorte!</strong> ${isExtendedGame
        ? 'Jogos com mais números têm maiores chances de acerto!'
        : 'Toda combinação tem a mesma chance de ser sorteada!'
      }
                        </p>
                    </div>
                    
                    ${partialMatches.length > 0 ? `
                        <div class="partial-matches">
                            <h5>Combinações similares que já saíram:</h5>
                            <div class="similar-combinations">
                                ${partialMatches.slice(0, 3).map(match => {
        const matchCount = selectedNumbers.filter(num => match.numeros.includes(num)).length;
        return `
                                        <div class="similar-item">
                                            <div class="similar-header">
                                                <span class="similar-contest">Concurso ${match.concurso}</span>
                                                <span class="similar-matches">${matchCount}/${gameConfig.numbersPerDraw} números iguais</span>
                                            </div>
                                            <div class="similar-numbers">
                                                ${match.numeros.map(num => {
          const isMatch = selectedNumbers.includes(num);
          return `<span class="number-ball ${currentGame.toLowerCase()} ${isMatch ? 'match' : 'no-match'}">${num.toString().padStart(2, '0')}</span>`;
        }).join('')}
                                            </div>
                                        </div>
                                    `;
      }).join('')}
                            </div>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
  }

  resultArea.innerHTML = html;
  resultArea.style.display = 'block';

  // Scroll suave para o resultado
  resultArea.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

/**
 * Verifica se dois arrays são iguais
 */
function arraysEqual(arr1, arr2) {
  if (arr1.length !== arr2.length) return false;
  return arr1.every((val, index) => val === arr2[index]);
}

/**
 * Calcula a probabilidade de uma combinação
 */
function calculateProbability(gameConfig) {
  return calculateExtendedProbability(gameConfig, gameConfig.numbersPerDraw);
}

/**
 * Calcula a probabilidade para jogos com números customizados
 */
function calculateExtendedProbability(gameConfig, numbersPerGame) {
  // Probabilidades específicas da Lotofácil (tabela oficial da Caixa)
  if (gameConfig.id === 'lotofacil') {
    const lotofacilProbabilities = {
      15: 3268760,
      16: 204298,
      17: 24035,
      18: 4006,
      19: 843,
      20: 211
    };

    return lotofacilProbabilities[numbersPerGame] || calculateCombination(gameConfig.maxNumber, numbersPerGame);
  }

  // Probabilidades específicas da Mega-Sena (tabela oficial da Caixa - coluna Sena)
  if (gameConfig.id === 'megasena') {
    const megasenaProbabilities = {
      6: 50063860,
      7: 7151980,
      8: 1787995,
      9: 595998,
      10: 238399,
      11: 108363,
      12: 54182,
      13: 29175,
      14: 16671,
      15: 10003,
      16: 6252,
      17: 4045,
      18: 2697,
      19: 1845,
      20: 1292
    };

    return megasenaProbabilities[numbersPerGame] || calculateCombination(gameConfig.maxNumber, numbersPerGame);
  }

  // Para outros jogos, usa fórmula de combinação
  return calculateCombination(gameConfig.maxNumber, numbersPerGame);
}

/**
 * Calcula combinação matemática C(n,k) = n! / (k! * (n-k)!)
 */
function calculateCombination(n, k) {
  let result = 1;
  for (let i = 0; i < k; i++) {
    result = result * (n - i) / (i + 1);
  }
  return Math.round(result);
}

/**
 * Formata números grandes
 */
function formatNumber(num) {
  return num.toLocaleString('pt-BR');
}