# 🧪 Como Testar as APIs Localmente

## ⚠️ Problema Identificado

O erro que você está vendo acontece porque está tentando acessar as APIs serverless da Vercel diretamente no navegador, mas elas precisam do ambiente Vercel para funcionar.

## ✅ Soluções para Testar

### **Opção 1: Usar Vercel Dev (Recomendado)**

```bash
# 1. Instalar Vercel CLI (se não tiver)
npm install -g vercel

# 2. Executar ambiente de desenvolvimento
vercel dev

# 3. Acessar no navegador:
# http://localhost:3000/admin.html
# http://localhost:3000/api/lottery-status
# http://localhost:3000/api/sync-lottery
```

### **Opção 2: Testar Arquivos Diretos**

Abra no navegador: `file:///C:/Users/islan/OneDrive/Documents/GitHub/loterias/test-local.html`

Ou execute o servidor de desenvolvimento normal:
```bash
npm run dev
# Depois acesse: http://localhost:5174/test-local.html
```

### **Opção 3: Deploy na Vercel**

```bash
# Deploy direto na Vercel
vercel --prod

# Depois acesse as URLs de produção:
# https://seu-projeto.vercel.app/admin.html
# https://seu-projeto.vercel.app/api/lottery-status
```

## 🔧 Testando Passo a Passo

### **1. Teste dos Arquivos JSON**
Primeiro, verifique se os dados estão corretos:
```bash
# Abra no navegador
http://localhost:5174/data/lotofacil.json
http://localhost:5174/data/megasena.json
```

### **2. Teste com Vercel Dev**
```bash
# Terminal 1: Vercel Dev
vercel dev

# Terminal 2: Teste manual
curl http://localhost:3000/api/lottery-status
curl -X POST http://localhost:3000/api/sync-lottery
```

### **3. Teste no Navegador**
```bash
# Com Vercel Dev rodando:
http://localhost:3000/admin.html
http://localhost:3000/test-local.html
```

## 📊 O que Cada Teste Deve Mostrar

### **`/api/lottery-status`**
```json
{
  "success": true,
  "timestamp": "2025-12-13T00:42:23.048Z",
  "lotteries": {
    "lotofacil": {
      "success": true,
      "totalDraws": 3560,
      "firstContest": 1,
      "lastContest": 3560
    },
    "megasena": {
      "success": true,
      "totalDraws": 2950,
      "firstContest": 1,
      "lastContest": 2950
    }
  }
}
```

### **`/api/sync-lottery`**
```json
{
  "success": true,
  "duration": "2.34s",
  "results": {
    "lotofacil": {
      "success": true,
      "totalDraws": 3560,
      "newDraws": 0,
      "message": "Já está atualizado"
    },
    "megasena": {
      "success": true,
      "totalDraws": 2950,
      "newDraws": 0,
      "message": "Já está atualizado"
    }
  }
}
```

## 🚀 Deploy na Vercel

Para testar em produção:

```bash
# 1. Login na Vercel
vercel login

# 2. Deploy
vercel --prod

# 3. Configurar domínio (opcional)
vercel domains add seu-dominio.com

# 4. Testar URLs de produção
https://seu-projeto.vercel.app/admin.html
```

## 🔍 Troubleshooting

### **Erro: "Unexpected token"**
- **Causa:** Tentando acessar API sem Vercel Dev
- **Solução:** Use `vercel dev` ou faça deploy

### **Erro: "Cannot find module"**
- **Causa:** Imports ES6 não funcionam localmente
- **Solução:** As APIs foram corrigidas para funcionar na Vercel

### **Erro: "File not found"**
- **Causa:** Arquivos JSON não existem
- **Solução:** Execute `npm run sync` primeiro

### **APIs não respondem**
- **Causa:** Vercel Dev não está rodando
- **Solução:** Execute `vercel dev` em um terminal separado

## 📋 Checklist de Teste

- [ ] Arquivos JSON existem e têm dados
- [ ] `vercel dev` está rodando
- [ ] `/api/lottery-status` retorna JSON válido
- [ ] `/api/sync-lottery` executa sem erro
- [ ] `admin.html` carrega e funciona
- [ ] Cron job está configurado no `vercel.json`

## 🎯 Próximos Passos

1. **Teste local:** Use `vercel dev` para testar
2. **Deploy:** Faça deploy na Vercel para produção
3. **Monitoramento:** Use admin.html para acompanhar
4. **Automação:** Cron job executará diariamente às 06:00 UTC

---

**💡 Dica:** O erro que você viu é normal quando tenta acessar APIs serverless fora do ambiente Vercel. Use `vercel dev` para testar localmente!