# Sistema de Sincronização Automática das Loterias

Este documento explica como funciona o sistema de sincronização automática que mantém os dados das loterias sempre atualizados.

## 📋 Visão Geral

O sistema funciona da seguinte forma:

1. **Banco de Dados JSON**: Os arquivos `public/data/lotofacil.json` e `public/data/megasena.json` servem como banco de dados principal
2. **Sincronização Automática**: O script `scripts/sync-local.js` executa diariamente para buscar novos concursos
3. **Aplicação**: A aplicação web usa os arquivos JSON como fonte de dados para todas as funcionalidades

## 🗂️ Estrutura dos Arquivos

```
public/data/
├── lotofacil.json    # Banco de dados da Lotofácil
└── megasena.json     # Banco de dados da Mega-Sena

scripts/
├── sync-local.js     # Script de sincronização
└── setup-cron.js    # Configuração de execução automática

api/
├── sync-lottery.js   # API de sincronização (Vercel)
├── get-updated-data.js # API para dados atualizados
└── simple-status.js  # API de status
```

## 🔄 Como Funciona a Sincronização

### 1. Execução Diária Automática

O sistema está configurado para executar automaticamente todos os dias às **06:00** da manhã.

**Windows**: Usa o Agendador de Tarefas
**Linux/Mac**: Usa cron job

### 2. Processo de Sincronização

1. **Verifica último concurso local**: Lê os arquivos JSON para saber qual foi o último concurso salvo
2. **Consulta API da Caixa**: Verifica qual é o último concurso disponível na API oficial
3. **Baixa novos concursos**: Se houver novos concursos, baixa todos os dados
4. **Atualiza arquivos JSON**: Salva os novos dados nos arquivos JSON
5. **Log de atividades**: Registra todas as operações realizadas

### 3. Estrutura dos Dados JSON

```json
{
  "metadata": {
    "lastUpdate": "2025-12-15T10:00:00.000Z",
    "totalDraws": 3560,
    "lotteryType": "lotofacil",
    "version": "1.0",
    "syncSource": "local-script"
  },
  "draws": [
    {
      "concurso": 1,
      "data": "29/09/2003",
      "numeros": [2, 3, 5, 6, 9, 10, 11, 13, 14, 16, 18, 20, 21, 23, 25],
      "acumulado": false,
      "valorEstimadoProximoConcurso": 0,
      "dataProximoConcurso": null
    }
  ]
}
```

## 🚀 Comandos Disponíveis

### Configuração Inicial

```bash
# Instala e configura a execução automática
npm run sync:setup
```

### Execução Manual

```bash
# Executa sincronização manual
npm run sync

# Executa apenas Lotofácil
npm run sync:lotofacil

# Executa apenas Mega-Sena
npm run sync:megasena

# Mostra ajuda
npm run sync:help
```

### Desenvolvimento

```bash
# Inicia servidor de desenvolvimento
npm run dev

# Build para produção
npm run build

# Preview da build
npm run preview
```

## 📊 Como a Aplicação Usa os Dados

### 1. Carregamento de Dados

A aplicação carrega os dados na seguinte ordem de prioridade:

1. **Arquivos JSON locais** (prioridade máxima)
2. **API de dados atualizados** (fallback)
3. **Arquivos Excel** (legado, não usado mais)

### 2. Geração de Jogos

Todas as estratégias de geração de números usam os dados dos arquivos JSON:

- **Análise de frequência**: Calcula quais números saem mais/menos
- **Padrões históricos**: Identifica tendências nos sorteios
- **Estatísticas**: Gera métricas para o dashboard
- **Números quentes/frios**: Baseado no histórico completo

### 3. Dashboard de Estatísticas

O dashboard mostra:

- Total de concursos analisados
- Frequência de cada número
- Distribuição par/ímpar
- Números mais e menos sorteados
- Padrões de distribuição

## 🔧 Configuração do Sistema

### Windows

1. Execute: `npm run sync:setup`
2. O sistema criará uma tarefa agendada automaticamente
3. Verifique no "Agendador de Tarefas" se a tarefa "LoteriasSync" foi criada

### Linux/Mac

1. Execute: `npm run sync:setup`
2. Adicione a linha do cron job mostrada ao seu crontab
3. Execute: `crontab -e` e cole a linha fornecida

### Manual

Se preferir configurar manualmente:

```bash
# Comando para executar diariamente às 06:00
node scripts/sync-local.js
```

## 📝 Logs e Monitoramento

### Logs do Sistema

- **Windows**: Logs aparecem no console durante execução
- **Linux/Mac**: Logs salvos em `/tmp/loterias-sync.log`

### Status da Sincronização

Acesse `/status.html` para ver:

- Status atual de cada loteria
- Último concurso sincronizado
- Data da última atualização
- Total de concursos no banco

### Verificação Manual

```bash
# Verifica se há novos concursos sem baixar
npm run sync -- --check-only

# Mostra estatísticas dos arquivos JSON
npm run sync -- --stats
```

## 🛠️ Solução de Problemas

### Problema: Sincronização não está funcionando

**Solução:**

1. Verifique se a tarefa agendada está ativa
2. Execute manualmente: `npm run sync`
3. Verifique logs de erro

### Problema: Dados não aparecem na aplicação

**Solução:**

1. Verifique se os arquivos JSON existem em `public/data/`
2. Verifique se têm dados válidos
3. Execute: `npm run sync` para recriar os arquivos

### Problema: API da Caixa está fora do ar

**Solução:**

1. O sistema continuará usando os dados locais
2. A sincronização será retomada quando a API voltar
3. Nenhuma ação necessária

## 🔒 Segurança e Backup

### Backup Automático

O sistema mantém backup dos dados:

- Antes de cada atualização, cria backup dos arquivos JSON
- Backups ficam em `public/data/backup/`

### Recuperação de Dados

Se algo der errado:

```bash
# Restaura backup mais recente
npm run sync -- --restore-backup

# Redownload completo (cuidado: demora muito)
npm run sync -- --full-sync
```

## 📈 Performance

### Otimizações Implementadas

- **Sincronização incremental**: Baixa apenas novos concursos
- **Rate limiting**: Delay entre requisições para não sobrecarregar a API
- **Cache local**: Usa arquivos JSON como cache persistente
- **Fallback inteligente**: Múltiplas fontes de dados

### Monitoramento

- Tempo médio de sincronização: 30-60 segundos
- Frequência: 1x por dia (06:00)
- Dados processados: ~10-50 novos concursos por mês

## 🎯 Próximos Passos

### Melhorias Planejadas

1. **Notificações**: Avisar quando há novos concursos
2. **Dashboard de sync**: Interface web para monitorar sincronização
3. **Múltiplas loterias**: Suporte para Quina, Dupla Sena, etc.
4. **API própria**: Criar API própria para servir os dados

### Contribuição

Para contribuir com melhorias:

1. Fork o repositório
2. Crie uma branch para sua feature
3. Implemente e teste
4. Abra um Pull Request

---

**Última atualização**: 15/12/2025
**Versão do sistema**: 1.0
**Compatibilidade**: Windows, Linux, macOS
