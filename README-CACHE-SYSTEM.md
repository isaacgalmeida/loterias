# Sistema de Cache Inteligente para Loterias

## Visão Geral

O sistema foi atualizado para usar um **cache local inteligente** que substitui os arquivos Excel por dados obtidos diretamente das APIs oficiais da Caixa Econômica Federal.

## Características Principais

### ✅ **Substituição Completa dos Arquivos Excel**
- ❌ Não usa mais `Lotofacil.xlsx` e `Mega-Sena.xlsx`
- ✅ Obtém dados diretamente das APIs oficiais da Caixa
- ✅ Cache local em arquivos JSON para performance

### ✅ **APIs Utilizadas**
- **Lotofácil**: `https://servicebus2.caixa.gov.br/portaldeloterias/api/lotofacil`
- **Mega-Sena**: `https://servicebus2.caixa.gov.br/portaldeloterias/api/megasena`

### ✅ **Cache Local Inteligente**
- **Arquivos**: `public/data/lotofacil.json` e `public/data/megasena.json`
- **Estrutura**: Metadados + array de sorteios ordenados
- **Sincronização**: Automática e incremental

### ✅ **Sincronização Incremental**
- **Primeira execução**: Baixa últimos 1000 concursos
- **Execuções seguintes**: Baixa apenas novos resultados
- **Rate limiting**: 5 requisições por lote com delay de 500ms
- **Backup automático**: Mantém 7 backups dos dados

## Arquivos do Sistema

### **Core**
- `src/services/dataManager.js` - Gerenciador principal do cache
- `sync-missing.js` - Script de sincronização inteligente
- `public/data/lotofacil.json` - Cache da Lotofácil (3560 concursos)
- `public/data/megasena.json` - Cache da Mega-Sena (2887 concursos)

### **Logs e Backups**
- `logs/sync.log` - Log das sincronizações
- `backups/` - Backups automáticos dos dados

## Como Usar

### **Sincronização Inteligente**

```bash
# Sincroniza ambas as loterias (apenas concursos faltantes)
npm run sync

# Sincroniza apenas Lotofácil
npm run sync:lotofacil

# Sincroniza apenas Mega-Sena  
npm run sync:megasena

# Mostra ajuda do comando
npm run sync:help
```

### **No Código da Aplicação**

```javascript
import dataManager from './services/dataManager.js';

// Carrega dados com sync automático
const lotofacilData = await dataManager.getLotteryData('lotofacil', true);

// Carrega apenas do cache (sem sync)
const megasenaData = await dataManager.getLotteryData('megasena', false);

// Sincroniza todas as loterias
const { results, errors } = await dataManager.syncAllLotteries();
```

## Estrutura dos Dados

### **Arquivo JSON de Cache**
```json
{
  "metadata": {
    "lastUpdate": "2025-12-13T00:01:05.720Z",
    "totalDraws": 1000,
    "lotteryType": "megasena",
    "version": "1.0"
  },
  "draws": [
    {
      "concurso": 1951,
      "data": "22/07/2017",
      "numeros": [14, 16, 19, 21, 33, 55],
      "acumulado": true,
      "valorEstimadoProximoConcurso": 25000000,
      "dataProximoConcurso": "26/07/2017"
    }
  ]
}
```

### **Transformação de Dados**
- **API → Formato Interno**: Padronização automática
- **Validação**: Números válidos e quantidade correta
- **Ordenação**: Sempre por número do concurso
- **Deduplicação**: Remove concursos duplicados

## Script de Sincronização Inteligente

### **Características do `sync-missing.js`**
- **Análise inteligente**: Detecta automaticamente quais concursos faltam
- **Sincronização seletiva**: Baixa apenas os dados que não existem localmente
- **Suporte específico**: Permite sincronizar loterias individuais
- **Detecção de lacunas**: Identifica e preenche buracos no histórico
- **Relatório detalhado**: Mostra estatísticas completas após sincronização

### **Uso do Script**
```bash
# Sincronizar ambas as loterias
node sync-missing.js

# Sincronizar apenas uma loteria específica
node sync-missing.js lotofacil
node sync-missing.js megasena

# Mostrar ajuda
node sync-missing.js --help
```

### **Estratégia de Sincronização**
1. **Análise local**: Carrega dados do arquivo JSON existente
2. **Consulta API**: Verifica último concurso disponível na API oficial
3. **Identificação de lacunas**: Detecta concursos faltantes (buracos + novos)
4. **Download seletivo**: Baixa apenas os concursos que não existem
5. **Merge inteligente**: Combina dados existentes com novos
6. **Atualização**: Salva arquivo JSON atualizado

## Funcionalidades Avançadas

### **Detecção de Ambiente**
- **Browser**: Usa `fetch()` para carregar cache
- **Node.js**: Usa `fs` para ler/escrever arquivos
- **Compatibilidade**: Funciona em ambos os ambientes

### **Sistema de Backup**
- **Automático**: Backup antes de cada sincronização
- **Rotação**: Mantém apenas os 7 backups mais recentes
- **Recuperação**: Fallback para dados em cache em caso de erro

### **Rate Limiting**
- **Lotes**: 5 requisições por lote
- **Delay**: 500ms entre lotes
- **Retry**: Até 3 tentativas com backoff

### **Logging Completo**
- **Níveis**: INFO, WARN, ERROR, SUCCESS
- **Destinos**: Console + arquivo de log
- **Timestamps**: ISO 8601 com timezone

## Extensibilidade

### **Adicionar Nova Loteria**
```javascript
// Configuração da nova loteria
const quinaConfig = {
    id: 'quina',
    name: 'Quina',
    apiUrl: 'https://servicebus2.caixa.gov.br/portaldeloterias/api/quina',
    numbersCount: 5,
    minNumber: 1,
    maxNumber: 80,
    cacheFile: 'data/quina.json'
};

// Adicionar suporte
dataManager.addLotterySupport(quinaConfig);
```

### **Configurações Personalizadas**
- **Quantidade de concursos**: Modificar limite de 1000
- **Frequência de sync**: Ajustar delay entre lotes
- **Backups**: Configurar quantidade mantida

## Monitoramento

### **Estatísticas do Cache**
```javascript
const stats = dataManager.getAllStats();
console.log(stats);
// {
//   lotofacil: { totalDraws: 995, firstContest: 2561, lastContest: 3560 },
//   megasena: { totalDraws: 1000, firstContest: 1951, lastContest: 2950 }
// }
```

### **Status da Sincronização**
- **Logs**: Acompanhar via `logs/sync.log`
- **Console**: Output detalhado durante execução
- **Errors**: Tratamento graceful com fallback

## Benefícios

### **Performance**
- ✅ **Cache local**: Carregamento instantâneo
- ✅ **Sync incremental**: Apenas novos dados
- ✅ **Rate limiting**: Não sobrecarrega APIs

### **Confiabilidade**
- ✅ **Backup automático**: Proteção contra perda
- ✅ **Fallback**: Funciona mesmo com APIs offline
- ✅ **Validação**: Dados sempre consistentes

### **Manutenibilidade**
- ✅ **Logs detalhados**: Fácil debugging
- ✅ **Arquitetura modular**: Fácil extensão
- ✅ **Configurável**: Adaptável a necessidades

## Migração Completa

### **Antes (Excel)**
```javascript
// Carregava arquivos Excel estáticos
const lotofacilData = await parseExcelFile('Lotofacil.xlsx');
```

### **Depois (API + Cache)**
```javascript
// Carrega do cache com sync automático das APIs
const lotofacilData = await dataManager.getLotteryData('lotofacil');
```

### **Vantagens da Migração**
- 📊 **Dados sempre atualizados** (APIs oficiais)
- 🚀 **Performance superior** (cache local)
- 🔄 **Sync automático** (sem intervenção manual)
- 📈 **Escalabilidade** (fácil adicionar loterias)
- 🛡️ **Confiabilidade** (backup e fallback)

---

## Status Atual

✅ **Sistema implementado e funcionando**
- Cache local criado e populado
- APIs integradas e testadas
- Sync incremental operacional
- Backup automático configurado
- Aplicação principal compatível

**Sistema finalizado e operacional**: 
- ✅ Lotofácil: 3560 concursos completos
- ✅ Mega-Sena: 2887 concursos completos  
- ✅ Sincronização inteligente implementada
- ✅ Script único para manutenção (`sync-missing.js`)