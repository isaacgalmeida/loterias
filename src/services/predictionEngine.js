/**
 * Number Prediction Engine
 * Generates lottery number combinations using various strategies
 */

/**
 * Generate random numbers within range (helper function)
 * @param {number} min - Minimum number
 * @param {number} max - Maximum number
 * @param {number} count - Number of random numbers to generate
 * @param {Array} exclude - Numbers to exclude
 * @returns {Array} Array of unique random numbers
 */
function generateRandomNumbers(min, max, count, exclude = []) {
    const numbers = [];
    const available = [];

    for (let i = min; i <= max; i++) {
        if (!exclude.includes(i)) {
            available.push(i);
        }
    }

    if (available.length < count) {
        throw new Error('Not enough available numbers to generate combination');
    }

    while (numbers.length < count) {
        const randomIndex = Math.floor(Math.random() * available.length);
        const randomNumber = available[randomIndex];

        if (!numbers.includes(randomNumber)) {
            numbers.push(randomNumber);
        }
    }

    return numbers.sort((a, b) => a - b);
}

/**
 * Pure random number generation
 * @param {Object} gameConfig - Game configuration
 * @param {Object} options - Generation options
 * @returns {Array} Array of numbers
 */
export function generatePureRandom(gameConfig, options = {}) {
    const { exclude = [], include = [] } = options;
    const { minNumber, maxNumber, numbersPerDraw } = gameConfig;

    let numbersToGenerate = numbersPerDraw;
    let numbers = [...include];

    // Reduce count if we're forcing included numbers
    if (include.length > 0) {
        numbersToGenerate -= include.length;
    }

    if (numbersToGenerate > 0) {
        const randomNumbers = generateRandomNumbers(
            minNumber,
            maxNumber,
            numbersToGenerate,
            [...exclude, ...include]
        );
        numbers = [...numbers, ...randomNumbers];
    }

    return numbers.sort((a, b) => a - b);
}

/**
 * Weighted random based on historical frequency
 * @param {Object} gameConfig - Game configuration
 * @param {Map} frequencies - Number frequency map
 * @param {Object} options - Generation options
 * @returns {Array} Array of numbers
 */
export function generateWeightedRandom(gameConfig, frequencies, options = {}) {
    const { exclude = [], include = [] } = options;
    const { minNumber, maxNumber, numbersPerDraw } = gameConfig;

    let numbersToGenerate = numbersPerDraw;
    let numbers = [...include];

    if (include.length > 0) {
        numbersToGenerate -= include.length;
    }

    // Create weighted pool
    const weightedPool = [];
    frequencies.forEach((freq, num) => {
        if (!exclude.includes(num) && !include.includes(num)) {
            // Add number multiple times based on its frequency (weight)
            const weight = Math.max(1, Math.floor(freq.percentage));
            for (let i = 0; i < weight; i++) {
                weightedPool.push(num);
            }
        }
    });

    // Select random numbers from weighted pool
    while (numbers.length < numbersPerDraw && weightedPool.length > 0) {
        const randomIndex = Math.floor(Math.random() * weightedPool.length);
        const selectedNumber = weightedPool[randomIndex];

        if (!numbers.includes(selectedNumber)) {
            numbers.push(selectedNumber);
            // Remove all occurrences of this number from pool
            weightedPool.splice(0, weightedPool.length,
                ...weightedPool.filter(n => n !== selectedNumber)
            );
        }
    }

    return numbers.sort((a, b) => a - b);
}

/**
 * Smart mix strategy: combines hot, overdue, and random numbers
 * @param {Object} gameConfig - Game configuration
 * @param {Object} stats - Statistics report
 * @param {Object} options - Generation options
 * @returns {Array} Array of numbers
 */
export function generateSmartMix(gameConfig, stats, options = {}) {
    const { exclude = [], include = [] } = options;
    const { numbersPerDraw } = gameConfig;

    let numbers = [...include];
    let remaining = numbersPerDraw - numbers.length;

    // Get hot and overdue numbers
    const hotNumbers = stats.hotNumbers
        .map(h => h.number)
        .filter(n => !exclude.includes(n) && !numbers.includes(n));

    const overdueNumbers = stats.overdueNumbers
        .map(o => o.number)
        .filter(n => !exclude.includes(n) && !numbers.includes(n));

    // Mix strategy: 40% hot, 30% overdue, 30% random
    const hotCount = Math.floor(remaining * 0.4);
    const overdueCount = Math.floor(remaining * 0.3);
    const randomCount = remaining - hotCount - overdueCount;

    // Add hot numbers
    for (let i = 0; i < hotCount && i < hotNumbers.length; i++) {
        if (!numbers.includes(hotNumbers[i])) {
            numbers.push(hotNumbers[i]);
        }
    }

    // Add overdue numbers
    for (let i = 0; i < overdueCount && i < overdueNumbers.length; i++) {
        if (!numbers.includes(overdueNumbers[i])) {
            numbers.push(overdueNumbers[i]);
        }
    }

    // Fill remaining with random
    while (numbers.length < numbersPerDraw) {
        const randomNum = Math.floor(
            Math.random() * (gameConfig.maxNumber - gameConfig.minNumber + 1)
        ) + gameConfig.minNumber;

        if (!numbers.includes(randomNum) && !exclude.includes(randomNum)) {
            numbers.push(randomNum);
        }
    }

    return numbers.sort((a, b) => a - b);
}

/**
 * Pattern-based generation: follows common even/odd and low/high patterns
 * @param {Object} gameConfig - Game configuration
 * @param {Object} stats - Statistics report
 * @param {Object} options - Generation options
 * @returns {Array} Array of numbers
 */
export function generatePatternBased(gameConfig, stats, options = {}) {
    const { exclude = [], include = [] } = options;
    const { minNumber, maxNumber, numbersPerDraw } = gameConfig;

    let numbers = [...include];

    // Get most common even/odd pattern
    const topEvenOddPattern = stats.evenOddPatterns[0];
    let [evenTarget, oddTarget] = [0, 0];

    if (topEvenOddPattern) {
        const match = topEvenOddPattern.pattern.match(/(\d+)E-(\d+)O/);
        if (match) {
            evenTarget = parseInt(match[1]);
            oddTarget = parseInt(match[2]);
        }
    }

    // Adjust targets based on already included numbers
    const includedEven = include.filter(n => n % 2 === 0).length;
    const includedOdd = include.filter(n => n % 2 !== 0).length;
    evenTarget = Math.max(0, evenTarget - includedEven);
    oddTarget = Math.max(0, oddTarget - includedOdd);

    // Generate even numbers
    const evenNumbers = [];
    for (let i = minNumber; i <= maxNumber; i += 2) {
        if (i % 2 === 0 && !exclude.includes(i) && !numbers.includes(i)) {
            evenNumbers.push(i);
        }
    }

    // Generate odd numbers
    const oddNumbers = [];
    for (let i = minNumber; i <= maxNumber; i += 2) {
        if (i % 2 !== 0 && !exclude.includes(i) && !numbers.includes(i)) {
            oddNumbers.push(i);
        }
    }

    // Add even numbers
    while (numbers.filter(n => n % 2 === 0).length < evenTarget + includedEven && evenNumbers.length > 0) {
        const randomIndex = Math.floor(Math.random() * evenNumbers.length);
        const num = evenNumbers.splice(randomIndex, 1)[0];
        if (!numbers.includes(num)) {
            numbers.push(num);
        }
    }

    // Add odd numbers
    while (numbers.filter(n => n % 2 !== 0).length < oddTarget + includedOdd && oddNumbers.length > 0) {
        const randomIndex = Math.floor(Math.random() * oddNumbers.length);
        const num = oddNumbers.splice(randomIndex, 1)[0];
        if (!numbers.includes(num)) {
            numbers.push(num);
        }
    }

    // Fill remaining randomly
    while (numbers.length < numbersPerDraw) {
        const randomNum = Math.floor(
            Math.random() * (maxNumber - minNumber + 1)
        ) + minNumber;

        if (!numbers.includes(randomNum) && !exclude.includes(randomNum)) {
            numbers.push(randomNum);
        }
    }

    return numbers.sort((a, b) => a - b);
}

/**
 * Generate multiple combinations
 * @param {string} strategy - Generation strategy
 * @param {number} count - Number of combinations to generate
 * @param {Object} gameConfig - Game configuration
 * @param {Object} stats - Statistics report (optional for some strategies)
 * @param {Object} options - Generation options
 * @returns {Array} Array of number combinations
 */
export function generateMultipleCombinations(strategy, count, gameConfig, stats = null, options = {}) {
    const combinations = [];

    for (let i = 0; i < count; i++) {
        let combination;

        switch (strategy) {
            case 'weighted':
                if (!stats || !stats.frequencies) {
                    throw new Error('Statistics required for weighted strategy');
                }
                const freqMap = new Map();
                stats.frequencies.forEach(f => {
                    freqMap.set(f.number, { percentage: parseFloat(f.percentage), count: f.count });
                });
                combination = generateWeightedRandom(gameConfig, freqMap, options);
                break;

            case 'smart-mix':
                if (!stats) {
                    throw new Error('Statistics required for smart mix strategy');
                }
                combination = generateSmartMix(gameConfig, stats, options);
                break;

            case 'pattern':
                if (!stats) {
                    throw new Error('Statistics required for pattern-based strategy');
                }
                combination = generatePatternBased(gameConfig, stats, options);
                break;

            case 'random':
            default:
                combination = generatePureRandom(gameConfig, options);
                break;
        }

        combinations.push({
            id: i + 1,
            numbers: combination,
            strategy
        });
    }

    return combinations;
}
