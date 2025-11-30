# Estratégias de Geração de Números

Este documento descreve todas as estratégias matemáticas e estatísticas implementadas no sistema de análise de loterias.

## Visão Geral

O sistema oferece 10 estratégias diferentes para geração de números, cada uma baseada em princípios matemáticos e estatísticos válidos. Nenhuma estratégia "prevê" resultados - todas usam análise estatística de dados históricos para gerar combinações coerentes.

---

## 1. 🎯 Mix Inteligente (Recomendado)

**Arquivo:** `src/services/predictionEngine.js` → `generateSmartMixEnhanced()`

**Descrição:** Combina automaticamente as melhores técnicas estatísticas para criar jogos equilibrados.

**Metodologia:**

- 30% números quentes (alta frequência histórica)
- 20% números atrasados (há mais tempo sem sair)
- 20% distribuição balanceada (par/ímpar, baixo/alto)
- 30% aleatório com filtros

**Quando usar:** Estratégia padrão recomendada para uso geral. Oferece o melhor equilíbrio entre análise estatística e aleatoriedade.

**Explicação gerada:** Mostra quantos números quentes e atrasados foram incluídos, distribuição par/ímpar e baixo/alto, soma total comparada com média histórica.

---

## 2. 📊 Baseado em Frequência

**Arquivo:** `src/services/predictionEngine.js` → `generateFrequencyBased()`

**Descrição:** Seleciona números com base em frequência absoluta e relativa dos sorteios históricos.

**Metodologia:**

- Classifica todos os números por frequência de aparição
- Top 30% = números quentes
- 30-70% = números médios
- Bottom 30% = números frios
- Mix: 50% quentes, 30% médios, 20% frios

**Quando usar:** Para jogadores que acreditam que números mais sorteados têm maior probabilidade de sair novamente.

**Explicação gerada:** Identifica quantos números quentes, médios e frios foram incluídos, com distribuição par/ímpar e baixo/alto.

---

## 3. ⚖️ Baseado em Padrões

**Arquivo:** `src/services/predictionEngine.js` → `generatePatternBased()`

**Descrição:** Identifica e replica padrões comuns encontrados no histórico de sorteios.

**Metodologia:**

- Analisa padrões par/ímpar mais frequentes (ex: 8E-7O)
- Identifica o padrão mais comum
- Gera combinação seguindo esse padrão
- Preenche aleatoriamente respeitando o padrão

**Quando usar:** Para seguir tendências estatísticas de distribuição observadas historicamente.

**Explicação gerada:** Mostra o padrão par/ímpar usado, grupos consecutivos se houver, distribuição baixo/alto.

---

## 4. 🎲 Aleatório Puro

**Arquivo:** `src/services/predictionEngine.js` → `generatePureRandom()`

**Descrição:** Geração completamente aleatória sem filtros ou intervenções.

**Metodologia:**

- Seleciona números aleatoriamente do intervalo válido
- Não considera dados históricos
- Garante apenas que não repita números no mesmo jogo
- Todas as combinações têm igual probabilidade

**Quando usar:** Para jogadores que preferem sorte pura sem influência estatística.

**Explicação gerada:** Mostra distribuição natural resultante (pares/ímpares, baixos/altos, soma).

---

## 5. ⚖️ Distribuição Balanceada

**Arquivo:** `src/services/predictionEngine.js` → `generateBalanced()`

**Descrição:** Equilibra o jogo em múltiplas dimensões para evitar extremos improváveis.

**Metodologia:**

- Cria 4 pools: par-baixo, par-alto, ímpar-baixo, ímpar-alto
- Target: 50/50 para pares/ímpares e baixos/altos
- Seleciona iterativamente do pool apropriado para manter equilíbrio
- Evita concentração excessiva em qualquer categoria

**Quando usar:** Para jogos estatisticamente equilibrados que evitam extremos (ex: todos pares, todos baixos).

**Explicação gerada:** Compara distribuição real com ideal, mostra equilíbrio alcançado, soma comparada com média.

---

## 6. 🔗 Co-ocorrência

**Arquivo:** `src/services/predictionEngine.js` → `generateCoOccurrence()`

**Descrição:** Escolhe números que aparecem juntos com frequência no histórico.

**Metodologia:**

- Constrói matriz de co-ocorrência baseada em similaridade de frequência
- Inicia com número quente aleatório
- Seleciona próximos números com base em correlação estatística
- Prioriza números com frequências similares

**Quando usar:** Para explorar padrões de números que tendem a sair juntos.

**Explicação gerada:** Mostra número inicial, correlação estatística, números quentes incluídos, distribuição.

---

## 7. 📈 Geração Ponderada

**Arquivo:** `src/services/predictionEngine.js` → `generateWeightedRandom()`

**Descrição:** Gera números aleatórios com pesos baseados em frequência histórica.

**Metodologia:**

- Cria pool ponderado onde números mais frequentes aparecem mais vezes
- Peso sutil: 1-3x baseado em percentual de frequência
- Mantém aleatoriedade mas com tendência suave
- Remove número selecionado do pool após escolha

**Quando usar:** Para aleatoriedade com leve influência estatística, sem ser determinístico.

**Explicação gerada:** Mostra proporção de números quentes/médios/frios, mantém aleatoriedade com viés sutil.

---

## 8. 🔍 Exclusão de Improváveis

**Arquivo:** `src/services/predictionEngine.js` → `generateFiltered()`

**Descrição:** Filtra automaticamente combinações com características improváveis.

**Metodologia:**

- Gera múltiplas combinações aleatórias (até 100)
- Pontua cada uma baseado em:
  - Sequências longas (penaliza >3 consecutivos)
  - Soma extrema (penaliza ±30% da média)
  - Concentração regional (penaliza >60% em uma região)
  - Desequilíbrio par/ímpar (penaliza <20% ou >80%)
- Retorna combinação com melhor pontuação

**Quando usar:** Para evitar jogos com padrões estatisticamente raros.

**Explicação gerada:** Mostra filtros aplicados, sequências controladas, soma na faixa aceitável, distribuição equilibrada.

---

## 9. 🎯 Varredura de Cobertura

**Arquivo:** `src/services/predictionEngine.js` → `generateCoverage()`

**Descrição:** Ao gerar múltiplos jogos, maximiza diversidade e cobertura de números.

**Metodologia:**

- Rastreia números já usados em jogos anteriores
- Prioriza números não usados (peso 5x)
- Números já usados têm peso 1x
- Maximiza cobertura do espaço de números disponíveis

**Quando usar:** Ideal para gerar múltiplos jogos que cobrem o máximo de números diferentes.

**Explicação gerada:** Indica priorização de números menos usados, distribuição, maximização de diversidade.

---

## 10. 🧮 Filtros Combinatórios

**Arquivo:** `src/services/predictionEngine.js` → `generateCombinatorial()`

**Descrição:** Aplica filtros matemáticos rigorosos durante a geração.

**Metodologia:**

- Limita números consecutivos (máximo 2)
- Controla soma total (75-125% da média histórica)
- Valida cada número antes de adicionar
- Tenta até 100 vezes para gerar combinação válida
- Fallback para aleatório se não conseguir

**Quando usar:** Para jogos com restrições matemáticas específicas e controladas.

**Explicação gerada:** Mostra restrições aplicadas (máx 2 consecutivos), soma controlada, distribuição equilibrada.

---

## Características Comuns

### Proteção contra Duplicatas

- Todas as estratégias verificam se o jogo já foi gerado
- Sistema compara combinações ordenadas para detectar duplicatas
- Limite de tentativas para evitar loops infinitos

### Proteção contra Loops Infinitos

- Todas as funções têm limites de iteração
- Fallback para `fillRemainingSafe()` quando necessário
- Abordagem determinística como último recurso

### Explicações Automáticas

- Cada jogo gerado inclui explicação detalhada
- Mostra estatísticas: par/ímpar, baixo/alto, soma
- Identifica números quentes e frios incluídos
- Explica por que aqueles números foram escolhidos

---

## Dados Históricos Utilizados

Todas as estratégias (exceto Aleatório Puro) usam dados das planilhas Excel:

- `public/Lotofacil.xlsx`
- `public/Mega-Sena.xlsx`

**Estatísticas calculadas:**

- `frequencies`: Frequência de cada número
- `hotNumbers`: Top 10 números mais sorteados
- `overdueNumbers`: Top 10 números mais atrasados
- `evenOddPatterns`: Padrões de distribuição par/ímpar

---

## Princípios Fundamentais

1. **Sem Previsão**: Nenhuma estratégia prevê resultados futuros
2. **Base Estatística**: Todas usam análise de dados históricos reais
3. **Aleatoriedade Mínima**: Mesmo estratégias guiadas mantêm aleatoriedade
4. **Sem Pseudomatemática**: Não usa numerologia, astrologia ou métodos sem base científica
5. **Transparência**: Cada jogo explica sua metodologia
6. **Validação**: Todos os jogos são válidos e únicos

---

## Arquivos Relacionados

- **Engine**: `src/services/predictionEngine.js` - Implementação de todas as estratégias
- **UI**: `src/components/NumberGenerator.js` - Interface de seleção
- **Resultados**: `src/components/ResultsDisplay.js` - Exibição com explicações
- **Estatísticas**: `src/services/statisticsEngine.js` - Cálculo de dados históricos
- **Modelos**: `src/utils/dataModels.js` - Configurações dos jogos

---

## Uso no Código

```javascript
// Gerar múltiplas combinações
const combinations = generateMultipleCombinations(
    strategy,      // Nome da estratégia
    count,         // Quantidade de jogos
    gameConfig,    // Configuração do jogo (Lotofácil/Mega-Sena)
    stats,         // Estatísticas históricas
    options        // Opções adicionais
);

// Cada combinação retorna:
{
    id: 1,
    numbers: [1, 5, 8, 12, 15, ...],
    strategy: 'smart-mix',
    explanation: 'Mix Inteligente: Combinação equilibrada com...'
}
```

---

**Última atualização:** 2025-11-30
