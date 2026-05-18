'use client';
import { useAppStore } from '@/lib/store-context';

export default function VendasPage() {
  const { state, custoProducao, deleteVenda } = useAppStore();
  const fmt = (n: number) =>
    n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const vendasOrdenadas = [...state.vendas].sort((a, b) =>
    b.criadaEm.localeCompare(a.criadaEm),
  );

  const handleDelete = (id: string) => {
    if (
      window.confirm(
        'Tem certeza que deseja cancelar esta venda? O estoque dos ingredientes será devolvido automaticamente.',
      )
    ) {
      deleteVenda(id);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6 animate-in">
      <div>
        <h1 className="font-display text-3xl">Histórico de Vendas</h1>
        <p className="text-stone-500 text-sm mt-1">
          {state.vendas.length} venda(s) registrada(s)
        </p>
      </div>

      <div className="space-y-3">
        {vendasOrdenadas.length === 0 ? (
          <div className="card p-12 text-center text-stone-400">
            Nenhuma venda registrada
          </div>
        ) : (
          vendasOrdenadas.map((venda) => {
            const custo = venda.itens.reduce((acc, item) => {
              const p = state.produtos.find((p) => p.id === item.produtoId);
              return acc + (p ? custoProducao(p) * item.quantidade : 0);
            }, 0);
            const lucro = venda.total - custo;
            return (
              <div key={venda.id} className="card p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-mono text-xs text-stone-400">
                      #{venda.id.slice(0, 8)}
                    </p>
                    <p className="text-sm text-stone-500">
                      {new Date(venda.criadaEm).toLocaleString('pt-BR')}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="font-mono font-bold text-lg text-blue-600">
                        {fmt(venda.total)}
                      </p>
                      <p
                        className={`font-mono text-xs ${lucro >= 0 ? 'text-emerald-500' : 'text-red-500'}`}
                      >
                        Lucro: {fmt(lucro)}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDelete(venda.id)}
                      className="p-2 text-red-400 hover:text-red-600 bg-red-50 hover:bg-red-100 dark:bg-red-950/30 dark:hover:bg-red-900/50 rounded-lg transition-colors"
                      title="Cancelar Venda e devolver estoque"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {venda.itens.map((item) => {
                    const p = state.produtos.find(
                      (p) => p.id === item.produtoId,
                    );
                    return (
                      <span
                        key={item.produtoId}
                        className="badge bg-stone-100 dark:bg-neutral-800 text-stone-600 dark:text-stone-400"
                      >
                        {item.quantidade}× {p?.nome ?? 'Produto removido'} —{' '}
                        {fmt(item.precoUnitario * item.quantidade)}
                      </span>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
