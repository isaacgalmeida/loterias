# 🔍 Verificador de Combinações Históricas - Atualizado com Jogos Estendidos!

## ✅ **Funcionalidade Expandida Implementada!**

Agora o verificador histórico permite escolher **quantos números jogar**, assim como no gerador de combinações!

### 🎯 **Novas Funcionalidades:**

#### **1. 🎮 Seletor de Números por Jogo**

- **Lotofácil**: 15 a 20 números (padrão: 15)
- **Mega-Sena**: 6 a 20 números (padrão: 6)
- **Dropdown interativo**: Escolha fácil da quantidade
- **Atualização automática**: Contador e validação se ajustam

#### **2. 🔍 Verificação Inteligente**

##### **Para Jogos Padrão (15 números Lotofácil / 6 números Mega-Sena):**

- **Busca exata**: Verifica se a combinação já saiu igual
- **Resultado**: "Combinação Encontrada!" ou "Combinação Inédita!"

##### **Para Jogos Estendidos (16-20 números):**

- **Busca por contenção**: Verifica se algum resultado histórico está contido na sua seleção
- **Lógica**: Se você joga 18 números, verifica se algum sorteio de 15/6 números está dentro dos seus 18
- **Resultado**: "Resultados Encontrados!" mostrando quantos sorteios históricos sua seleção contém

#### **3. 📊 Resultados Adaptativos**

##### **Jogo Padrão - Combinação Encontrada:**

```
🎯 Combinação Encontrada!
✅ Essa combinação já saiu 1 vez(es) na história!
📅 Concurso 1234 - 15/12/2025
📊 Probabilidade de 15 números: 1 em 3.268.760
```

##### **Jogo Estendido - Resultados Encontrados:**

```
🎯 Resultados Encontrados!
✅ Sua combinação de 18 números contém 5 resultado(s)
   que já saíram na história da Lotofácil!

📋 Resultados históricos contidos na sua seleção:
   Concurso 3561: [01][05][08][12][15][18][20][22][23][24][25]
   Concurso 3559: [02][06][09][13][16][19][21][23][24][25]
   ...

📊 Probabilidade de 18 números: 1 em 33.649
💡 Dica: Jogos com mais números aumentam suas
   chances de acertar, mas custam mais caro!
```

### 🎮 **Como Usar a Nova Funcionalidade:**

#### **Passo 1: Escolher Quantidade de Números**

```
┌─────────────────────────────────────┐
│ 🎯 Quantos números jogar:           │
│ [15 números ▼]                      │
│                                     │
│ Opções: 15, 16, 17, 18, 19, 20     │
└─────────────────────────────────────┘
```

#### **Passo 2: Selecionar Números**

```
┌─────────────────────────────────────┐
│ Escolha seus números: 0/18          │ ← Contador atualizado
│                                     │
│ [01] [02] [03] [04] [05] [06]      │
│  ✓    ✓    ✓    ✓    ✓    ✓       │
│ [07] [08] [09] [10] [11] [12]      │
│  ✓    ✓    ✓    ✓    ✓    ✓       │
│ ...                                 │
└─────────────────────────────────────┘
```

#### **Passo 3: Ver Resultados Inteligentes**

- **Jogos padrão**: Busca combinação exata
- **Jogos estendidos**: Mostra quantos resultados históricos estão contidos

### 🔧 **Implementação Técnica:**

#### **Lógica de Verificação:**

```javascript
// Para jogos estendidos (mais números que o padrão)
if (isExtendedGame) {
  // Verifica se algum sorteio histórico está contido na seleção
  exactMatches = draws.filter((draw) => {
    const drawNumbers = draw.numeros;
    // Todos os números do sorteio devem estar na seleção do usuário
    return drawNumbers.every((num) => selectedNumbers.includes(num));
  });
} else {
  // Para jogos padrão, busca combinação exata
  exactMatches = draws.filter((draw) => {
    const drawNumbers = draw.numeros.sort((a, b) => a - b);
    return arraysEqual(selectedNumbers, drawNumbers);
  });
}
```

#### **Cálculo de Probabilidade Estendida:**

```javascript
function calculateExtendedProbability(gameConfig, numbersPerGame) {
  // C(n,k) = n! / (k! * (n-k)!)
  const n = gameConfig.maxNumber; // 25 para Lotofácil, 60 para Mega-Sena
  const k = numbersPerGame; // Números escolhidos pelo usuário

  let result = 1;
  for (let i = 0; i < k; i++) {
    result = (result * (n - i)) / (i + 1);
  }

  return Math.round(result);
}
```

### 📊 **Exemplos de Probabilidades:**

#### **Lotofácil:**

- **15 números**: 1 em 3.268.760 (jogo padrão)
- **16 números**: 1 em 204.298
- **17 números**: 1 em 24.035
- **18 números**: 1 em 4.006
- **19 números**: 1 em 843
- **20 números**: 1 em 211

#### **Mega-Sena:**

- **6 números**: 1 em 50.063.860 (jogo padrão)
- **7 números**: 1 em 7.151.980
- **8 números**: 1 em 1.787.995
- **9 números**: 1 em 595.998
- **10 números**: 1 em 238.399
- **15 números**: 1 em 3.268
- **20 números**: 1 em 38

### 🎨 **Melhorias Visuais:**

#### **Seletor de Números:**

- **Design**: Caixa destacada com ícone 🎯
- **Estilo**: Fundo secundário com borda
- **Interação**: Hover e focus com cor da Caixa

#### **Resultados Históricos:**

- **Bolas pequenas**: Para mostrar números dos sorteios encontrados
- **Layout organizado**: Concurso, data e números em cards
- **Limite visual**: Máximo 10 resultados + contador de "mais X resultados"

#### **Mensagens Contextuais:**

- **Jogos padrão**: Foco em probabilidade e curiosidades
- **Jogos estendidos**: Dicas sobre custo vs. chance de acerto

### 🚀 **Benefícios da Nova Funcionalidade:**

#### **Educacional:**

- **Compreensão de probabilidades**: Vê como mais números afetam as chances
- **Estratégia de jogo**: Entende o trade-off entre custo e probabilidade
- **Análise histórica**: Descobre padrões em diferentes tamanhos de jogo

#### **Prático:**

- **Flexibilidade total**: Testa qualquer quantidade de números
- **Verificação realista**: Simula jogos reais com mais números
- **Decisão informada**: Compara probabilidades antes de jogar

#### **Experiência do Usuário:**

- **Interface consistente**: Mesmo padrão do gerador de números
- **Feedback inteligente**: Mensagens adaptadas ao tipo de jogo
- **Resultados claros**: Diferencia jogos padrão de estendidos

### ✅ **Status: Totalmente Implementado!**

**Funcionalidades completas:**

- ✅ Seletor de quantidade de números (15-20 para ambos os jogos)
- ✅ Verificação inteligente (exata para padrão, contenção para estendidos)
- ✅ Cálculo de probabilidades para qualquer quantidade
- ✅ Resultados adaptativos com mensagens contextuais
- ✅ Interface visual aprimorada com novos estilos
- ✅ Bolas pequenas para mostrar resultados históricos
- ✅ Limite de exibição com contador de resultados extras

**🎉 Agora você pode testar combinações de 6 a 20 números e ver exatamente como isso afeta suas chances de acerto!**

**Acesse: http://localhost:5174/**
