'use client';
import { useAppStore } from '@/lib/store-context';

export default function VendasPage() {
  const { state, custoProducao } = useAppStore();
  const fmt = (n: number) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const vendasOrdenadas = [...state.vendas].sort((a, b) => b.criadaEm.localeCompare(a.criadaEm));

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6 animate-in">
      <div>
        <h1 className="font-display text-3xl">Histórico de Vendas</h1>
        <p className="text-stone-500 text-sm mt-1">{state.vendas.length} venda(s) registrada(s)</p>
      </div>

      <div className="space-y-3">
        {vendasOrdenadas.length === 0 ? (
          <div className="card p-12 text-center text-stone-400">Nenhuma venda registrada</div>
        ) : vendasOrdenadas.map(venda => {
          const custo = venda.itens.reduce((acc, item) => {
            const p = state.produtos.find(p => p.id === item.produtoId);
            return acc + (p ? custoProducao(p) * item.quantidade : 0);
          }, 0);
          const lucro = venda.total - custo;
          return (
            <div key={venda.id} className="card p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-mono text-xs text-stone-400">#{venda.id.slice(0, 8)}</p>
                  <p className="text-sm text-stone-500">{new Date(venda.criadaEm).toLocaleString('pt-BR')}</p>
                </div>
                <div className="text-right">
                  <p className="font-mono font-bold text-lg text-blue-600">{fmt(venda.total)}</p>
                  <p className={`font-mono text-xs ${lucro >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                    Lucro: {fmt(lucro)}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {venda.itens.map(item => {
                  const p = state.produtos.find(p => p.id === item.produtoId);
                  return (
                    <span key={item.produtoId} className="badge bg-stone-100 dark:bg-neutral-800 text-stone-600 dark:text-stone-400">
                      {item.quantidade}× {p?.nome ?? 'Produto removido'} — {fmt(item.precoUnitario * item.quantidade)}
                    </span>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
