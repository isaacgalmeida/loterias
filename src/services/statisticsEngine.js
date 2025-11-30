import { NumberFrequency } from '../utils/dataModels.js';

/**
 * Statistical Analysis Engine
 * Analyzes historical lottery data to extract patterns and insights
 */

/**
 * Calculate frequency of each number across all draws
 * @param {Array} draws - Array of draw objects
 * @param {Object} gameConfig - Game configuration
 * @returns {Map} Map of number to frequency data
 */
export function calculateFrequencies(draws, gameConfig) {
    const frequencies = new Map();

    // Initialize all possible numbers
    for (let i = gameConfig.minNumber; i <= gameConfig.maxNumber; i++) {
        frequencies.set(i, new NumberFrequency(i));
    }

    // Count occurrences
    draws.forEach((draw, index) => {
        draw.numeros.forEach(num => {
            if (frequencies.has(num)) {
                frequencies.get(num).increment(index);
            }
        });
    });

    // Calculate percentages and delays
    const totalDraws = draws.length;
    frequencies.forEach(freq => {
        freq.calculatePercentage(totalDraws);
        freq.calculateDelay(totalDraws - 1);
    });

    return frequencies;
}

/**
 * Get hot numbers (most frequently drawn)
 * @param {Map} frequencies - Map of number frequencies
 * @param {number} count - Number of hot numbers to return
 * @returns {Array} Array of hot numbers sorted by frequency
 */
export function getHotNumbers(frequencies, count = 10) {
    return Array.from(frequencies.values())
        .sort((a, b) => b.count - a.count)
        .slice(0, count)
        .map(freq => ({
            number: freq.number,
            count: freq.count,
            percentage: freq.percentage.toFixed(2)
        }));
}

/**
 * Get cold numbers (least frequently drawn)
 * @param {Map} frequencies - Map of number frequencies
 * @param {number} count - Number of cold numbers to return
 * @returns {Array} Array of cold numbers sorted by frequency
 */
export function getColdNumbers(frequencies, count = 10) {
    return Array.from(frequencies.values())
        .sort((a, b) => a.count - b.count)
        .slice(0, count)
        .map(freq => ({
            number: freq.number,
            count: freq.count,
            percentage: freq.percentage.toFixed(2)
        }));
}

/**
 * Get overdue numbers (numbers with longest delay since last appearance)
 * @param {Map} frequencies - Map of number frequencies
 * @param {number} count - Number of overdue numbers to return
 * @returns {Array} Array of overdue numbers sorted by delay
 */
export function getOverdueNumbers(frequencies, count = 10) {
    return Array.from(frequencies.values())
        .sort((a, b) => b.delay - a.delay)
        .slice(0, count)
        .map(freq => ({
            number: freq.number,
            delay: freq.delay,
            lastDrawIndex: freq.lastDrawIndex
        }));
}

/**
 * Analyze even/odd distribution patterns
 * @param {Array} draws - Array of draw objects
 * @returns {Object} Even/odd pattern statistics
 */
export function analyzeEvenOddPattern(draws) {
    const patterns = {};

    draws.forEach(draw => {
        const evenCount = draw.numeros.filter(n => n % 2 === 0).length;
        const oddCount = draw.numeros.length - evenCount;
        const pattern = `${evenCount}E-${oddCount}O`;

        patterns[pattern] = (patterns[pattern] || 0) + 1;
    });

    // Convert to array and sort by frequency
    return Object.entries(patterns)
        .map(([pattern, count]) => ({
            pattern,
            count,
            percentage: ((count / draws.length) * 100).toFixed(2)
        }))
        .sort((a, b) => b.count - a.count);
}

/**
 * Analyze low/high number distribution patterns
 * @param {Array} draws - Array of draw objects
 * @param {Object} gameConfig - Game configuration
 * @returns {Object} Low/high pattern statistics
 */
export function analyzeLowHighPattern(draws, gameConfig) {
    const midpoint = Math.floor((gameConfig.minNumber + gameConfig.maxNumber) / 2);
    const patterns = {};

    draws.forEach(draw => {
        const lowCount = draw.numeros.filter(n => n <= midpoint).length;
        const highCount = draw.numeros.length - lowCount;
        const pattern = `${lowCount}L-${highCount}H`;

        patterns[pattern] = (patterns[pattern] || 0) + 1;
    });

    // Convert to array and sort by frequency
    return Object.entries(patterns)
        .map(([pattern, count]) => ({
            pattern,
            count,
            percentage: ((count / draws.length) * 100).toFixed(2)
        }))
        .sort((a, b) => b.count - a.count);
}

/**
 * Find most common number pairs
 * @param {Array} draws - Array of draw objects
 * @param {number} count - Number of pairs to return
 * @returns {Array} Array of common pairs
 */
export function findCommonPairs(draws, count = 10) {
    const pairs = new Map();

    draws.forEach(draw => {
        const sortedNumbers = [...draw.numeros].sort((a, b) => a - b);

        for (let i = 0; i < sortedNumbers.length; i++) {
            for (let j = i + 1; j < sortedNumbers.length; j++) {
                const pair = `${sortedNumbers[i]}-${sortedNumbers[j]}`;
                pairs.set(pair, (pairs.get(pair) || 0) + 1);
            }
        }
    });

    return Array.from(pairs.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, count)
        .map(([pair, count]) => ({ pair, count }));
}

/**
 * Analyze recent trends (last N draws)
 * @param {Array} draws - Array of draw objects
 * @param {Object} gameConfig - Game configuration
 * @param {number} recentCount - Number of recent draws to analyze
 * @returns {Object} Recent trend statistics
 */
export function analyzeRecentTrends(draws, gameConfig, recentCount = 10) {
    const recentDraws = draws.slice(-recentCount);
    const recentFrequencies = new Map();

    // Initialize all numbers
    for (let i = gameConfig.minNumber; i <= gameConfig.maxNumber; i++) {
        recentFrequencies.set(i, 0);
    }

    // Count recent occurrences
    recentDraws.forEach(draw => {
        draw.numeros.forEach(num => {
            recentFrequencies.set(num, recentFrequencies.get(num) + 1);
        });
    });

    // Get trending numbers (appeared most in recent draws)
    const trending = Array.from(recentFrequencies.entries())
        .filter(([_, count]) => count > 0)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([number, count]) => ({
            number,
            count,
            percentage: ((count / recentCount) * 100).toFixed(2)
        }));

    return {
        recentDrawCount: recentCount,
        trending
    };
}

/**
 * Generate comprehensive statistics report
 * @param {Array} draws - Array of draw objects
 * @param {Object} gameConfig - Game configuration
 * @returns {Object} Complete statistics report
 */
export function generateStatisticsReport(draws, gameConfig) {
    const frequencies = calculateFrequencies(draws, gameConfig);

    return {
        totalDraws: draws.length,
        frequencies: Array.from(frequencies.values()).map(freq => ({
            number: freq.number,
            count: freq.count,
            percentage: freq.percentage.toFixed(2),
            delay: freq.delay
        })),
        hotNumbers: getHotNumbers(frequencies, 10),
        coldNumbers: getColdNumbers(frequencies, 10),
        overdueNumbers: getOverdueNumbers(frequencies, 10),
        evenOddPatterns: analyzeEvenOddPattern(draws),
        lowHighPatterns: analyzeLowHighPattern(draws, gameConfig),
        commonPairs: findCommonPairs(draws, 10),
        recentTrends: analyzeRecentTrends(draws, gameConfig, 10)
    };
}
