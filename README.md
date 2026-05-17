# Kiosk ERP

ERP completo para quiosque de alimentação e bebidas.

## Stack
- **Next.js 14** (App Router)
- **TypeScript**
- **Tailwind CSS** (dark mode via classe)
- **Recharts** (gráficos)
- **localStorage** (persistência, sem banco de dados)

## Módulos
- ✅ Dashboard com métricas e gráficos
- ✅ Cadastro de Insumos com cálculo de custo/unidade
- ✅ Cardápio com Ficha Técnica e precificação automática
- ✅ PDV com baixa automática de estoque
- ✅ Histórico de Vendas com lucro por venda
- ✅ Dark / Light mode

## Rodar localmente

```bash
npm install
npm run dev
```

Acesse: http://localhost:3000

## Deploy no Vercel

1. Crie um repositório no GitHub e suba este projeto
2. No [Vercel](https://vercel.com), clique em "Add New Project"
3. Importe o repositório
4. Clique em **Deploy** — sem configurações extras necessárias

> Os dados ficam no `localStorage` do navegador. Para uso em produção com banco de dados, migre para um banco como PlanetScale (MySQL) ou Supabase (Postgres) com Prisma.

## Configuração de margem global

Em `src/hooks/useStore.ts`, a margem padrão de 10% fica na criação de produto (`emptyProduto()` no `page.tsx`) e pode ser alterada produto a produto. Para uma margem global, adicione uma tabela `settings` no estado.
