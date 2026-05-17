'use client';
import { useAppStore } from '@/lib/store-context';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { useMemo } from 'react';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function DashboardPage() {
  const { state, precoFinal, custoProducao } = useAppStore();

  const stats = useMemo(() => {
    let faturamento = 0;
    let custoTotal = 0;
    const porProduto: Record<string, { nome: string; qty: number; receita: number }> = {};
    const porDia: Record<string, { dia: string; receita: number; lucro: number }> = {};

    for (const venda of state.vendas) {
      const dia = venda.criadaEm.slice(0, 10);
      if (!porDia[dia]) porDia[dia] = { dia, receita: 0, lucro: 0 };

      for (const item of venda.itens) {
        const produto = state.produtos.find(p => p.id === item.produtoId);
        if (!produto) continue;
        const custo = custoProducao(produto) * item.quantidade;
        const receita = item.precoUnitario * item.quantidade;
        faturamento += receita;
        custoTotal += custo;
        porDia[dia].receita += receita;
        porDia[dia].lucro += receita - custo;

        if (!porProduto[item.produtoId]) porProduto[item.produtoId] = { nome: produto.nome, qty: 0, receita: 0 };
        porProduto[item.produtoId].qty += item.quantidade;
        porProduto[item.produtoId].receita += receita;
      }
    }

    const lucro = faturamento - custoTotal;
    const top5 = Object.values(porProduto).sort((a, b) => b.qty - a.qty).slice(0, 5);
    const linhas = Object.values(porDia).sort((a, b) => a.dia.localeCompare(b.dia)).slice(-30);

    return { faturamento, custoTotal, lucro, top5, linhas };
  }, [state.vendas]);

  const fmt = (n: number) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const cards = [
    { label: 'Faturamento Total', value: fmt(stats.faturamento), color: 'text-blue-600' },
    { label: 'Custo Operacional', value: fmt(stats.custoTotal), color: 'text-amber-500' },
    { label: 'Lucro Líquido', value: fmt(stats.lucro), color: stats.lucro >= 0 ? 'text-emerald-500' : 'text-red-500' },
    { label: 'Total de Vendas', value: state.vendas.length.toString(), color: 'text-violet-500' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8 animate-in">
      <div>
        <h1 className="font-display text-3xl text-stone-900 dark:text-stone-100">Dashboard</h1>
        <p className="text-stone-500 dark:text-stone-400 text-sm mt-1">Visão geral do negócio</p>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map(c => (
          <div key={c.label} className="card p-5">
            <p className="text-xs text-stone-500 dark:text-stone-400 font-medium mb-1">{c.label}</p>
            <p className={`font-display text-2xl font-semibold ${c.color}`}>{c.value}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Evolução */}
        <div className="card p-5 lg:col-span-2">
          <h2 className="text-sm font-semibold text-stone-700 dark:text-stone-300 mb-4">Receita & Lucro (últimos 30 dias)</h2>
          {stats.linhas.length === 0 ? (
            <EmptyChart />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={stats.linhas}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:[&>line]:stroke-neutral-700" />
                <XAxis dataKey="dia" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v: number) => fmt(v)} />
                <Line type="monotone" dataKey="receita" stroke="#3b82f6" strokeWidth={2} dot={false} name="Receita" />
                <Line type="monotone" dataKey="lucro" stroke="#10b981" strokeWidth={2} dot={false} name="Lucro" />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Top 5 */}
        <div className="card p-5">
          <h2 className="text-sm font-semibold text-stone-700 dark:text-stone-300 mb-4">Top 5 Produtos</h2>
          {stats.top5.length === 0 ? (
            <EmptyChart />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={stats.top5} dataKey="qty" nameKey="nome" cx="50%" cy="50%" outerRadius={80} label={({ nome, percent }) => `${nome} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                  {stats.top5.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Estoque baixo */}
      <div className="card p-5">
        <h2 className="text-sm font-semibold text-stone-700 dark:text-stone-300 mb-3">Atenção ao Estoque</h2>
        {state.insumos.filter(i => i.estoqueAtual <= 0).length === 0 ? (
          <p className="text-stone-400 text-sm">Todos os insumos com estoque positivo ✓</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {state.insumos.filter(i => i.estoqueAtual <= 0).map(i => (
              <span key={i.id} className="badge bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400">
                ⚠️ {i.nome}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function EmptyChart() {
  return (
    <div className="h-[220px] flex items-center justify-center text-stone-400 text-sm">
      Nenhum dado ainda
    </div>
  );
}
