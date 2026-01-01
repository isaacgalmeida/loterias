# Links para Apostas Ganhadoras

## Visão Geral

Foi adicionado um novo card na seção "Últimos Resultados" que contém links diretos para visualizar onde foram feitas as apostas ganhadoras de cada modalidade de loteria.

## Implementação

### Localização dos Arquivos Modificados

- **`src/main.js`** - Função `renderLatestResults()` modificada
- **`src/styles/main.css`** - Novos estilos CSS adicionados

### Como Funciona

1. **Geração Dinâmica**: Os links são gerados automaticamente usando o número do último concurso disponível nos dados
2. **Formato do URL**: `https://loterias.caixa.gov.br/Paginas/Locais-Sorte.aspx?modalidade=[MODALIDADE]&concurso=[NUMERO]&titulo=[TITULO]`
3. **Parâmetros**:
   - `modalidade`: `LOTOFACIL` ou `MEGA_SENA`
   - `concurso`: Número do último concurso (ex: 3349, 2954)
   - `titulo`: Nome da modalidade URL-encoded (ex: `Lotof%C3%A1cil`, `Mega-Sena`)

### Estrutura do Novo Card

```html
<div class="latest-result-card winning-bets-card">
  <div class="result-header">
    <span class="result-icon">🏆</span>
    <div class="result-info">
      <h3>Apostas Ganhadoras</h3>
      <p>Veja onde foram feitas as apostas vencedoras</p>
    </div>
  </div>
  <div class="winning-bets-links">
    <!-- Links dinâmicos para cada modalidade -->
  </div>
</div>
```

### Estilos CSS

- **`.winning-bets-card`**: Card principal com gradiente dourado
- **`.winning-bet-link`**: Links individuais com hover effects
- **Responsividade**: Adaptação para dispositivos móveis
- **Tema escuro**: Suporte completo ao tema dark

### Características

- ✅ **Links externos seguros**: `target="_blank"` e `rel="noopener noreferrer"`
- ✅ **Geração automática**: Usa dados dos últimos concursos
- ✅ **Design consistente**: Segue o padrão visual do sistema
- ✅ **Responsivo**: Funciona em todos os dispositivos
- ✅ **Acessível**: Ícones e textos descritivos

### Exemplo de URLs Gerados

- **Lotofácil**: `https://loterias.caixa.gov.br/Paginas/Locais-Sorte.aspx?modalidade=LOTOFACIL&concurso=3349&titulo=Lotof%C3%A1cil`
- **Mega-Sena**: `https://loterias.caixa.gov.br/Paginas/Locais-Sorte.aspx?modalidade=MEGA_SENA&concurso=2954&titulo=Mega-Sena`

### Observações Importantes

- **URL Encoding**: O título "Lotofácil" é codificado como "Lotof%C3%A1cil" para compatibilidade com URLs
- **Parâmetros Corretos**:
  - Lotofácil: `modalidade=LOTOFACIL`, `titulo=Lotof%C3%A1cil`
  - Mega-Sena: `modalidade=MEGA_SENA`, `titulo=Mega-Sena`

### Dados Utilizados

Os números dos concursos são extraídos automaticamente dos arquivos:

- `public/data/lotofacil.json` - Último concurso: 3349+
- `public/data/megasena.json` - Último concurso: 2954+

### Teste

Um arquivo de teste foi criado em `test-winning-bets.html` para verificar o funcionamento dos links e estilos.

## Manutenção

O sistema é totalmente automático. Quando novos concursos são adicionados aos arquivos JSON, os links são atualizados automaticamente para refletir os números mais recentes.

---

**Data de Implementação**: Janeiro 2025  
**Versão**: 1.0  
**Status**: ✅ Implementado e Testado
