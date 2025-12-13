/**
 * Configuração de Loterias Suportadas
 * Facilita a adição de novas loterias ao sistema
 */

export const LOTTERY_CONFIGS = {
    // Loterias já implementadas
    lotofacil: {
        id: 'lotofacil',
        name: 'Lotofácil',
        icon: '🍀',
        apiUrl: 'https://servicebus2.caixa.gov.br/portaldeloterias/api/lotofacil',
        numbersCount: 15,
        minNumber: 1,
        maxNumber: 25,
        cacheFile: 'data/lotofacil.json',
        description: '15 números de 1 a 25',
        active: true
    },
    
    megasena: {
        id: 'megasena',
        name: 'Mega-Sena',
        icon: '💎',
        apiUrl: 'https://servicebus2.caixa.gov.br/portaldeloterias/api/megasena',
        numbersCount: 6,
        minNumber: 1,
        maxNumber: 60,
        cacheFile: 'data/megasena.json',
        description: '6 números de 1 a 60',
        active: true
    },
    
    // Loterias prontas para implementar (desabilitadas)
    quina: {
        id: 'quina',
        name: 'Quina',
        icon: '🎯',
        apiUrl: 'https://servicebus2.caixa.gov.br/portaldeloterias/api/quina',
        numbersCount: 5,
        minNumber: 1,
        maxNumber: 80,
        cacheFile: 'data/quina.json',
        description: '5 números de 1 a 80',
        active: false
    },
    
    lotomania: {
        id: 'lotomania',
        name: 'Lotomania',
        icon: '🎪',
        apiUrl: 'https://servicebus2.caixa.gov.br/portaldeloterias/api/lotomania',
        numbersCount: 20,
        minNumber: 0,
        maxNumber: 99,
        cacheFile: 'data/lotomania.json',
        description: '20 números de 00 a 99',
        active: false
    }
};

/**
 * Obtém apenas loterias ativas
 */
export function getActiveLotteries() {
    return Object.values(LOTTERY_CONFIGS).filter(config => config.active);
}

/**
 * Adiciona nova loteria
 */
export function addLottery(config) {
    LOTTERY_CONFIGS[config.id] = {
        ...config,
        active: config.active !== false
    };
}