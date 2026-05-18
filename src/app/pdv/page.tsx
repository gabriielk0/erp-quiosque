'use client';
import { useState } from 'react';
import { useAppStore } from '@/lib/store-context';
import type { ItemVenda } from '@/types';

export default function PDVPage() {
  const { state, addVenda, precoFinal } = useAppStore();
  const [carrinho, setCarrinho] = useState<ItemVenda[]>([]);
  const [success, setSuccess] = useState(false);
  const [canal, setCanal] = useState<'salao' | 'ifood'>('salao');
  const [busca, setBusca] = useState('');
  const [categoriaFilter, setCategoriaFilter] = useState<string | null>(null);

  const fmt = (n: number) =>
    n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const categorias = Array.from(
    new Set(
      state.produtos
        .filter((p) => p.ativo && p.categoria)
        .map((p) => p.categoria),
    ),
  );

  const getPreco = (produto: any) => {
    if (
      canal === 'ifood' &&
      produto.precoIfood !== undefined &&
      produto.precoIfood !== null
    ) {
      return Number(produto.precoIfood);
    }
    return precoFinal(produto);
  };

  const produtosAtivos = state.produtos.filter((p) => {
    if (!p.ativo) return false;
    if (canal === 'ifood' && (p as any).disponivelIfood === false) return false;
    if (categoriaFilter && p.categoria !== categoriaFilter) return false;
    if (busca && !p.nome.toLowerCase().includes(busca.toLowerCase()))
      return false;
    return true;
  });

  // Esvazia carrinho ao mudar de canal para evitar preços misturados
  const handleCanalChange = (novoCanal: 'salao' | 'ifood') => {
    if (canal !== novoCanal) {
      setCanal(novoCanal);
      setCarrinho([]);
    }
  };

  const addItem = (produtoId: string) => {
    const produto = state.produtos.find((p) => p.id === produtoId)!;
    const preco = getPreco(produto);
    setCarrinho((c) => {
      const idx = c.findIndex((i) => i.produtoId === produtoId);
      if (idx >= 0)
        return c.map((i, j) =>
          j === idx ? { ...i, quantidade: i.quantidade + 1 } : i,
        );
      return [...c, { produtoId, quantidade: 1, precoUnitario: preco }];
    });
  };

  const removeItem = (produtoId: string) =>
    setCarrinho((c) => c.filter((i) => i.produtoId !== produtoId));
  const changeQty = (produtoId: string, qty: number) => {
    if (qty <= 0) return removeItem(produtoId);
    setCarrinho((c) =>
      c.map((i) => (i.produtoId === produtoId ? { ...i, quantidade: qty } : i)),
    );
  };

  const total = carrinho.reduce(
    (acc, i) => acc + i.precoUnitario * i.quantidade,
    0,
  );

  const finalizarVenda = () => {
    if (carrinho.length === 0) return;
    addVenda({ itens: carrinho, total, canal });
    setCarrinho([]);
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 animate-in">
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl">Ponto de Venda</h1>
          <p className="text-stone-500 text-sm mt-1">
            Selecione os itens para registrar a venda
          </p>
        </div>

        <div className="flex bg-stone-100 dark:bg-neutral-800 p-1 rounded-xl w-full md:w-auto">
          {(['salao', 'ifood'] as const).map((c) => (
            <button
              key={c}
              onClick={() => handleCanalChange(c)}
              className={`flex-1 md:w-32 py-2 text-sm font-medium rounded-lg capitalize transition-colors ${canal === c ? 'bg-white dark:bg-neutral-700 shadow-sm text-stone-900 dark:text-stone-100' : 'text-stone-500 hover:text-stone-700 dark:hover:text-stone-300'}`}
            >
              {c === 'salao' ? 'Salão' : 'iFood'}
            </button>
          ))}
        </div>
      </div>

      {success && (
        <div className="mb-4 bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 rounded-xl px-4 py-3 text-sm font-medium animate-in">
          ✓ Venda registrada com sucesso! Estoque atualizado.
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Produtos */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              placeholder="Buscar produto..."
              className="input flex-1"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
            <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0 hide-scrollbar">
              <button
                onClick={() => setCategoriaFilter(null)}
                className={`shrink-0 px-4 py-2 rounded-xl text-sm font-medium border transition-colors ${!categoriaFilter ? 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/30 dark:border-blue-800 dark:text-blue-300' : 'bg-white border-stone-200 text-stone-600 hover:bg-stone-50 dark:bg-neutral-900 dark:border-neutral-800 dark:text-stone-400'}`}
              >
                Todos
              </button>
              {categorias.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategoriaFilter(cat)}
                  className={`shrink-0 px-4 py-2 rounded-xl text-sm font-medium border transition-colors ${categoriaFilter === cat ? 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/30 dark:border-blue-800 dark:text-blue-300' : 'bg-white border-stone-200 text-stone-600 hover:bg-stone-50 dark:bg-neutral-900 dark:border-neutral-800 dark:text-stone-400'}`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {produtosAtivos.length === 0 ? (
            <div className="card p-12 text-center text-stone-400">
              Nenhum produto encontrado
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-3">
              {produtosAtivos.map((p) => {
                const preco = getPreco(p);
                const noCarrinho = carrinho.find((c) => c.produtoId === p.id);
                return (
                  <button
                    key={p.id}
                    onClick={() => addItem(p.id)}
                    className={`card p-4 text-left hover:border-blue-400 dark:hover:border-blue-600 hover:shadow-md transition-all active:scale-98 ${noCarrinho ? 'border-blue-400 dark:border-blue-600 bg-blue-50/50 dark:bg-blue-950/50' : ''}`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="badge bg-stone-100 dark:bg-neutral-800 text-stone-500 text-xs mb-1">
                          {p.categoria || '—'}
                        </span>
                        <p className="font-semibold text-stone-900 dark:text-stone-100">
                          {p.nome}
                        </p>
                      </div>
                      <span className="font-mono font-bold text-blue-600 dark:text-blue-400 text-sm">
                        {fmt(preco)}
                      </span>
                    </div>
                    {noCarrinho && (
                      <div className="mt-2 text-xs text-blue-600 dark:text-blue-400 font-medium">
                        No carrinho: {noCarrinho.quantidade}x
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Carrinho */}
        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-stone-600 dark:text-stone-400 uppercase tracking-wider">
            Carrinho
          </h2>
          <div className="card p-4 space-y-3">
            {carrinho.length === 0 ? (
              <p className="text-stone-400 text-sm text-center py-8">
                Selecione itens ao lado
              </p>
            ) : (
              <>
                {carrinho.map((item) => {
                  const p = state.produtos.find((p) => p.id === item.produtoId);
                  return (
                    <div
                      key={item.produtoId}
                      className="flex items-center gap-2 text-sm"
                    >
                      <button
                        onClick={() => removeItem(item.produtoId)}
                        className="text-red-400 hover:text-red-600 shrink-0"
                      >
                        ✕
                      </button>
                      <span className="flex-1 font-medium truncate">
                        {p?.nome}
                      </span>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() =>
                            changeQty(item.produtoId, item.quantidade - 1)
                          }
                          className="w-6 h-6 rounded-lg bg-stone-100 dark:bg-neutral-800 flex items-center justify-center hover:bg-stone-200"
                        >
                          −
                        </button>
                        <span className="w-6 text-center font-mono">
                          {item.quantidade}
                        </span>
                        <button
                          onClick={() =>
                            changeQty(item.produtoId, item.quantidade + 1)
                          }
                          className="w-6 h-6 rounded-lg bg-stone-100 dark:bg-neutral-800 flex items-center justify-center hover:bg-stone-200"
                        >
                          +
                        </button>
                      </div>
                      <span className="font-mono text-stone-700 dark:text-stone-300 shrink-0 w-20 text-right">
                        {fmt(item.precoUnitario * item.quantidade)}
                      </span>
                    </div>
                  );
                })}
                <div className="border-t border-stone-200 dark:border-neutral-700 pt-3 mt-3 flex justify-between items-center">
                  <span className="font-semibold">Total</span>
                  <span className="font-mono font-bold text-lg text-emerald-600">
                    {fmt(total)}
                  </span>
                </div>
              </>
            )}
          </div>
          <button
            onClick={finalizarVenda}
            disabled={carrinho.length === 0}
            className="w-full btn-primary py-3 text-base disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Finalizar Venda
          </button>
          {carrinho.length > 0 && (
            <button
              onClick={() => setCarrinho([])}
              className="w-full btn-ghost text-sm"
            >
              Limpar Carrinho
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
