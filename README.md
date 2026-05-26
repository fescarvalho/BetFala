# BetFala 🎯 — Gestão de Banca de Apostas Esportivas

Sistema full-stack de gerenciamento de banca de apostas com dashboard inteligente, KPIs em tempo real, gráficos interativos e entrada de dados por voz.

---

## 🚀 Stack

| Camada | Tecnologia |
|---|---|
| Framework | Next.js 16 (App Router) |
| Linguagem | TypeScript |
| Estilização | Tailwind CSS v4 + CSS Variables |
| Backend | Supabase (PostgreSQL + Auth) |
| Gráficos | Recharts |
| Ícones | Lucide React |

---

## ⚙️ Configuração

### 1. Instalar dependências

```bash
npm install
```

### 2. Configurar variáveis de ambiente

Edite o arquivo `.env.local` na raiz do projeto:

```env
NEXT_PUBLIC_SUPABASE_URL=https://dnchcbgpeniqzfiarlbb.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=SUA_ANON_KEY_AQUI
```

> Obtenha a `ANON_KEY` em: **Supabase Dashboard → Project Settings → API → Project API keys → anon / public**

### 3. Executar o banco de dados

No **SQL Editor** do Supabase, execute o script:

```
supabase/migrations/001_apostas.sql
```

Isso cria a tabela `apostas` com todas as políticas RLS.

### 4. Rodar o servidor de desenvolvimento

```bash
npm run dev
```

Acesse: `http://localhost:3000`

---

## 📊 Funcionalidades

### Dashboard
- **4 KPIs**: Lucro Total · Taxa de Acerto · ROI · Quantidade de Apostas
- **Gráfico de Linha**: Evolução acumulada da banca ao longo do tempo
- **Gráfico de Pizza (Donut)**: Distribuição por status (Green / Red / Aberta / Void)
- **Filtros**: Busca full-text + Período (7 dias / Mês / Personalizado)
- **Tabela paginada**: Histórico completo com alteração de status inline e exclusão

### Formulário de Nova Aposta
- Campos: Times · Detalhe · Odd · Stake
- **Entrada por Voz** (Web Speech API com simulação automática para browsers sem suporte)
- Preview de retorno e lucro potencial em tempo real
- Validação de campos com feedback visual

### Autenticação (com Supabase configurado)
- Login e registro com e-mail/senha
- Proteção de rotas via `proxy.ts`
- Row-Level Security: cada usuário vê apenas suas apostas

---

## 🗂️ Estrutura de Pastas

```
src/
├── app/
│   ├── auth/page.tsx       # Tela de login/registro
│   ├── page.tsx            # Dashboard principal
│   ├── layout.tsx          # Root layout
│   └── globals.css         # Design system (variáveis CSS)
├── components/
│   ├── dashboard/
│   │   ├── KpiCards.tsx
│   │   ├── BancaLineChart.tsx
│   │   ├── StatusPieChart.tsx
│   │   ├── Filters.tsx
│   │   └── ApostasTable.tsx
│   ├── forms/
│   │   └── NovaApostaForm.tsx
│   └── layout/
│       ├── Sidebar.tsx
│       └── Header.tsx
├── hooks/
│   ├── useApostas.ts       # CRUD (mock + Supabase)
│   └── useVoiceInput.ts    # Web Speech API
├── lib/
│   ├── supabase/
│   │   ├── client.ts       # Browser client
│   │   └── server.ts       # Server client (SSR)
│   ├── calculations.ts     # KPI e gráficos
│   └── mock-data.ts        # Dados de exemplo
└── types/
    └── aposta.ts           # Tipos TypeScript
```

---

## 🔒 Segurança (Security by Design)

- **RLS habilitado** em todas as tabelas — usuários só acessam seus próprios dados
- **Anon Key** exposta apenas com permissões mínimas (somente leitura via RLS)
- **Autenticação server-side** com `@supabase/ssr` e cookies HttpOnly
- **Validação client-side** no formulário antes de qualquer requisição ao banco

---

## 📝 Modo Demonstração

Se `NEXT_PUBLIC_SUPABASE_ANON_KEY` não estiver configurada, o app roda automaticamente em **modo mock** com 16 apostas de exemplo de futebol (Brasileirão) e basquete (NBA). Nenhuma configuração adicional é necessária para testar o layout e os cálculos.

---

## 🧮 Fórmulas dos KPIs

| KPI | Fórmula |
|---|---|
| Lucro Total | `Σ(stake × (odd−1)) para Green − Σ(stake) para Red` |
| Taxa de Acerto | `Greens ÷ (Greens + Reds) × 100` |
| ROI | `Lucro Total ÷ Total Investido (resolvidas) × 100` |

---

Feito com ⚡ por BetFala
