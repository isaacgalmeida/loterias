/**
 * Game configuration and data models
 */

export const GAMES = {
    LOTOFACIL: {
        id: 'lotofacil',
        name: 'Lotofácil',
        icon: '🍀',
        minNumber: 1,
        maxNumber: 25,
        numbersPerDraw: 15,
        description: '15 números de 1 a 25',
        apiUrl: 'https://servicebus2.caixa.gov.br/portaldeloterias/api/lotofacil'
    },
    MEGASENA: {
        id: 'megasena',
        name: 'Mega-Sena',
        icon: '💎',
        minNumber: 1,
        maxNumber: 60,
        numbersPerDraw: 6,
        description: '6 números de 1 a 60',
        apiUrl: 'https://servicebus2.caixa.gov.br/portaldeloterias/api/megasena'
    }
};

/**
 * Draw data model
 */
export class Draw {
    constructor(concurso, data, numeros) {
        this.concurso = concurso;
        this.data = data;
        this.numeros = numeros; // Array of numbers
    }

    hasNumber(number) {
        return this.numeros.includes(number);
    }

    getEvenCount() {
        return this.numeros.filter(n => n % 2 === 0).length;
    }

    getOddCount() {
        return this.numeros.filter(n => n % 2 !== 0).length;
    }
}

/**
 * Number frequency data model
 */
export class NumberFrequency {
    constructor(number) {
        this.number = number;
        this.count = 0;
        this.percentage = 0;
        this.lastDrawIndex = -1;
        this.delay = 0; // How many draws since it last appeared
    }

    increment(drawIndex) {
        this.count++;
        this.lastDrawIndex = drawIndex;
    }

    calculatePercentage(totalDraws) {
        this.percentage = (this.count / totalDraws) * 100;
    }

    calculateDelay(currentDrawIndex) {
        if (this.lastDrawIndex === -1) {
            this.delay = currentDrawIndex;
        } else {
            this.delay = currentDrawIndex - this.lastDrawIndex;
        }
    }
}

/**
 * Game statistics model
 */
export class GameStats {
    constructor(gameConfig) {
        this.gameConfig = gameConfig;
        this.draws = [];
        this.frequencies = new Map();
        this.patterns = {
            evenOdd: [],
            lowHigh: [],
            sequences: []
        };
    }

    addDraw(draw) {
        this.draws.push(draw);
    }

    getTotalDraws() {
        return this.draws.length;
    }

    getDraws() {
        return this.draws;
    }

    getFrequencies() {
        return this.frequencies;
    }
}
