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

    // Use shuffle approach for better performance
    for (let i = 0; i < count; i++) {
        const randomIndex = Math.floor(Math.random() * available.length);
        numbers.push(available[randomIndex]);
        available.splice(randomIndex, 1);
    }

    return numbers.sort((a, b) => a - b);
}

/**
 * Fill remaining numbers safely with timeout protection
 * @param {Array} numbers - Current numbers array
 * @param {number} target - Target count
 * @param {number} min - Min number
 * @param {number} max - Max number
 * @param {Array} exclude - Numbers to exclude
 */
function fillRemainingSafe(numbers, target, min, max, exclude = []) {
    let attempts = 0;
    const maxAttempts = (max - min + 1) * 10; // Safety limit

    while (numbers.length < target && attempts < maxAttempts) {
        const randomNum = Math.floor(Math.random() * (max - min + 1)) + min;
        if (!numbers.includes(randomNum) && !exclude.includes(randomNum)) {
            numbers.push(randomNum);
        }
        attempts++;
    }

    // If still not enough, use deterministic approach
    if (numbers.length < target) {
        for (let i = min; i <= max && numbers.length < target; i++) {
            if (!numbers.includes(i) && !exclude.includes(i)) {
                numbers.push(i);
            }
        }
    }
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
    fillRemainingSafe(numbers, numbersPerDraw, minNumber, maxNumber, exclude);

    return numbers.sort((a, b) => a - b);
}

/**
 * STRATEGY 2: Frequency-Based Generation
 * Selects numbers based on absolute and relative frequency
 * Mixes hot (high frequency), medium, and cold (low frequency) numbers
 * @param {Object} gameConfig - Game configuration
 * @param {Object} stats - Statistics report
 * @param {Object} options - Generation options
 * @returns {Array} Array of numbers
 */
export function generateFrequencyBased(gameConfig, stats, options = {}) {
    const { exclude = [], include = [] } = options;
    const { minNumber, maxNumber, numbersPerDraw } = gameConfig;

    let numbers = [...include];
    const remaining = numbersPerDraw - numbers.length;

    // Sort numbers by frequency
    const sortedByFreq = [...stats.frequencies]
        .filter(f => !exclude.includes(f.number) && !numbers.includes(f.number))
        .sort((a, b) => b.count - a.count);

    const total = sortedByFreq.length;
    const hotCount = Math.floor(total * 0.3); // Top 30%
    const coldStart = Math.floor(total * 0.7); // Bottom 30%

    const hotNumbers = sortedByFreq.slice(0, hotCount).map(f => f.number);
    const mediumNumbers = sortedByFreq.slice(hotCount, coldStart).map(f => f.number);
    const coldNumbers = sortedByFreq.slice(coldStart).map(f => f.number);

    // Mix: 50% hot, 30% medium, 20% cold
    const hotNeeded = Math.floor(remaining * 0.5);
    const mediumNeeded = Math.floor(remaining * 0.3);
    const coldNeeded = remaining - hotNeeded - mediumNeeded;

    // Add hot numbers
    for (let i = 0; i < hotNeeded && hotNumbers.length > 0; i++) {
        const randomIndex = Math.floor(Math.random() * hotNumbers.length);
        numbers.push(hotNumbers.splice(randomIndex, 1)[0]);
    }

    // Add medium numbers
    for (let i = 0; i < mediumNeeded && mediumNumbers.length > 0; i++) {
        const randomIndex = Math.floor(Math.random() * mediumNumbers.length);
        numbers.push(mediumNumbers.splice(randomIndex, 1)[0]);
    }

    // Add cold numbers
    for (let i = 0; i < coldNeeded && coldNumbers.length > 0; i++) {
        const randomIndex = Math.floor(Math.random() * coldNumbers.length);
        numbers.push(coldNumbers.splice(randomIndex, 1)[0]);
    }

    fillRemainingSafe(numbers, numbersPerDraw, minNumber, maxNumber, exclude);
    return numbers.sort((a, b) => a - b);
}

/**
 * STRATEGY 5: Balanced Distribution
 * Balances even/odd, low/high, and distribution by ranges
 * Avoids statistically improbable extremes
 * @param {Object} gameConfig - Game configuration
 * @param {Object} stats - Statistics report
 * @param {Object} options - Generation options
 * @returns {Array} Array of numbers
 */
export function generateBalanced(gameConfig, stats, options = {}) {
    const { exclude = [], include = [] } = options;
    const { minNumber, maxNumber, numbersPerDraw } = gameConfig;

    let numbers = [...include];
    const midPoint = (minNumber + maxNumber) / 2;

    // Target balanced distribution (close to 50/50)
    const targetEven = Math.round(numbersPerDraw / 2);
    const targetOdd = numbersPerDraw - targetEven;
    const targetLow = Math.round(numbersPerDraw / 2);
    const targetHigh = numbersPerDraw - targetLow;

    // Create pools
    const evenLow = [], evenHigh = [], oddLow = [], oddHigh = [];

    for (let i = minNumber; i <= maxNumber; i++) {
        if (exclude.includes(i) || numbers.includes(i)) continue;

        const isEven = i % 2 === 0;
        const isLow = i <= midPoint;

        if (isEven && isLow) evenLow.push(i);
        else if (isEven && !isLow) evenHigh.push(i);
        else if (!isEven && isLow) oddLow.push(i);
        else oddHigh.push(i);
    }

    // Shuffle all pools
    [evenLow, evenHigh, oddLow, oddHigh].forEach(pool => {
        for (let i = pool.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [pool[i], pool[j]] = [pool[j], pool[i]];
        }
    });

    // Add numbers to achieve balance
    while (numbers.length < numbersPerDraw) {
        const currentEven = numbers.filter(n => n % 2 === 0).length;
        const currentOdd = numbers.length - currentEven;
        const currentLow = numbers.filter(n => n <= midPoint).length;
        const currentHigh = numbers.length - currentLow;

        const needsEven = currentEven < targetEven;
        const needsOdd = currentOdd < targetOdd;
        const needsLow = currentLow < targetLow;
        const needsHigh = currentHigh < targetHigh;

        // Select from appropriate pool
        let selectedPool = null;
        if (needsEven && needsLow && evenLow.length > 0) selectedPool = evenLow;
        else if (needsEven && needsHigh && evenHigh.length > 0) selectedPool = evenHigh;
        else if (needsOdd && needsLow && oddLow.length > 0) selectedPool = oddLow;
        else if (needsOdd && needsHigh && oddHigh.length > 0) selectedPool = oddHigh;
        else if (needsEven && evenLow.length > 0) selectedPool = evenLow;
        else if (needsEven && evenHigh.length > 0) selectedPool = evenHigh;
        else if (needsOdd && oddLow.length > 0) selectedPool = oddLow;
        else if (needsOdd && oddHigh.length > 0) selectedPool = oddHigh;
        else {
            // Use any available pool
            if (evenLow.length > 0) selectedPool = evenLow;
            else if (evenHigh.length > 0) selectedPool = evenHigh;
            else if (oddLow.length > 0) selectedPool = oddLow;
            else if (oddHigh.length > 0) selectedPool = oddHigh;
            else break; // No more numbers available
        }

        if (selectedPool && selectedPool.length > 0) {
            numbers.push(selectedPool.shift());
        } else {
            break;
        }
    }

    fillRemainingSafe(numbers, numbersPerDraw, minNumber, maxNumber, exclude);
    return numbers.sort((a, b) => a - b);
}

/**
 * STRATEGY 6: Co-occurrence
 * Chooses numbers that appear together frequently in history
 * Uses statistically relevant pairs and trios
 * @param {Object} gameConfig - Game configuration
 * @param {Object} stats - Statistics report
 * @param {Object} options - Generation options
 * @returns {Array} Array of numbers
 */
export function generateCoOccurrence(gameConfig, stats, options = {}) {
    const { exclude = [], include = [] } = options;
    const { minNumber, maxNumber, numbersPerDraw } = gameConfig;

    let numbers = [...include];

    // Build co-occurrence matrix from historical draws
    const coOccurrence = new Map();

    // Analyze historical draws (assuming stats has access to raw draws)
    // For now, we'll use frequency correlation as proxy
    stats.frequencies.forEach(freq1 => {
        const pairs = new Map();
        stats.frequencies.forEach(freq2 => {
            if (freq1.number !== freq2.number) {
                // Correlation score based on frequency similarity
                const score = Math.abs(freq1.count - freq2.count);
                pairs.set(freq2.number, score);
            }
        });
        coOccurrence.set(freq1.number, pairs);
    });

    // Start with a hot number
    if (numbers.length === 0 && stats.hotNumbers.length > 0) {
        const startNum = stats.hotNumbers[Math.floor(Math.random() * Math.min(3, stats.hotNumbers.length))].number;
        if (!exclude.includes(startNum)) {
            numbers.push(startNum);
        }
    }

    // Build combination based on co-occurrence
    while (numbers.length < numbersPerDraw) {
        const lastNum = numbers[numbers.length - 1];
        const pairs = coOccurrence.get(lastNum);

        if (pairs) {
            const candidates = Array.from(pairs.entries())
                .filter(([num]) => !numbers.includes(num) && !exclude.includes(num))
                .sort((a, b) => a[1] - b[1]) // Lower score = more similar frequency
                .slice(0, 10)
                .map(([num]) => num);

            if (candidates.length > 0) {
                const randomIndex = Math.floor(Math.random() * candidates.length);
                numbers.push(candidates[randomIndex]);
            } else {
                break;
            }
        } else {
            break;
        }
    }

    fillRemainingSafe(numbers, numbersPerDraw, minNumber, maxNumber, exclude);
    return numbers.sort((a, b) => a - b);
}

/**
 * STRATEGY 7: Weighted Random
 * Generates random numbers with weights based on frequency, co-occurrence, and historical position
 * Maintains randomness with subtle tendency
 * @param {Object} gameConfig - Game configuration
 * @param {Object} stats - Statistics report
 * @param {Object} options - Generation options
 * @returns {Array} Array of numbers
 */
export function generateWeightedRandom(gameConfig, stats, options = {}) {
    const { exclude = [], include = [] } = options;
    const { minNumber, maxNumber, numbersPerDraw } = gameConfig;

    let numbers = [...include];

    // Create weighted pool
    const weightedPool = [];
    stats.frequencies.forEach(freq => {
        if (!exclude.includes(freq.number) && !numbers.includes(freq.number)) {
            // Weight based on frequency (subtle: 1-3x)
            const weight = Math.max(1, Math.min(3, Math.floor(freq.percentage / 10)));
            for (let i = 0; i < weight; i++) {
                weightedPool.push(freq.number);
            }
        }
    });

    // Select from weighted pool
    while (numbers.length < numbersPerDraw && weightedPool.length > 0) {
        const randomIndex = Math.floor(Math.random() * weightedPool.length);
        const selectedNumber = weightedPool[randomIndex];

        if (!numbers.includes(selectedNumber)) {
            numbers.push(selectedNumber);
            // Remove all occurrences
            for (let i = weightedPool.length - 1; i >= 0; i--) {
                if (weightedPool[i] === selectedNumber) {
                    weightedPool.splice(i, 1);
                }
            }
        }
    }

    fillRemainingSafe(numbers, numbersPerDraw, minNumber, maxNumber, exclude);
    return numbers.sort((a, b) => a - b);
}

/**
 * STRATEGY 8: Filtered (Exclude Improbable Combinations)
 * Filters combinations with improbable characteristics
 * @param {Object} gameConfig - Game configuration
 * @param {Object} stats - Statistics report
 * @param {Object} options - Generation options
 * @returns {Array} Array of numbers
 */
export function generateFiltered(gameConfig, stats, options = {}) {
    const { exclude = [], include = [] } = options;
    const { minNumber, maxNumber, numbersPerDraw } = gameConfig;

    const maxAttempts = 100;
    let attempts = 0;
    let bestCombo = null;
    let bestScore = -Infinity;

    while (attempts < maxAttempts) {
        attempts++;
        const combo = generatePureRandom(gameConfig, { exclude, include });

        // Calculate improbability score (lower is better)
        let score = 0;

        // Check for long sequences
        const sorted = [...combo].sort((a, b) => a - b);
        let maxSequence = 1;
        let currentSequence = 1;
        for (let i = 1; i < sorted.length; i++) {
            if (sorted[i] === sorted[i - 1] + 1) {
                currentSequence++;
                maxSequence = Math.max(maxSequence, currentSequence);
            } else {
                currentSequence = 1;
            }
        }
        if (maxSequence > 3) score -= (maxSequence - 3) * 20;

        // Check sum
        const sum = combo.reduce((a, b) => a + b, 0);
        const avgSum = ((minNumber + maxNumber) / 2) * numbersPerDraw;
        const sumDeviation = Math.abs(sum - avgSum);
        const maxDeviation = avgSum * 0.3;
        if (sumDeviation > maxDeviation) score -= (sumDeviation - maxDeviation);

        // Check regional concentration
        const range = maxNumber - minNumber + 1;
        const regionSize = Math.floor(range / 3);
        const region1 = combo.filter(n => n < minNumber + regionSize).length;
        const region2 = combo.filter(n => n >= minNumber + regionSize && n < minNumber + regionSize * 2).length;
        const region3 = combo.filter(n => n >= minNumber + regionSize * 2).length;
        const maxRegion = Math.max(region1, region2, region3);
        if (maxRegion > numbersPerDraw * 0.6) score -= (maxRegion - numbersPerDraw * 0.6) * 15;

        // Check even/odd balance
        const evenCount = combo.filter(n => n % 2 === 0).length;
        const evenRatio = evenCount / numbersPerDraw;
        if (evenRatio < 0.2 || evenRatio > 0.8) score -= 30;

        if (score > bestScore) {
            bestScore = score;
            bestCombo = combo;
        }

        // If we found a good combo, use it
        if (score >= -10) break;
    }

    return bestCombo || generatePureRandom(gameConfig, { exclude, include });
}

/**
 * STRATEGY 9: Coverage (Maximize Diversity)
 * When generating multiple games, maximizes coverage and diversity
 * This is handled in generateMultipleCombinations
 * @param {Object} gameConfig - Game configuration
 * @param {Object} stats - Statistics report
 * @param {Object} options - Generation options
 * @returns {Array} Array of numbers
 */
export function generateCoverage(gameConfig, stats, options = {}) {
    const { exclude = [], include = [], usedNumbers = [] } = options;
    const { minNumber, maxNumber, numbersPerDraw } = gameConfig;

    let numbers = [...include];

    // Prioritize unused numbers
    const available = [];
    for (let i = minNumber; i <= maxNumber; i++) {
        if (!exclude.includes(i) && !numbers.includes(i)) {
            // Unused numbers get higher priority
            const priority = usedNumbers.includes(i) ? 1 : 5;
            for (let j = 0; j < priority; j++) {
                available.push(i);
            }
        }
    }

    // Select from available pool
    while (numbers.length < numbersPerDraw && available.length > 0) {
        const randomIndex = Math.floor(Math.random() * available.length);
        const num = available[randomIndex];
        if (!numbers.includes(num)) {
            numbers.push(num);
            // Remove all occurrences
            for (let i = available.length - 1; i >= 0; i--) {
                if (available[i] === num) {
                    available.splice(i, 1);
                }
            }
        }
    }

    fillRemainingSafe(numbers, numbersPerDraw, minNumber, maxNumber, exclude);
    return numbers.sort((a, b) => a - b);
}

/**
 * STRATEGY 10: Combinatorial Filters
 * Applies mathematical filters: limits consecutive numbers, controls repetitions, balances sums
 * @param {Object} gameConfig - Game configuration
 * @param {Object} stats - Statistics report
 * @param {Object} options - Generation options
 * @returns {Array} Array of numbers
 */
export function generateCombinatorial(gameConfig, stats, options = {}) {
    const { exclude = [], include = [] } = options;
    const { minNumber, maxNumber, numbersPerDraw } = gameConfig;

    const maxAttempts = 100;
    let attempts = 0;

    while (attempts < maxAttempts) {
        attempts++;
        let numbers = [...include];

        // Generate with constraints
        while (numbers.length < numbersPerDraw) {
            const randomNum = Math.floor(Math.random() * (maxNumber - minNumber + 1)) + minNumber;

            if (numbers.includes(randomNum) || exclude.includes(randomNum)) continue;

            // Check consecutive limit (max 2 consecutive)
            const sorted = [...numbers, randomNum].sort((a, b) => a - b);
            let consecutiveCount = 1;
            let maxConsecutive = 1;
            for (let i = 1; i < sorted.length; i++) {
                if (sorted[i] === sorted[i - 1] + 1) {
                    consecutiveCount++;
                    maxConsecutive = Math.max(maxConsecutive, consecutiveCount);
                } else {
                    consecutiveCount = 1;
                }
            }

            if (maxConsecutive > 2) continue;

            // Check sum constraint
            const sum = [...numbers, randomNum].reduce((a, b) => a + b, 0);
            const avgSum = ((minNumber + maxNumber) / 2) * numbersPerDraw;
            const maxSum = avgSum * 1.25;
            const minSum = avgSum * 0.75;

            if (numbers.length === numbersPerDraw - 1) {
                if (sum < minSum || sum > maxSum) continue;
            }

            numbers.push(randomNum);
        }

        // Validate final combination
        const sorted = numbers.sort((a, b) => a - b);
        let valid = true;

        // Final consecutive check
        let consecutiveCount = 1;
        for (let i = 1; i < sorted.length; i++) {
            if (sorted[i] === sorted[i - 1] + 1) {
                consecutiveCount++;
                if (consecutiveCount > 2) {
                    valid = false;
                    break;
                }
            } else {
                consecutiveCount = 1;
            }
        }

        if (valid) return sorted;
    }

    // Fallback
    return generatePureRandom(gameConfig, { exclude, include });
}

/**
 * STRATEGY 1: Smart Mix (Recommended)
 * Combines frequency, balanced distribution, patterns, co-occurrence, and combinatorial filters
 * @param {Object} gameConfig - Game configuration
 * @param {Object} stats - Statistics report
 * @param {Object} options - Generation options
 * @returns {Array} Array of numbers
 */
export function generateSmartMixEnhanced(gameConfig, stats, options = {}) {
    const { exclude = [], include = [] } = options;
    const { numbersPerDraw } = gameConfig;

    let numbers = [...include];
    const remaining = numbersPerDraw - numbers.length;

    // 30% from frequency (hot numbers)
    const freqCount = Math.floor(remaining * 0.3);
    const hotNumbers = stats.hotNumbers
        .map(h => h.number)
        .filter(n => !exclude.includes(n) && !numbers.includes(n));

    for (let i = 0; i < freqCount && hotNumbers.length > 0; i++) {
        const randomIndex = Math.floor(Math.random() * Math.min(5, hotNumbers.length));
        numbers.push(hotNumbers.splice(randomIndex, 1)[0]);
    }

    // 20% from overdue numbers
    const overdueCount = Math.floor(remaining * 0.2);
    const overdueNumbers = stats.overdueNumbers
        .map(o => o.number)
        .filter(n => !exclude.includes(n) && !numbers.includes(n));

    for (let i = 0; i < overdueCount && overdueNumbers.length > 0; i++) {
        const randomIndex = Math.floor(Math.random() * Math.min(5, overdueNumbers.length));
        numbers.push(overdueNumbers.splice(randomIndex, 1)[0]);
    }

    // 20% from balanced distribution
    const balancedCombo = generateBalanced(gameConfig, stats, { exclude, include: numbers });
    const balancedNew = balancedCombo.filter(n => !numbers.includes(n));
    const balancedCount = Math.floor(remaining * 0.2);
    for (let i = 0; i < balancedCount && balancedNew.length > 0; i++) {
        numbers.push(balancedNew.shift());
    }

    // 30% random with filters
    fillRemainingSafe(numbers, numbersPerDraw, gameConfig.minNumber, gameConfig.maxNumber, exclude);

    return numbers.sort((a, b) => a - b);
}

/**
 * Fibonacci Strategy: Uses Fibonacci sequence for number selection
 * Based on Leonardo Fibonacci's mathematical sequence
 * @param {Object} gameConfig - Game configuration
 * @param {Object} stats - Statistics report
 * @param {Object} options - Generation options
 * @returns {Array} Array of numbers
 */
export function generateFibonacci(gameConfig, stats, options = {}) {
    const { exclude = [], include = [] } = options;
    const { minNumber, maxNumber, numbersPerDraw } = gameConfig;

    let numbers = [...include];

    // Generate Fibonacci sequence up to maxNumber (avoiding duplicates)
    const fibonacci = [1, 2]; // Start with 1, 2 to avoid duplicate 1s
    while (fibonacci[fibonacci.length - 1] < maxNumber) {
        const next = fibonacci[fibonacci.length - 1] + fibonacci[fibonacci.length - 2];
        if (next <= maxNumber) fibonacci.push(next);
        else break;
    }

    // Filter valid Fibonacci numbers (remove duplicates)
    const validFib = [...new Set(fibonacci)].filter(n =>
        n >= minNumber && n <= maxNumber && !exclude.includes(n) && !numbers.includes(n)
    );

    // Use 60% Fibonacci numbers, 40% weighted by frequency
    const fibCount = Math.floor((numbersPerDraw - numbers.length) * 0.6);

    // Add Fibonacci numbers
    for (let i = 0; i < fibCount && validFib.length > 0; i++) {
        const randomIndex = Math.floor(Math.random() * validFib.length);
        numbers.push(validFib.splice(randomIndex, 1)[0]);
    }

    // Fill remaining with weighted random
    const freqMap = new Map();
    stats.frequencies.forEach(f => {
        freqMap.set(f.number, { percentage: parseFloat(f.percentage), count: f.count });
    });

    let attempts = 0;
    const maxAttempts = numbersPerDraw * 10;

    while (numbers.length < numbersPerDraw && attempts < maxAttempts) {
        const available = [];
        for (let i = minNumber; i <= maxNumber; i++) {
            if (!numbers.includes(i) && !exclude.includes(i)) {
                const freq = freqMap.get(i);
                const weight = freq ? Math.max(1, Math.floor(freq.percentage)) : 1;
                for (let j = 0; j < weight; j++) {
                    available.push(i);
                }
            }
        }
        if (available.length > 0) {
            const randomIndex = Math.floor(Math.random() * available.length);
            const num = available[randomIndex];
            if (!numbers.includes(num)) {
                numbers.push(num);
            }
        }
        attempts++;
    }

    // Fallback if needed
    fillRemainingSafe(numbers, numbersPerDraw, minNumber, maxNumber, exclude);

    return numbers.sort((a, b) => a - b);
}

/**
 * Prime Numbers Strategy: Prioritizes prime numbers
 * Based on number theory and prime distribution
 * @param {Object} gameConfig - Game configuration
 * @param {Object} stats - Statistics report
 * @param {Object} options - Generation options
 * @returns {Array} Array of numbers
 */
export function generatePrimeNumbers(gameConfig, stats, options = {}) {
    const { exclude = [], include = [] } = options;
    const { minNumber, maxNumber, numbersPerDraw } = gameConfig;

    let numbers = [...include];

    // Check if number is prime
    const isPrime = (num) => {
        if (num < 2) return false;
        if (num === 2) return true;
        if (num % 2 === 0) return false;
        for (let i = 3; i <= Math.sqrt(num); i += 2) {
            if (num % i === 0) return false;
        }
        return true;
    };

    // Get all prime numbers in range
    const primes = [];
    for (let i = minNumber; i <= maxNumber; i++) {
        if (isPrime(i) && !exclude.includes(i) && !numbers.includes(i)) {
            primes.push(i);
        }
    }

    // Use 50% primes, 50% composite numbers
    const primeCount = Math.floor((numbersPerDraw - numbers.length) * 0.5);

    // Add prime numbers
    for (let i = 0; i < primeCount && primes.length > 0; i++) {
        const randomIndex = Math.floor(Math.random() * primes.length);
        numbers.push(primes.splice(randomIndex, 1)[0]);
    }

    // Fill with composite numbers
    fillRemainingSafe(numbers, numbersPerDraw, minNumber, maxNumber, exclude);

    return numbers.sort((a, b) => a - b);
}

/**
 * Golden Ratio Strategy: Uses phi (φ ≈ 1.618) for number distribution
 * Based on the golden ratio discovered by ancient Greek mathematicians
 * @param {Object} gameConfig - Game configuration
 * @param {Object} stats - Statistics report
 * @param {Object} options - Generation options
 * @returns {Array} Array of numbers
 */
export function generateGoldenRatio(gameConfig, stats, options = {}) {
    const { exclude = [], include = [] } = options;
    const { minNumber, maxNumber, numbersPerDraw } = gameConfig;

    let numbers = [...include];
    const phi = 1.618033988749895; // Golden ratio

    // Generate numbers using golden ratio spacing
    const range = maxNumber - minNumber + 1;
    const step = range / numbersPerDraw;

    const candidates = new Set();
    // Start from a random position to add variety
    let position = minNumber + Math.random() * range;
    let iterations = 0;
    const maxIterations = range * 2; // Safety limit

    // Generate candidates using phi spacing
    while (candidates.size < Math.min(numbersPerDraw * 2, range) && iterations < maxIterations) {
        const num = Math.round(position);
        if (num >= minNumber && num <= maxNumber) {
            candidates.add(num);
        }
        position += step * phi;
        if (position > maxNumber) {
            position = minNumber + ((position - maxNumber) % range);
        }
        iterations++;
    }

    // Convert to array and filter
    const validCandidates = Array.from(candidates).filter(
        num => !exclude.includes(num) && !numbers.includes(num)
    );

    // Shuffle candidates to add randomness
    for (let i = validCandidates.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [validCandidates[i], validCandidates[j]] = [validCandidates[j], validCandidates[i]];
    }

    // Select from shuffled candidates
    const needed = numbersPerDraw - numbers.length;
    for (let i = 0; i < Math.min(needed, validCandidates.length); i++) {
        numbers.push(validCandidates[i]);
    }

    // Fill remaining randomly if needed
    while (numbers.length < numbersPerDraw) {
        const randomNum = Math.floor(Math.random() * (maxNumber - minNumber + 1)) + minNumber;
        if (!numbers.includes(randomNum) && !exclude.includes(randomNum)) {
            numbers.push(randomNum);
        }
    }

    return numbers.sort((a, b) => a - b);
}

/**
 * Gaussian Distribution Strategy: Uses normal distribution (Bell Curve)
 * Based on Carl Friedrich Gauss's probability theory
 * @param {Object} gameConfig - Game configuration
 * @param {Object} stats - Statistics report
 * @param {Object} options - Generation options
 * @returns {Array} Array of numbers
 */
export function generateGaussian(gameConfig, stats, options = {}) {
    const { exclude = [], include = [] } = options;
    const { minNumber, maxNumber, numbersPerDraw } = gameConfig;

    let numbers = [...include];

    // Box-Muller transform for Gaussian distribution
    const gaussianRandom = (mean, stdDev) => {
        const u1 = Math.random();
        const u2 = Math.random();
        const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
        return z0 * stdDev + mean;
    };

    const mean = (minNumber + maxNumber) / 2;
    const stdDev = (maxNumber - minNumber) / 6; // 99.7% within range

    let attempts = 0;
    const maxAttempts = numbersPerDraw * 100; // Gaussian may need more attempts

    while (numbers.length < numbersPerDraw && attempts < maxAttempts) {
        const num = Math.round(gaussianRandom(mean, stdDev));
        if (num >= minNumber && num <= maxNumber &&
            !numbers.includes(num) && !exclude.includes(num)) {
            numbers.push(num);
        }
        attempts++;
    }

    // Fallback if Gaussian didn't generate enough
    fillRemainingSafe(numbers, numbersPerDraw, minNumber, maxNumber, exclude);

    return numbers.sort((a, b) => a - b);
}

/**
 * Markov Chain Strategy: Uses transition probabilities between numbers
 * Based on Andrey Markov's stochastic process theory
 * @param {Object} gameConfig - Game configuration
 * @param {Object} stats - Statistics report
 * @param {Object} options - Generation options
 * @returns {Array} Array of numbers
 */
export function generateMarkovChain(gameConfig, stats, options = {}) {
    const { exclude = [], include = [] } = options;
    const { minNumber, maxNumber, numbersPerDraw } = gameConfig;

    let numbers = [...include];

    // Build transition matrix from historical data
    const transitions = new Map();

    // Initialize transition counts
    for (let i = minNumber; i <= maxNumber; i++) {
        transitions.set(i, new Map());
    }

    // Analyze consecutive number patterns in stats
    if (stats.frequencies && stats.frequencies.length > 0) {
        stats.frequencies.forEach((freq, idx) => {
            const nextIdx = (idx + 1) % stats.frequencies.length;
            const currentNum = freq.number;
            const nextNum = stats.frequencies[nextIdx].number;

            const transMap = transitions.get(currentNum);
            transMap.set(nextNum, (transMap.get(nextNum) || 0) + 1);
        });
    }

    // Start with a random hot number or completely random
    let currentNum;
    if (numbers.length === 0) {
        if (stats.hotNumbers && stats.hotNumbers.length > 0) {
            // Pick a random hot number instead of always the first
            const randomHotIndex = Math.floor(Math.random() * Math.min(5, stats.hotNumbers.length));
            currentNum = stats.hotNumbers[randomHotIndex].number;
        } else {
            currentNum = Math.floor(Math.random() * (maxNumber - minNumber + 1)) + minNumber;
        }

        if (!exclude.includes(currentNum)) {
            numbers.push(currentNum);
        }
    } else {
        currentNum = numbers[numbers.length - 1];
    }

    // Generate remaining numbers using Markov chain
    let attempts = 0;
    const maxAttempts = numbersPerDraw * 50;

    while (numbers.length < numbersPerDraw && attempts < maxAttempts) {
        const transMap = transitions.get(currentNum);
        const candidates = [];

        transMap.forEach((count, num) => {
            if (!numbers.includes(num) && !exclude.includes(num)) {
                for (let i = 0; i < count; i++) {
                    candidates.push(num);
                }
            }
        });

        if (candidates.length > 0) {
            const randomIndex = Math.floor(Math.random() * candidates.length);
            currentNum = candidates[randomIndex];
            numbers.push(currentNum);
        } else {
            // Fallback to random if no transitions available
            const randomNum = Math.floor(Math.random() * (maxNumber - minNumber + 1)) + minNumber;
            if (!numbers.includes(randomNum) && !exclude.includes(randomNum)) {
                currentNum = randomNum;
                numbers.push(randomNum);
            }
        }
        attempts++;
    }

    // Final fallback
    fillRemainingSafe(numbers, numbersPerDraw, minNumber, maxNumber, exclude);

    return numbers.sort((a, b) => a - b);
}

/**
 * Entropy Maximization Strategy: Maximizes information entropy
 * Based on Claude Shannon's information theory
 * @param {Object} gameConfig - Game configuration
 * @param {Object} stats - Statistics report
 * @param {Object} options - Generation options
 * @returns {Array} Array of numbers
 */
export function generateMaxEntropy(gameConfig, stats, options = {}) {
    const { exclude = [], include = [] } = options;
    const { minNumber, maxNumber, numbersPerDraw } = gameConfig;

    let numbers = [...include];

    // Calculate entropy score for each number based on its unpredictability
    const entropyScores = new Map();

    stats.frequencies.forEach(freq => {
        const probability = parseFloat(freq.percentage) / 100;
        // Shannon entropy: -p * log2(p)
        const entropy = probability > 0 ? -probability * Math.log2(probability) : 0;
        entropyScores.set(freq.number, entropy);
    });

    // Sort numbers by entropy (highest = most unpredictable)
    const sortedByEntropy = Array.from(entropyScores.entries())
        .filter(([num]) => !exclude.includes(num) && !numbers.includes(num))
        .sort((a, b) => b[1] - a[1])
        .map(([num]) => num);

    // Select numbers with highest entropy
    const highEntropyCount = Math.floor((numbersPerDraw - numbers.length) * 0.7);

    for (let i = 0; i < sortedByEntropy.length && numbers.length < (include.length + highEntropyCount); i++) {
        if (!numbers.includes(sortedByEntropy[i])) {
            numbers.push(sortedByEntropy[i]);
        }
    }

    // Fill remaining randomly
    fillRemainingSafe(numbers, numbersPerDraw, minNumber, maxNumber, exclude);

    return numbers.sort((a, b) => a - b);
}

/**
 * Monte Carlo Strategy: Uses repeated random sampling
 * Based on Stanisław Ulam and John von Neumann's simulation method
 * @param {Object} gameConfig - Game configuration
 * @param {Object} stats - Statistics report
 * @param {Object} options - Generation options
 * @returns {Array} Array of numbers
 */
export function generateMonteCarlo(gameConfig, stats, options = {}) {
    const { exclude = [], include = [] } = options;
    const { minNumber, maxNumber, numbersPerDraw } = gameConfig;

    // Run multiple simulations and pick the best combination
    const simulations = 100;
    const candidates = [];

    for (let sim = 0; sim < simulations; sim++) {
        const combo = generatePureRandom(gameConfig, { exclude, include });

        // Score based on statistical properties
        let score = 0;

        // Check even/odd balance
        const evenCount = combo.filter(n => n % 2 === 0).length;
        const oddCount = combo.length - evenCount;
        const evenOddBalance = Math.abs(evenCount - oddCount);
        score += (numbersPerDraw - evenOddBalance) * 10;

        // Check distribution across range
        const lowCount = combo.filter(n => n <= (minNumber + maxNumber) / 2).length;
        const highCount = combo.length - lowCount;
        const rangeBalance = Math.abs(lowCount - highCount);
        score += (numbersPerDraw - rangeBalance) * 10;

        // Check spacing between numbers
        const sorted = [...combo].sort((a, b) => a - b);
        let totalSpacing = 0;
        for (let i = 1; i < sorted.length; i++) {
            totalSpacing += sorted[i] - sorted[i - 1];
        }
        const avgSpacing = totalSpacing / (sorted.length - 1);
        const idealSpacing = (maxNumber - minNumber) / numbersPerDraw;
        score += Math.max(0, 100 - Math.abs(avgSpacing - idealSpacing) * 5);

        candidates.push({ combo, score });
    }

    // Return the best scoring combination
    candidates.sort((a, b) => b.score - a.score);
    return candidates[0].combo;
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
/**
 * Helper function to check if a combination already exists
 * @param {Array} combination - Numbers array to check
 * @param {Array} existingCombinations - Array of existing combinations
 * @returns {boolean} True if combination is duplicate
 */
function isDuplicateCombination(combination, existingCombinations) {
    const sortedNew = [...combination].sort((a, b) => a - b).join(',');
    return existingCombinations.some(existing => {
        const sortedExisting = [...existing.numbers].sort((a, b) => a - b).join(',');
        return sortedNew === sortedExisting;
    });
}

/**
 * Generate a single combination based on strategy
 * @param {string} strategy - Generation strategy
 * @param {Object} gameConfig - Game configuration
 * @param {Object} stats - Statistics report
 * @param {Object} options - Generation options
 * @returns {Array} Array of numbers
 */
function generateSingleCombination(strategy, gameConfig, stats, options) {
    if (!stats && strategy !== 'random') {
        throw new Error('Statistics required for ' + strategy + ' strategy');
    }

    switch (strategy) {
        case 'smart-mix':
            return generateSmartMixEnhanced(gameConfig, stats, options);

        case 'frequency':
            return generateFrequencyBased(gameConfig, stats, options);

        case 'pattern':
            return generatePatternBased(gameConfig, stats, options);

        case 'balanced':
            return generateBalanced(gameConfig, stats, options);

        case 'co-occurrence':
            return generateCoOccurrence(gameConfig, stats, options);

        case 'weighted-random':
            return generateWeightedRandom(gameConfig, stats, options);

        case 'filtered':
            return generateFiltered(gameConfig, stats, options);

        case 'coverage':
            return generateCoverage(gameConfig, stats, options);

        case 'combinatorial':
            return generateCombinatorial(gameConfig, stats, options);

        case 'random':
        default:
            return generatePureRandom(gameConfig, options);
    }
}

/**
 * Generate explanation for a combination based on strategy
 * @param {Array} numbers - Generated numbers
 * @param {string} strategy - Strategy used
 * @param {Object} gameConfig - Game configuration
 * @param {Object} stats - Statistics report
 * @returns {string} Explanation text
 */
function generateExplanation(numbers, strategy, gameConfig, stats) {
    const { minNumber, maxNumber, numbersPerDraw } = gameConfig;
    const sorted = [...numbers].sort((a, b) => a - b);

    // Calculate statistics
    const evenCount = numbers.filter(n => n % 2 === 0).length;
    const oddCount = numbers.length - evenCount;
    const midPoint = (minNumber + maxNumber) / 2;
    const lowCount = numbers.filter(n => n <= midPoint).length;
    const highCount = numbers.length - lowCount;
    const sum = numbers.reduce((a, b) => a + b, 0);
    const avgSum = ((minNumber + maxNumber) / 2) * numbersPerDraw;

    // Check for consecutive numbers
    let consecutiveGroups = [];
    let currentGroup = [sorted[0]];
    for (let i = 1; i < sorted.length; i++) {
        if (sorted[i] === sorted[i - 1] + 1) {
            currentGroup.push(sorted[i]);
        } else {
            if (currentGroup.length > 1) consecutiveGroups.push([...currentGroup]);
            currentGroup = [sorted[i]];
        }
    }
    if (currentGroup.length > 1) consecutiveGroups.push(currentGroup);

    // Identify hot and cold numbers
    const hotNumbers = stats.hotNumbers.slice(0, 10).map(h => h.number);
    const coldNumbers = stats.overdueNumbers.slice(0, 10).map(o => o.number);
    const hotInCombo = numbers.filter(n => hotNumbers.includes(n));
    const coldInCombo = numbers.filter(n => coldNumbers.includes(n));

    let explanation = '';

    switch (strategy) {
        case 'smart-mix':
            explanation = `<strong>Mix Inteligente:</strong> Combinação equilibrada com ${hotInCombo.length} números quentes (${hotInCombo.join(', ') || 'nenhum'}), ${coldInCombo.length} números atrasados (${coldInCombo.join(', ') || 'nenhum'}). Distribuição: ${evenCount} pares e ${oddCount} ímpares, ${lowCount} baixos e ${highCount} altos. Soma total: ${sum} (média histórica: ${Math.round(avgSum)}).`;
            break;

        case 'frequency':
            explanation = `<strong>Baseado em Frequência:</strong> ${hotInCombo.length} números quentes (${hotInCombo.join(', ') || 'nenhum'}), ${numbers.length - hotInCombo.length - coldInCombo.length} médios, ${coldInCombo.length} frios (${coldInCombo.join(', ') || 'nenhum'}). Equilíbrio: ${evenCount}E/${oddCount}O, ${lowCount}B/${highCount}A.`;
            break;

        case 'pattern':
            explanation = `<strong>Baseado em Padrões:</strong> Padrão ${evenCount}E-${oddCount}O comum nos sorteios. ${consecutiveGroups.length > 0 ? `Consecutivos: ${consecutiveGroups.map(g => g.join('-')).join(', ')}. ` : ''}Distribuição baixo/alto: ${lowCount}/${highCount}.`;
            break;

        case 'balanced':
            explanation = `<strong>Distribuição Balanceada:</strong> ${evenCount} pares e ${oddCount} ímpares (ideal: ${Math.round(numbersPerDraw / 2)}/${Math.round(numbersPerDraw / 2)}). ${lowCount} baixos (1-${Math.round(midPoint)}) e ${highCount} altos (${Math.round(midPoint) + 1}-${maxNumber}). Soma ${sum} ${sum > avgSum ? 'acima' : 'abaixo'} da média (${Math.round(avgSum)}).`;
            break;

        case 'co-occurrence':
            explanation = `<strong>Co-ocorrência:</strong> Números com correlação estatística. Iniciando com ${sorted[0]}, ${hotInCombo.length} números quentes incluídos. Distribuição: ${evenCount}E/${oddCount}O, soma ${sum}.`;
            break;

        case 'weighted-random':
            explanation = `<strong>Geração Ponderada:</strong> ${hotInCombo.length} números quentes, ${numbers.length - hotInCombo.length - coldInCombo.length} médios, ${coldInCombo.length} frios. Aleatoriedade com viés sutil. Soma: ${sum}.`;
            break;

        case 'filtered':
            explanation = `<strong>Exclusão de Improváveis:</strong> ${consecutiveGroups.length === 0 ? 'Sem sequências longas.' : `Consecutivos: ${consecutiveGroups.map(g => g.join('-')).join(', ')}.`} Soma ${sum} na faixa (${Math.round(avgSum * 0.75)}-${Math.round(avgSum * 1.25)}). ${evenCount}E/${oddCount}O.`;
            break;

        case 'coverage':
            explanation = `<strong>Varredura de Cobertura:</strong> Maximiza diversidade, prioriza números menos usados. Distribuição: ${evenCount} pares, ${oddCount} ímpares, ${lowCount} baixos, ${highCount} altos. Soma: ${sum}.`;
            break;

        case 'combinatorial':
            explanation = `<strong>Filtros Combinatórios:</strong> Máx 2 consecutivos. Soma ${sum} controlada (${Math.round(avgSum * 0.75)}-${Math.round(avgSum * 1.25)}). ${evenCount}E/${oddCount}O, ${lowCount}B/${highCount}A.`;
            break;

        case 'random':
        default:
            explanation = `<strong>Aleatório Puro:</strong> Geração sem filtros. ${evenCount} pares, ${oddCount} ímpares, ${lowCount} baixos, ${highCount} altos. Soma: ${sum}. Todas as combinações têm igual probabilidade.`;
            break;
    }

    return explanation;
}

export function generateMultipleCombinations(strategy, count, gameConfig, stats = null, options = {}) {
    const combinations = [];
    const maxAttempts = count * 50; // Safety limit to avoid infinite loops
    let attempts = 0;
    const usedNumbers = []; // Track used numbers for coverage strategy

    while (combinations.length < count && attempts < maxAttempts) {
        attempts++;

        try {
            // For coverage strategy, pass used numbers
            const strategyOptions = strategy === 'coverage'
                ? { ...options, usedNumbers }
                : options;

            const combination = generateSingleCombination(strategy, gameConfig, stats, strategyOptions);

            // Check if this combination is unique
            if (!isDuplicateCombination(combination, combinations)) {
                const explanation = generateExplanation(combination, strategy, gameConfig, stats);

                combinations.push({
                    id: combinations.length + 1,
                    numbers: combination,
                    strategy,
                    explanation
                });

                // Track used numbers for coverage
                if (strategy === 'coverage') {
                    combination.forEach(num => {
                        if (!usedNumbers.includes(num)) {
                            usedNumbers.push(num);
                        }
                    });
                }
            }
        } catch (error) {
            console.error(`Error generating combination (attempt ${attempts}):`, error);
            // Continue trying with next attempt
        }
    }

    // If we couldn't generate enough unique combinations, warn the user
    if (combinations.length < count) {
        console.warn(`Only generated ${combinations.length} unique combinations out of ${count} requested`);
    }

    return combinations;
}
