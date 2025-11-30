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
    fillRemainingSafe(numbers, numbersPerDraw, gameConfig.minNumber, gameConfig.maxNumber, exclude);

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
    switch (strategy) {
        case 'weighted':
            if (!stats || !stats.frequencies) {
                throw new Error('Statistics required for weighted strategy');
            }
            const freqMap = new Map();
            stats.frequencies.forEach(f => {
                freqMap.set(f.number, { percentage: parseFloat(f.percentage), count: f.count });
            });
            return generateWeightedRandom(gameConfig, freqMap, options);

        case 'smart-mix':
            if (!stats) {
                throw new Error('Statistics required for smart mix strategy');
            }
            return generateSmartMix(gameConfig, stats, options);

        case 'pattern':
            if (!stats) {
                throw new Error('Statistics required for pattern-based strategy');
            }
            return generatePatternBased(gameConfig, stats, options);

        case 'fibonacci':
            if (!stats) {
                throw new Error('Statistics required for Fibonacci strategy');
            }
            return generateFibonacci(gameConfig, stats, options);

        case 'prime':
            if (!stats) {
                throw new Error('Statistics required for prime numbers strategy');
            }
            return generatePrimeNumbers(gameConfig, stats, options);

        case 'golden-ratio':
            if (!stats) {
                throw new Error('Statistics required for golden ratio strategy');
            }
            return generateGoldenRatio(gameConfig, stats, options);

        case 'gaussian':
            if (!stats) {
                throw new Error('Statistics required for Gaussian strategy');
            }
            return generateGaussian(gameConfig, stats, options);

        case 'markov':
            if (!stats) {
                throw new Error('Statistics required for Markov chain strategy');
            }
            return generateMarkovChain(gameConfig, stats, options);

        case 'entropy':
            if (!stats) {
                throw new Error('Statistics required for entropy strategy');
            }
            return generateMaxEntropy(gameConfig, stats, options);

        case 'monte-carlo':
            if (!stats) {
                throw new Error('Statistics required for Monte Carlo strategy');
            }
            return generateMonteCarlo(gameConfig, stats, options);

        case 'random':
        default:
            return generatePureRandom(gameConfig, options);
    }
}

export function generateMultipleCombinations(strategy, count, gameConfig, stats = null, options = {}) {
    const combinations = [];
    const maxAttempts = count * 50; // Safety limit to avoid infinite loops
    let attempts = 0;

    while (combinations.length < count && attempts < maxAttempts) {
        attempts++;

        try {
            const combination = generateSingleCombination(strategy, gameConfig, stats, options);

            // Check if this combination is unique
            if (!isDuplicateCombination(combination, combinations)) {
                combinations.push({
                    id: combinations.length + 1,
                    numbers: combination,
                    strategy
                });
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
