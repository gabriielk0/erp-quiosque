'use client';
import { useState, useEffect } from 'react';
import { useAppStore } from '@/lib/store-context';
import type { ItemVenda, Produto } from '@/types';

export default function PDVPage() {
  const { state, addVenda, precoFinal } = useAppStore();
  const [carrinho, setCarrinho] = useState<ItemVenda[]>([]);
  const [ifoodConfig, setIfoodConfig] = useState({
    imposto: 6.00,
    comissaoApp: 12.00,
    taxaCartao: 4.50,
    recebidosLoja: 0.00,
    custoEntrega: 9.58,
    ticketMedio: 36.00,
  });

  useEffect(() => {
    const stored = localStorage.getItem('ifoodConfig');
    if (stored) {
      try {
        setIfoodConfig(JSON.parse(stored));
      } catch (e) {
        console.error('Error loading ifoodConfig:', e);
      }
    }
  }, []);
  const [success, setSuccess] = useState(false);
  const [canal, setCanal] = useState<'salao' | 'ifood'>('salao');
  const [busca, setBusca] = useState('');
  const [categoriaFilter, setCategoriaFilter] = useState<string | null>(null);

  // Novos estados para taxas, descontos e observações
  const [desconto, setDesconto] = useState<number>(0);
  const [taxaAdicional, setTaxaAdicional] = useState<number>(0);
  const [observacoes, setObservacoes] = useState<string>('');

  // Estados para o formulário de item avulso / insumo direto
  const [showAvulsoForm, setShowAvulsoForm] = useState(false);
  const [avulsoTipo, setAvulsoTipo] = useState<'custom' | 'insumo'>('custom');
  const [avulsoNome, setAvulsoNome] = useState('');
  const [avulsoInsumoId, setAvulsoInsumoId] = useState('');
  const [avulsoPreco, setAvulsoPreco] = useState<number | ''>('');
  const [avulsoQtd, setAvulsoQtd] = useState<number>(1);

  const fmt = (n: number) =>
    n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const categorias = state.categorias;

  const getPreco = (produto: Produto) => {
    if (canal === 'ifood') {
      if (produto.ifoodPrice !== undefined && produto.ifoodPrice !== null) {
        return Number(produto.ifoodPrice);
      }
      
      const impostoItem = produto.ifoodTax !== undefined && produto.ifoodTax !== null ? produto.ifoodTax : ifoodConfig.imposto;
      const comissaoAppItem = produto.ifoodAppCommission !== undefined && produto.ifoodAppCommission !== null ? produto.ifoodAppCommission : ifoodConfig.comissaoApp;
      const taxaCartaoItem = produto.ifoodCardFee !== undefined && produto.ifoodCardFee !== null ? produto.ifoodCardFee : ifoodConfig.taxaCartao;
      const custoEntregaItem = produto.ifoodFixedDelivery !== undefined && produto.ifoodFixedDelivery !== null ? produto.ifoodFixedDelivery : ifoodConfig.custoEntrega;

      const D_rate = (impostoItem + comissaoAppItem + taxaCartaoItem + ifoodConfig.recebidosLoja) / 100;
      const divisor = Math.max(0.1, 1 - D_rate);
      const precoSugeridoIfood = (precoFinal(produto) + custoEntregaItem) / divisor;
      return precoSugeridoIfood;
    }
    return precoFinal(produto);
  };

  const produtosAtivos = state.produtos.filter((p) => {
    if (!p.ativo) return false;
    if (canal === 'ifood' && !p.isIfoodEnabled) return false;
    if (categoriaFilter && p.categoriaId !== categoriaFilter) return false;
    if (busca && !p.nome.toLowerCase().includes(busca.toLowerCase()))
      return false;
    return true;
  });

  // Esvazia carrinho ao mudar de canal para evitar preços misturados
  const handleCanalChange = (novoCanal: 'salao' | 'ifood') => {
    if (canal !== novoCanal) {
      setCanal(novoCanal);
      setCarrinho([]);
      setDesconto(0);
      setTaxaAdicional(0);
      setObservacoes('');
    }
  };

  const addItemToCart = (itemToAdd: Omit<ItemVenda, 'quantidade'> & { quantidade?: number }) => {
    setCarrinho((c) => {
      const idx = c.findIndex((i) => {
        if (itemToAdd.produtoId && i.produtoId === itemToAdd.produtoId) return true;
        if (itemToAdd.insumoId && i.insumoId === itemToAdd.insumoId) return true;
        if (itemToAdd.nomeCustom && !itemToAdd.insumoId && i.nomeCustom === itemToAdd.nomeCustom && !i.insumoId) return true;
        return false;
      });
      const qtyToAdd = itemToAdd.quantidade ?? 1;
      if (idx >= 0) {
        return c.map((i, j) =>
          j === idx ? { ...i, quantidade: i.quantidade + qtyToAdd } : i,
        );
      }
      return [...c, { ...itemToAdd, quantidade: qtyToAdd } as ItemVenda];
    });
  };

  const addItem = (produtoId: string) => {
    const produto = state.produtos.find((p) => p.id === produtoId)!;
    const preco = getPreco(produto);
    addItemToCart({ produtoId, precoUnitario: preco });
  };

  const removeItem = (itemToRemove: ItemVenda) => {
    setCarrinho((c) =>
      c.filter(
        (i) =>
          !(
            (itemToRemove.produtoId && i.produtoId === itemToRemove.produtoId) ||
            (itemToRemove.insumoId && i.insumoId === itemToRemove.insumoId) ||
            (itemToRemove.nomeCustom && !itemToRemove.insumoId && i.nomeCustom === itemToRemove.nomeCustom && !i.insumoId)
          ),
      ),
    );
  };

  const changeQty = (itemToUpdate: ItemVenda, qty: number) => {
    if (qty <= 0) return removeItem(itemToUpdate);
    setCarrinho((c) =>
      c.map((i) => {
        const isMatch =
          (itemToUpdate.produtoId && i.produtoId === itemToUpdate.produtoId) ||
          (itemToUpdate.insumoId && i.insumoId === itemToUpdate.insumoId) ||
          (itemToUpdate.nomeCustom && !itemToUpdate.insumoId && i.nomeCustom === itemToUpdate.nomeCustom && !i.insumoId);
        return isMatch ? { ...i, quantidade: qty } : i;
      }),
    );
  };

  const handleAddAvulso = (e: React.FormEvent) => {
    e.preventDefault();
    if (avulsoTipo === 'custom') {
      if (!avulsoNome.trim() || avulsoPreco === '') return;
      addItemToCart({
        nomeCustom: avulsoNome.trim(),
        precoUnitario: Number(avulsoPreco),
        quantidade: avulsoQtd,
      });
    } else {
      if (!avulsoInsumoId || avulsoPreco === '') return;
      const insumo = state.insumos.find((i) => i.id === avulsoInsumoId);
      if (!insumo) return;
      addItemToCart({
        insumoId: avulsoInsumoId,
        nomeCustom: insumo.nome,
        precoUnitario: Number(avulsoPreco),
        quantidade: avulsoQtd,
      });
    }
    // Limpar form
    setAvulsoNome('');
    setAvulsoInsumoId('');
    setAvulsoPreco('');
    setAvulsoQtd(1);
    setShowAvulsoForm(false);
  };

  const subtotal = carrinho.reduce(
    (acc, i) => acc + i.precoUnitario * i.quantidade,
    0,
  );
  const total = Math.max(0, subtotal - desconto + taxaAdicional);

  const finalizarVenda = () => {
    if (carrinho.length === 0) return;
    addVenda({
      itens: carrinho,
      subtotal,
      desconto,
      taxaAdicional,
      total,
      observacoes,
      canal,
    });
    setCarrinho([]);
    setDesconto(0);
    setTaxaAdicional(0);
    setObservacoes('');
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
                  key={cat.id}
                  onClick={() => setCategoriaFilter(cat.id)}
                  className={`shrink-0 px-4 py-2 rounded-xl text-sm font-medium border transition-colors ${categoriaFilter === cat.id ? 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/30 dark:border-blue-800 dark:text-blue-300' : 'bg-white border-stone-200 text-stone-600 hover:bg-stone-50 dark:bg-neutral-900 dark:border-neutral-800 dark:text-stone-400'}`}
                >
                  {cat.nome}
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
                          {p.categoria?.nome || '—'}
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
            {/* Header / Botão de item avulso */}
            <div className="flex justify-between items-center pb-2 border-b border-stone-100 dark:border-neutral-800">
              <span className="text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider">Itens</span>
              <button
                onClick={() => setShowAvulsoForm(!showAvulsoForm)}
                className="text-xs font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 flex items-center gap-1 transition-colors"
              >
                {showAvulsoForm ? 'Cancelar' : '+ Adicionar Avulso / Insumo'}
              </button>
            </div>

            {/* Form de item avulso */}
            {showAvulsoForm && (
              <form onSubmit={handleAddAvulso} className="bg-stone-50 dark:bg-neutral-800/50 p-3 rounded-xl border border-stone-100 dark:border-neutral-800 space-y-2 animate-in">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => { setAvulsoTipo('custom'); setAvulsoNome(''); }}
                    className={`flex-1 py-1 px-2 text-xs font-medium rounded-md transition-colors ${avulsoTipo === 'custom' ? 'bg-blue-600 text-white' : 'bg-stone-200 dark:bg-neutral-800 text-stone-600 dark:text-stone-400 hover:bg-stone-300'}`}
                  >
                    Avulso
                  </button>
                  <button
                    type="button"
                    onClick={() => { setAvulsoTipo('insumo'); setAvulsoInsumoId(''); }}
                    className={`flex-1 py-1 px-2 text-xs font-medium rounded-md transition-colors ${avulsoTipo === 'insumo' ? 'bg-blue-600 text-white' : 'bg-stone-200 dark:bg-neutral-800 text-stone-600 dark:text-stone-400 hover:bg-stone-300'}`}
                  >
                    Insumo
                  </button>
                </div>

                {avulsoTipo === 'custom' ? (
                  <div>
                    <label className="label">Nome do Item</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Embalagem extra, taxa..."
                      value={avulsoNome}
                      onChange={(e) => setAvulsoNome(e.target.value)}
                      className="input py-1.5 text-xs"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="label">Insumo</label>
                    <select
                      required
                      value={avulsoInsumoId}
                      onChange={(e) => {
                        const val = e.target.value;
                        setAvulsoInsumoId(val);
                        const ins = state.insumos.find(i => i.id === val);
                        if (ins) {
                          setAvulsoNome(ins.nome);
                          const unitCost = ins.quantidadeEmbalagem > 0 
                            ? Number((ins.custoEmbalagem / ins.quantidadeEmbalagem).toFixed(2)) 
                            : 0;
                          setAvulsoPreco(unitCost);
                        }
                      }}
                      className="input py-1.5 text-xs"
                    >
                      <option value="">Selecione um insumo...</option>
                      {[...state.insumos]
                        .sort((a, b) => a.nome.localeCompare(b.nome))
                        .map((ins) => (
                          <option key={ins.id} value={ins.id}>
                            {ins.nome} - Est. {ins.estoqueAtual} {ins.unidadeMedida}
                          </option>
                        ))}
                    </select>
                    {avulsoInsumoId && (
                      <span className="text-[10px] text-stone-500 mt-0.5 block">
                        Custo unitário: {fmt(
                          (state.insumos.find(i => i.id === avulsoInsumoId)?.custoEmbalagem ?? 0) /
                          (state.insumos.find(i => i.id === avulsoInsumoId)?.quantidadeEmbalagem || 1)
                        )}
                      </span>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="label">Preço Venda (R$)</label>
                    <input
                      type="number"
                      required
                      step="0.01"
                      min="0"
                      placeholder="0,00"
                      value={avulsoPreco}
                      onChange={(e) => setAvulsoPreco(e.target.value !== '' ? Number(e.target.value) : '')}
                      className="input py-1.5 text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="label">Quantidade</label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={avulsoQtd}
                      onChange={(e) => setAvulsoQtd(Number(e.target.value))}
                      className="input py-1.5 text-xs font-mono"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full btn-primary py-1.5 text-xs mt-1"
                >
                  Adicionar ao Carrinho
                </button>
              </form>
            )}

            {carrinho.length === 0 ? (
              <p className="text-stone-400 text-sm text-center py-8">
                Selecione itens ao lado ou adicione um avulso
              </p>
            ) : (
              <>
                <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                  {carrinho.map((item, idx) => {
                    const p = state.produtos.find((p) => p.id === item.produtoId);
                    const nome = p?.nome ?? item.nomeCustom ?? 'Item Avulso';
                    const keyStr = item.produtoId ? `p-${item.produtoId}` : (item.insumoId ? `i-${item.insumoId}` : `c-${item.nomeCustom}-${idx}`);

                    return (
                      <div
                        key={keyStr}
                        className="flex items-center gap-2 text-sm"
                      >
                        <button
                          onClick={() => removeItem(item)}
                          className="text-red-400 hover:text-red-600 shrink-0 transition-colors"
                        >
                          ✕
                        </button>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
                            {nome}
                            {item.insumoId && (
                              <span className="badge bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 border border-purple-100 dark:border-purple-900 text-[10px] py-0 px-1.5 font-normal font-sans">
                                Insumo
                              </span>
                            )}
                            {!item.produtoId && !item.insumoId && (
                              <span className="badge bg-stone-100 dark:bg-neutral-800 text-stone-600 dark:text-stone-400 border border-stone-200 dark:border-neutral-700 text-[10px] py-0 px-1.5 font-normal font-sans">
                                Avulso
                              </span>
                            )}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() =>
                              changeQty(item, item.quantidade - 1)
                            }
                            className="w-6 h-6 rounded-lg bg-stone-100 dark:bg-neutral-800 flex items-center justify-center hover:bg-stone-200 dark:hover:bg-neutral-700 transition-colors text-stone-600 dark:text-stone-400"
                          >
                            −
                          </button>
                          <span className="w-6 text-center font-mono font-medium text-stone-800 dark:text-stone-200">
                            {item.quantidade}
                          </span>
                          <button
                            onClick={() =>
                              changeQty(item, item.quantidade + 1)
                            }
                            className="w-6 h-6 rounded-lg bg-stone-100 dark:bg-neutral-800 flex items-center justify-center hover:bg-stone-200 dark:hover:bg-neutral-700 transition-colors text-stone-600 dark:text-stone-400"
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
                </div>

                {/* Subtotal, Descontos, Taxas e Observações */}
                <div className="border-t border-stone-200 dark:border-neutral-700 pt-3 mt-3 space-y-3">
                  {/* Inputs rápidos */}
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div>
                      <label className="label">Desconto (R$)</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0,00"
                        value={desconto || ''}
                        onChange={(e) => setDesconto(Math.max(0, Number(e.target.value)))}
                        className="input py-1.5 text-xs font-mono"
                      />
                    </div>
                    <div>
                      <label className="label">Taxa Extra / Entrega</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0,00"
                        value={taxaAdicional || ''}
                        onChange={(e) => setTaxaAdicional(Math.max(0, Number(e.target.value)))}
                        className="input py-1.5 text-xs font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="label">Observações da Venda</label>
                    <textarea
                      placeholder="Ex: Entregar na mesa 5, sem cebola, etc."
                      value={observacoes}
                      onChange={(e) => setObservacoes(e.target.value)}
                      className="input py-1.5 text-xs h-12 resize-none"
                    />
                  </div>

                  {/* Resumo financeiro */}
                  <div className="space-y-1.5 pt-2 border-t border-stone-100 dark:border-neutral-800 text-xs">
                    <div className="flex justify-between text-stone-500 dark:text-stone-400">
                      <span>Subtotal</span>
                      <span className="font-mono">{fmt(subtotal)}</span>
                    </div>
                    {desconto > 0 && (
                      <div className="flex justify-between text-red-600 dark:text-red-400">
                        <span>Desconto</span>
                        <span className="font-mono">-{fmt(desconto)}</span>
                      </div>
                    )}
                    {taxaAdicional > 0 && (
                      <div className="flex justify-between text-stone-600 dark:text-stone-300 font-medium">
                        <span>Taxa Adicional</span>
                        <span className="font-mono">+{fmt(taxaAdicional)}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center text-sm font-semibold pt-1 border-t border-stone-100 dark:border-neutral-800/80">
                      <span className="text-stone-900 dark:text-stone-100 text-sm">Total</span>
                      <span className="font-mono font-bold text-base text-emerald-600 dark:text-emerald-400">
                        {fmt(total)}
                      </span>
                    </div>
                  </div>
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
              onClick={() => {
                setCarrinho([]);
                setDesconto(0);
                setTaxaAdicional(0);
                setObservacoes('');
              }}
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
