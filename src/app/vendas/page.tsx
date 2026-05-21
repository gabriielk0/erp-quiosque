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
              // Priorizar o snapshot do custo unitário
              if (item.custoUnitarioInsumos !== undefined && item.custoUnitarioInsumos !== null) {
                return acc + (Number(item.custoUnitarioInsumos) * item.quantidade);
              }
              // Fallback para vendas antigas
              if (item.produtoId) {
                const p = state.produtos.find((p) => p.id === item.produtoId);
                return acc + (p ? custoProducao(p) * item.quantidade : 0);
              } else if (item.insumoId) {
                const insumo = state.insumos.find((i) => i.id === item.insumoId);
                if (insumo && insumo.quantidadeEmbalagem > 0) {
                  const custoUnit = insumo.custoEmbalagem / insumo.quantidadeEmbalagem;
                  return acc + (custoUnit * item.quantidade);
                }
              }
              return acc;
            }, 0);

            const lucro = venda.total - custo;

            return (
              <div key={venda.id} className="card p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-mono text-xs text-stone-400">
                      #{venda.id}
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

                {/* Itens da Venda */}
                <div className="flex flex-wrap gap-2">
                  {venda.itens.map((item, idx) => {
                    const p = state.produtos.find(
                      (p) => p.id === item.produtoId,
                    );
                    const nome = p?.nome ?? item.nomeCustom ?? 'Item Avulso';
                    const keyStr = item.produtoId ? `p-${item.produtoId}` : (item.insumoId ? `i-${item.insumoId}` : `c-${item.nomeCustom}-${idx}`);

                    return (
                      <span
                        key={keyStr}
                        className="badge bg-stone-100 dark:bg-neutral-800 text-stone-600 dark:text-stone-400 border border-stone-200/50 dark:border-neutral-700/50 flex items-center gap-1.5"
                      >
                        <span className="font-semibold text-stone-800 dark:text-stone-200">{item.quantidade}×</span>
                        <span className="truncate max-w-[150px]">{nome}</span>
                        {item.insumoId && (
                          <span className="text-[9px] bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 px-1 rounded-sm">Insumo</span>
                        )}
                        {!item.produtoId && !item.insumoId && (
                          <span className="text-[9px] bg-stone-200 dark:bg-neutral-700 text-stone-700 dark:text-stone-300 px-1 rounded-sm">Avulso</span>
                        )}
                        <span>—</span>
                        <span className="font-mono text-stone-500">{fmt(item.precoUnitario * item.quantidade)}</span>
                      </span>
                    );
                  })}
                </div>

                {/* Subtotal, Desconto, Taxa e Observações */}
                {(venda.desconto > 0 || venda.taxaAdicional > 0 || venda.observacoes) && (
                  <div className="mt-3 pt-3 border-t border-stone-100 dark:border-neutral-800 flex flex-wrap items-center justify-between gap-3 text-xs text-stone-500">
                    <div className="flex gap-4">
                      {venda.subtotal > 0 && (
                        <span>Subtotal: <strong className="text-stone-700 dark:text-stone-300">{fmt(venda.subtotal)}</strong></span>
                      )}
                      {venda.desconto > 0 && (
                        <span className="text-red-500 font-medium">Desconto: -{fmt(venda.desconto)}</span>
                      )}
                      {venda.taxaAdicional > 0 && (
                        <span className="text-stone-700 dark:text-stone-300 font-medium">Taxa: +{fmt(venda.taxaAdicional)}</span>
                      )}
                    </div>
                    {venda.observacoes && (
                      <span className="italic bg-stone-50 dark:bg-neutral-800/80 px-2 py-1 rounded-md max-w-md truncate text-stone-600 dark:text-stone-400" title={venda.observacoes}>
                        Obs: {venda.observacoes}
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
