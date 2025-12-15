# 🎨 Sistema de Temas - Análise de Loterias

Este documento explica como funciona o sistema de temas escuro/claro implementado na aplicação.

## 🌟 Visão Geral

O sistema oferece dois temas:

- **🌞 Tema Claro** (padrão) - Interface clara e limpa
- **🌙 Tema Escuro** - Interface escura para uso noturno

## 🎯 Funcionalidades

### ✅ **Alternância Manual**

- Botão no canto superior direito do header
- Ícone muda automaticamente: 🌙 (claro) ↔ ☀️ (escuro)
- Transição suave entre temas

### ✅ **Persistência**

- Tema escolhido é salvo no localStorage
- Mantém preferência entre sessões
- Funciona offline

### ✅ **Responsivo**

- Botão se adapta a diferentes tamanhos de tela
- Funciona em mobile, tablet e desktop
- Suporte a touch e teclado

### ✅ **Acessibilidade**

- Suporte a navegação por teclado (Enter/Espaço)
- Indicadores visuais de foco
- Suporte a modo de alto contraste
- Respeita preferência de movimento reduzido

## 🎨 Paleta de Cores

### **Tema Claro**

```css
--color-text-primary: #1e293b      /* Texto principal */
--color-text-secondary: #475569    /* Texto secundário */
--color-text-muted: #64748b        /* Texto esmaecido */
--color-background: #ffffff        /* Fundo principal */
--color-card-bg: #ffffff           /* Fundo dos cards */
--color-border: #e2e8f0            /* Bordas */
```

### **Tema Escuro**

```css
--color-text-primary: #f1f5f9      /* Texto principal */
--color-text-secondary: #cbd5e1    /* Texto secundário */
--color-text-muted: #94a3b8        /* Texto esmaecido */
--color-background: #0f172a        /* Fundo principal */
--color-card-bg: #1e293b           /* Fundo dos cards */
--color-border: #334155            /* Bordas */
```

## 🔧 Implementação Técnica

### **Estrutura CSS**

```css
/* Variáveis do tema claro (padrão) */
:root {
  --color-text-primary: #1e293b;
  /* ... outras variáveis */
}

/* Variáveis do tema escuro */
[data-theme="dark"] {
  --color-text-primary: #f1f5f9;
  /* ... outras variáveis */
}
```

### **JavaScript**

```javascript
class ThemeManager {
  constructor() {
    this.currentTheme = this.getStoredTheme() || "light";
    this.init();
  }

  toggleTheme() {
    const newTheme = this.currentTheme === "light" ? "dark" : "light";
    this.applyTheme(newTheme);
  }

  applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    this.storeTheme(theme);
  }
}
```

## 🎮 Como Usar

### **Para Usuários**

1. **Alternar tema**: Clique no botão 🌙/☀️ no header
2. **Teclado**: Use Tab para focar + Enter/Espaço para alternar
3. **Automático**: Tema é salvo automaticamente

### **Para Desenvolvedores**

#### **Adicionar suporte a novos componentes:**

```css
/* Componente adaptável a temas */
.meu-componente {
  background: var(--color-card-bg);
  color: var(--color-text-primary);
  border: 1px solid var(--color-border);
}

/* Ajustes específicos para tema escuro */
[data-theme="dark"] .meu-componente {
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
}
```

#### **Usar variáveis CSS:**

```css
/* ✅ Correto - usa variáveis */
.elemento {
  color: var(--color-text-primary);
  background: var(--color-card-bg);
}

/* ❌ Incorreto - cor fixa */
.elemento {
  color: #333;
  background: white;
}
```

## 📱 Suporte a Dispositivos

### **Mobile**

- Botão redimensionado para touch
- Meta theme-color atualizada automaticamente
- Suporte a gestos de toque

### **Desktop**

- Hover effects suaves
- Suporte completo a teclado
- Indicadores visuais de foco

### **Tablet**

- Interface híbrida touch/mouse
- Tamanhos otimizados
- Transições suaves

## 🔍 Detalhes Técnicos

### **Transições**

```css
/* Transição suave para mudança de tema */
* {
  transition: background-color 0.3s ease, border-color 0.3s ease,
    color 0.3s ease;
}
```

### **Persistência**

```javascript
// Salva no localStorage
localStorage.setItem("lottery-theme", theme);

// Recupera na inicialização
const savedTheme = localStorage.getItem("lottery-theme");
```

### **Meta Tags Dinâmicas**

```javascript
// Atualiza cor do tema no mobile
const metaThemeColor = document.querySelector('meta[name="theme-color"]');
metaThemeColor.content = theme === "dark" ? "#0f172a" : "#0066B3";
```

## 🎯 Componentes Suportados

### ✅ **Totalmente Suportados**

- Header e navegação
- Cards e containers
- Botões e formulários
- Dashboard de estatísticas
- Gerador de números
- Resultados e números gerados
- Footer e disclaimers

### ✅ **Elementos Específicos**

- Números da Lotofácil (bolas verdes)
- Números da Mega-Sena (bolas roxas)
- Gráficos e barras de frequência
- Tooltips e modais
- Dropdowns e menus
- Mensagens de status

## 🚀 Performance

### **Otimizações**

- Transições CSS otimizadas
- Variáveis CSS para mudanças instantâneas
- Sem re-renderização desnecessária
- Cache do tema no localStorage

### **Métricas**

- **Tempo de alternância**: < 300ms
- **Tamanho CSS adicional**: ~2KB
- **JavaScript**: ~1KB minificado
- **Impacto na performance**: Mínimo

## 🔧 Personalização

### **Adicionar Nova Cor**

```css
:root {
  --minha-cor-clara: #3b82f6;
}

[data-theme="dark"] {
  --minha-cor-clara: #60a5fa;
}
```

### **Criar Variação de Tema**

```css
[data-theme="high-contrast"] {
  --color-text-primary: #000000;
  --color-background: #ffffff;
  --color-border: #000000;
}
```

### **Adicionar Animação Personalizada**

```css
.meu-elemento {
  transition: all var(--transition);
}

[data-theme="dark"] .meu-elemento {
  transform: scale(1.02);
}
```

## 🐛 Solução de Problemas

### **Tema não persiste**

```javascript
// Verificar se localStorage está disponível
if (typeof Storage !== "undefined") {
  localStorage.setItem("lottery-theme", theme);
}
```

### **Cores não mudam**

```css
/* Verificar se está usando variáveis CSS */
.elemento {
  color: var(--color-text-primary) !important;
}
```

### **Transições muito lentas**

```css
/* Reduzir tempo de transição */
@media (prefers-reduced-motion: reduce) {
  * {
    transition: none !important;
  }
}
```

## 📋 Checklist de Implementação

- [x] Variáveis CSS para ambos os temas
- [x] Botão de alternância no header
- [x] Persistência no localStorage
- [x] Transições suaves
- [x] Suporte a teclado
- [x] Responsividade mobile
- [x] Meta theme-color dinâmica
- [x] Suporte a acessibilidade
- [x] Documentação completa

## 🎉 Próximas Melhorias

### **Planejadas**

- [ ] Tema automático baseado no horário
- [ ] Mais variações de cores
- [ ] Tema de alto contraste
- [ ] Sincronização entre abas
- [ ] Preferências avançadas

### **Ideias Futuras**

- [ ] Temas personalizados
- [ ] Modo daltonismo
- [ ] Tema sazonal
- [ ] Integração com OS theme

---

**Desenvolvido com ❤️ para uma melhor experiência do usuário**

_Última atualização: 15/12/2025_
