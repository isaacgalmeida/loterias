# Sincronização Automática na Vercel

## 🚀 Configuração Implementada

### **1. Vercel Cron Jobs**
O sistema está configurado para executar sincronização automática diária usando **Vercel Cron Jobs**.

**Configuração no `vercel.json`:**
```json
{
    "crons": [
        {
            "path": "/api/sync-lottery",
            "schedule": "0 6 * * *"
        }
    ]
}
```

**📅 Horário:** Todos os dias às **06:00 UTC** (03:00 Brasília)

### **2. Serverless Functions**

#### **`/api/sync-lottery`** - Sincronização Principal
- **Método:** GET ou POST
- **Função:** Baixa apenas novos concursos das loterias
- **Timeout:** 5 minutos (300 segundos)
- **Rate Limiting:** 500ms entre requisições para evitar erro 429

#### **`/api/lottery-status`** - Verificação de Status  
- **Método:** GET
- **Função:** Verifica status atual das loterias
- **Retorna:** Quantidade de concursos, último concurso, se está atualizado

### **3. Painel de Administração**
**Arquivo:** `admin.html`
- Interface web para monitorar e controlar sincronização
- Botões para executar sync manual e verificar status
- Logs em tempo real das operações
- Auto-refresh a cada 5 minutos

## 📊 Como Funciona

### **Fluxo de Sincronização Diária:**

1. **06:00 UTC** - Vercel executa automaticamente `/api/sync-lottery`
2. **Verificação** - Para cada loteria (Lotofácil, Mega-Sena):
   - Carrega último concurso do cache local
   - Consulta último concurso disponível na API da Caixa
   - Identifica se há novos concursos
3. **Download** - Se há novos concursos:
   - Baixa apenas os concursos que não existem
   - Aplica delay de 500ms entre requisições
   - Valida e transforma dados
4. **Atualização** - Salva dados atualizados no cache
5. **Log** - Registra resultado da operação

### **Estratégia de Cache:**
- **Desenvolvimento:** Arquivos JSON locais (`public/data/`)
- **Produção:** Pode ser integrado com banco de dados (Vercel KV, PlanetScale, etc.)

## 🔧 URLs Importantes

### **Produção (após deploy):**
- **Sincronização:** `https://seu-dominio.vercel.app/api/sync-lottery`
- **Status:** `https://seu-dominio.vercel.app/api/lottery-status`  
- **Admin:** `https://seu-dominio.vercel.app/admin.html`

### **Desenvolvimento Local:**
```bash
# Instalar Vercel CLI
npm i -g vercel

# Executar localmente
vercel dev

# URLs locais:
# http://localhost:3000/api/sync-lottery
# http://localhost:3000/api/lottery-status
# http://localhost:3000/admin.html
```

## 🛠️ Comandos Úteis

### **Teste Manual da Sincronização:**
```bash
# Via curl
curl -X POST https://seu-dominio.vercel.app/api/sync-lottery

# Via browser
https://seu-dominio.vercel.app/api/sync-lottery
```

### **Verificar Status:**
```bash
curl https://seu-dominio.vercel.app/api/lottery-status
```

### **Deploy na Vercel:**
```bash
# Conectar projeto
vercel

# Deploy
vercel --prod
```

## 📋 Monitoramento

### **Logs da Vercel:**
1. Acesse [vercel.com/dashboard](https://vercel.com/dashboard)
2. Selecione seu projeto
3. Vá em **Functions** → **View Function Logs**
4. Filtre por `/api/sync-lottery`

### **Painel Admin:**
- Acesse `https://seu-dominio.vercel.app/admin.html`
- Monitore status em tempo real
- Execute sincronização manual quando necessário
- Visualize logs de operações

## ⚙️ Configurações Avançadas

### **Alterar Horário da Sincronização:**
Edite o `schedule` no `vercel.json`:
```json
"schedule": "0 6 * * *"    // 06:00 UTC diário
"schedule": "0 */6 * * *"  // A cada 6 horas  
"schedule": "0 6 * * 1-5"  // 06:00 UTC apenas dias úteis
```

### **Adicionar Autenticação:**
Adicione token de segurança na função:
```javascript
const authToken = req.headers.authorization;
if (authToken !== 'Bearer SEU_TOKEN_SECRETO') {
    return res.status(401).json({ error: 'Unauthorized' });
}
```

### **Integrar com Banco de Dados:**
Para produção, substitua o cache JSON por banco:
```javascript
// Exemplo com Vercel KV
import { kv } from '@vercel/kv';

// Salvar dados
await kv.set(`lottery:${lotteryId}`, JSON.stringify(draws));

// Carregar dados  
const draws = await kv.get(`lottery:${lotteryId}`);
```

## 🚨 Troubleshooting

### **Erro 429 (Too Many Requests):**
- Aumentar delay entre requisições
- Reduzir tamanho dos lotes
- Implementar retry com backoff

### **Timeout da Function:**
- Aumentar `maxDuration` no `vercel.json`
- Otimizar código para ser mais rápido
- Processar loterias em paralelo

### **Cron Job não executa:**
- Verificar sintaxe do cron no `vercel.json`
- Confirmar que está no plano Pro da Vercel
- Verificar logs na dashboard da Vercel

## 📈 Próximos Passos

1. **✅ Deploy inicial** - Fazer primeiro deploy na Vercel
2. **✅ Teste manual** - Testar endpoints via admin.html
3. **✅ Monitoramento** - Acompanhar logs por alguns dias
4. **🔄 Otimização** - Ajustar configurações conforme necessário
5. **📊 Banco de dados** - Migrar para solução de banco se necessário

---

## 🎯 Resultado Final

Com essa configuração, o sistema:
- ✅ **Sincroniza automaticamente** todos os dias às 06:00 UTC
- ✅ **Baixa apenas novos concursos** (eficiente)
- ✅ **Evita sobrecarregar APIs** (rate limiting)
- ✅ **Fornece monitoramento** (admin panel + logs)
- ✅ **Permite controle manual** (endpoints + interface)
- ✅ **Escala automaticamente** (serverless)

O sistema está pronto para produção na Vercel! 🚀