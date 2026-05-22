'use client';
export const dynamic = 'force-dynamic';
import { useState, useEffect } from 'react';
import { useAppStore } from '@/lib/store-context';
import type { Produto } from '@/types';

const emptyProduto = (): Omit<Produto, 'id' | 'criadoEm'> => ({
  nome: '',
  categoriaId: '',
  descricao: '',
  margemLucro: 10,
  ifoodTax: undefined,
  precoVenda: undefined,
  ifoodPrice: undefined,
  ifoodAppCommission: undefined,
  ifoodCardFee: undefined,
  ifoodFixedDelivery: undefined,
  isIfoodEnabled: false,
  ativo: true,
  insumos: [],
});

export default function ProdutosPage() {
  const {
    state,
    config,
    addProduto,
    updateProduto,
    deleteProduto,
    custoProducao,
    precoSugerido,
    precoFinal,
    addCategory,
    updateCategory,
    deleteCategory,
  } = useAppStore();
  const [form, setForm] = useState(emptyProduto());
  const [editing, setEditing] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [insumoId, setInsumoId] = useState('');
  const [insumoQty, setInsumoQty] = useState(0);

  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [editingCatName, setEditingCatName] = useState('');

  const [activeTab, setActiveTab] = useState<'geral' | 'ifood'>('geral');
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

  const updateIfoodConfig = (newConfig: Partial<typeof ifoodConfig>) => {
    setIfoodConfig((prev) => {
      const updated = { ...prev, ...newConfig };
      localStorage.setItem('ifoodConfig', JSON.stringify(updated));
      return updated;
    });
  };

  const calcPesoTotal = (p: Produto): number => {
    return p.insumos.reduce((acc, pi) => {
      const ins = state.insumos.find((i) => i.id === pi.insumoId);
      if (!ins) return acc;
      const unit = ins.unidadeMedida.toLowerCase();
      if (unit === 'g') {
        return acc + pi.quantidade;
      } else if (unit === 'kg') {
        return acc + pi.quantidade * 1000;
      }
      return acc;
    }, 0);
  };

  const fmt = (n: number) =>
    n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const calcCusto = (): number =>
    form.insumos.reduce((acc, pi) => {
      const ins = state.insumos.find((i) => i.id === pi.insumoId);
      return (
        acc +
        (ins
          ? (ins.custoEmbalagem / ins.quantidadeEmbalagem) * pi.quantidade
          : 0)
      );
    }, 0);

  const addIngrediente = () => {
    if (!insumoId || insumoQty <= 0) return;
    setForm((f) => ({
      ...f,
      insumos: f.insumos.find((i) => i.insumoId === insumoId)
        ? f.insumos.map((i) =>
            i.insumoId === insumoId ? { ...i, quantidade: insumoQty } : i,
          )
        : [...f.insumos, { insumoId, quantidade: insumoQty }],
    }));
    setInsumoId('');
    setInsumoQty(0);
  };

  const removeIngrediente = (id: string) =>
    setForm((f) => ({
      ...f,
      insumos: f.insumos.filter((i) => i.insumoId !== id),
    }));

  const handleAddCategory = async () => {
    if (!newCatName.trim()) return;
    try {
      await addCategory(newCatName.trim());
      setNewCatName('');
    } catch (e) {
      alert('Erro ao criar categoria.');
    }
  };

  const handleUpdateCategory = async (id: string) => {
    if (!editingCatName.trim()) return;
    try {
      await updateCategory(id, editingCatName.trim());
      setEditingCatId(null);
    } catch (e) {
      alert('Erro ao atualizar categoria.');
    }
  };

  const handleDeleteCategory = async (id: string) => {
    const hasProducts = state.produtos.some((p) => p.categoriaId === id);
    if (hasProducts) {
      alert('Não é possível excluir esta categoria pois ela possui produtos vinculados.');
      return;
    }
    if (confirm('Tem certeza de que deseja excluir esta categoria?')) {
      try {
        await deleteCategory(id);
      } catch (e) {
        alert('Erro ao excluir categoria.');
      }
    }
  };

  const handleSubmit = () => {
    if (!form.nome.trim()) return;
    if (!form.categoriaId) {
      alert('Por favor, selecione uma categoria.');
      return;
    }
    const data = {
      ...form,
      precoVenda: form.precoVenda !== undefined && form.precoVenda !== null && !isNaN(form.precoVenda) ? form.precoVenda : null,
      ifoodPrice: form.ifoodPrice !== undefined && form.ifoodPrice !== null && !isNaN(form.ifoodPrice) ? form.ifoodPrice : null,
      ifoodTax: form.ifoodTax !== undefined && form.ifoodTax !== null && !isNaN(form.ifoodTax) ? form.ifoodTax : null,
      ifoodAppCommission: form.ifoodAppCommission !== undefined && form.ifoodAppCommission !== null && !isNaN(form.ifoodAppCommission) ? form.ifoodAppCommission : null,
      ifoodCardFee: form.ifoodCardFee !== undefined && form.ifoodCardFee !== null && !isNaN(form.ifoodCardFee) ? form.ifoodCardFee : null,
      ifoodFixedDelivery: form.ifoodFixedDelivery !== undefined && form.ifoodFixedDelivery !== null && !isNaN(form.ifoodFixedDelivery) ? form.ifoodFixedDelivery : null,
    };
    if (editing) {
      updateProduto(editing, data);
      setEditing(null);
    } else addProduto(data);
    setForm(emptyProduto());
    setShowForm(false);
  };

  const startEdit = (p: Produto) => {
    setForm({
      nome: p.nome,
      categoriaId: p.categoriaId,
      descricao: p.descricao ?? '',
      margemLucro: p.margemLucro || config.margemLucroPadrao,
      ifoodTax: p.ifoodTax,
      precoVenda: p.precoVenda,
      ifoodPrice: p.ifoodPrice,
      ifoodAppCommission: p.ifoodAppCommission,
      ifoodCardFee: p.ifoodCardFee,
      ifoodFixedDelivery: p.ifoodFixedDelivery,
      isIfoodEnabled: p.isIfoodEnabled ?? false,
      ativo: p.ativo,
      insumos: p.insumos,
    });
    setEditing(p.id);
    setShowForm(true);
  };

  const custo = calcCusto();
  const sugerido = custo * (1 + form.margemLucro / 100);

  const precoSalao = form.precoVenda !== undefined && form.precoVenda !== null ? form.precoVenda : sugerido;
  const impostoItemModal = form.ifoodTax !== undefined && form.ifoodTax !== null ? form.ifoodTax : ifoodConfig.imposto;
  const comissaoAppItemModal = form.ifoodAppCommission !== undefined && form.ifoodAppCommission !== null ? form.ifoodAppCommission : ifoodConfig.comissaoApp;
  const taxaCartaoItemModal = form.ifoodCardFee !== undefined && form.ifoodCardFee !== null ? form.ifoodCardFee : ifoodConfig.taxaCartao;
  const custoEntregaItemModal = form.ifoodFixedDelivery !== undefined && form.ifoodFixedDelivery !== null ? form.ifoodFixedDelivery : ifoodConfig.custoEntrega;

  const D_rate_modal = (impostoItemModal + comissaoAppItemModal + taxaCartaoItemModal + ifoodConfig.recebidosLoja) / 100;
  const divisor_modal = Math.max(0.1, 1 - D_rate_modal);
  const precoSugeridoIfoodModal = (precoSalao + custoEntregaItemModal) / divisor_modal;

  return (
    <>
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6 animate-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-3xl">Cardápio</h1>
            <p className="text-stone-500 text-sm mt-1">
              {state.produtos.length} produto(s)
            </p>
          </div>
          <div className="flex gap-2">
            <button
              className="px-4 py-2 rounded-xl bg-stone-100 dark:bg-neutral-800 text-stone-700 dark:text-stone-250 border border-stone-200 dark:border-neutral-700 hover:bg-stone-200/50 dark:hover:bg-neutral-750 font-semibold text-sm transition-colors"
              onClick={() => setShowCategoryManager(true)}
            >
              📁 Categorias
            </button>
            <button
              className="btn-primary"
              onClick={() => {
                setForm({
                  ...emptyProduto(),
                  margemLucro: config.margemLucroPadrao,
                });
                setEditing(null);
                setShowForm(true);
              }}
            >
              + Novo Produto
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-stone-200 dark:border-neutral-800">
          <button
            className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
              activeTab === 'geral'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400'
                : 'border-transparent text-stone-500 hover:text-stone-700 dark:text-stone-400 dark:hover:text-stone-200'
            }`}
            onClick={() => setActiveTab('geral')}
          >
            Cardápio Geral
          </button>
          <button
            className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
              activeTab === 'ifood'
                ? 'border-orange-500 text-orange-500 dark:border-orange-500'
                : 'border-transparent text-stone-500 hover:text-stone-700 dark:text-stone-400 dark:hover:text-stone-200'
            }`}
            onClick={() => setActiveTab('ifood')}
          >
            🌐 Canal iFood
          </button>
        </div>

        {/* iFood Global Settings Panel */}
        {activeTab === 'ifood' && (
          <div className="bg-stone-50 dark:bg-neutral-900/60 border border-orange-200/60 dark:border-orange-950/40 rounded-2xl p-5 space-y-4 shadow-sm animate-in fade-in duration-200">
            <div className="flex items-center justify-between border-b border-stone-200/60 dark:border-neutral-800/80 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">⚙️</span>
                <h2 className="font-display text-sm font-bold uppercase tracking-wider text-stone-750 dark:text-stone-250">
                  Variáveis do Canal iFood
                </h2>
              </div>
              <span className="text-[10px] uppercase text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/40 border border-orange-100 dark:border-orange-900/20 px-2.5 py-1 rounded-full font-bold">
                Configurações Ativas
              </span>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-400 dark:text-stone-500 mb-1.5">
                  Imposto (%)
                </label>
                <input
                  type="number"
                  step="0.01"
                  className="input border-orange-200 dark:border-orange-900/20 focus:border-orange-500 focus:ring-orange-500/20 font-mono text-sm bg-white dark:bg-neutral-800 text-orange-600 dark:text-orange-400 font-bold"
                  value={ifoodConfig.imposto}
                  onChange={(e) => updateIfoodConfig({ imposto: Number(e.target.value) })}
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-400 dark:text-stone-500 mb-1.5">
                  Comissão App (%)
                </label>
                <input
                  type="number"
                  step="0.01"
                  className="input border-orange-200 dark:border-orange-900/20 focus:border-orange-500 focus:ring-orange-500/20 font-mono text-sm bg-white dark:bg-neutral-800 text-orange-600 dark:text-orange-400 font-bold"
                  value={ifoodConfig.comissaoApp}
                  onChange={(e) => updateIfoodConfig({ comissaoApp: Number(e.target.value) })}
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-400 dark:text-stone-500 mb-1.5">
                  Taxa Cartão (%)
                </label>
                <input
                  type="number"
                  step="0.01"
                  className="input border-orange-200 dark:border-orange-900/20 focus:border-orange-500 focus:ring-orange-500/20 font-mono text-sm bg-white dark:bg-neutral-800 text-orange-600 dark:text-orange-400 font-bold"
                  value={ifoodConfig.taxaCartao}
                  onChange={(e) => updateIfoodConfig({ taxaCartao: Number(e.target.value) })}
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-400 dark:text-stone-500 mb-1.5">
                  Recebidos Loja (%)
                </label>
                <input
                  type="number"
                  step="0.01"
                  className="input border-orange-200 dark:border-orange-900/20 focus:border-orange-500 focus:ring-orange-500/20 font-mono text-sm bg-white dark:bg-neutral-800 text-orange-600 dark:text-orange-400 font-bold"
                  value={ifoodConfig.recebidosLoja}
                  onChange={(e) => updateIfoodConfig({ recebidosLoja: Number(e.target.value) })}
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-400 dark:text-stone-500 mb-1.5">
                  Entrega Fixo (R$)
                </label>
                <input
                  type="number"
                  step="0.01"
                  className="input border-orange-200 dark:border-orange-900/20 focus:border-orange-500 focus:ring-orange-500/20 font-mono text-sm bg-white dark:bg-neutral-800 text-orange-600 dark:text-orange-400 font-bold"
                  value={ifoodConfig.custoEntrega}
                  onChange={(e) => updateIfoodConfig({ custoEntrega: Number(e.target.value) })}
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-400 dark:text-stone-500 mb-1.5">
                  Ticket Médio (R$)
                </label>
                <input
                  type="number"
                  step="0.01"
                  className="input border-orange-200 dark:border-orange-900/20 focus:border-orange-500 focus:ring-orange-500/20 font-mono text-sm bg-white dark:bg-neutral-800 text-orange-600 dark:text-orange-400 font-bold"
                  value={ifoodConfig.ticketMedio}
                  onChange={(e) => updateIfoodConfig({ ticketMedio: Number(e.target.value) })}
                />
              </div>
            </div>
          </div>
        )}

        {/* Product List based on active tab */}
        {activeTab === 'ifood' ? (
          <div className="space-y-4">
            {state.produtos.length === 0 ? (
              <div className="card p-12 text-center text-stone-400">
                Nenhum produto cadastrado
              </div>
            ) : (
              state.produtos.map((p) => {
                const custo = custoProducao(p);
                const pesoTotal = calcPesoTotal(p);
                
                const impostoItem = p.ifoodTax !== undefined && p.ifoodTax !== null ? p.ifoodTax : ifoodConfig.imposto;
                const comissaoAppItem = p.ifoodAppCommission !== undefined && p.ifoodAppCommission !== null ? p.ifoodAppCommission : ifoodConfig.comissaoApp;
                const taxaCartaoItem = p.ifoodCardFee !== undefined && p.ifoodCardFee !== null ? p.ifoodCardFee : ifoodConfig.taxaCartao;
                const custoEntregaItem = p.ifoodFixedDelivery !== undefined && p.ifoodFixedDelivery !== null ? p.ifoodFixedDelivery : ifoodConfig.custoEntrega;

                const isPrecoManual = p.ifoodPrice !== undefined && p.ifoodPrice !== null;
                
                const D_rate = (impostoItem + comissaoAppItem + taxaCartaoItem + ifoodConfig.recebidosLoja) / 100;
                const divisor = Math.max(0.1, 1 - D_rate);
                const precoSugeridoIfood = (precoFinal(p) + custoEntregaItem) / divisor;
                const precoVendaIfood = isPrecoManual ? (p.ifoodPrice as number) : precoSugeridoIfood;

                const valImposto = precoVendaIfood * (impostoItem / 100);
                const valComissao = precoVendaIfood * (comissaoAppItem / 100);
                const valTaxa = precoVendaIfood * (taxaCartaoItem / 100);
                const valRecebidosLoja = precoVendaIfood * (ifoodConfig.recebidosLoja / 100);

                return (
                  <div key={p.id} className={`card p-5 flex flex-col lg:flex-row gap-5 items-stretch border-l-4 ${p.isIfoodEnabled ? 'border-orange-500 hover:shadow-md' : 'border-stone-350 dark:border-neutral-700 opacity-60'} transition-all duration-200`}>
                    {/* Left Side: Product Info */}
                    <div className="flex-1 flex flex-col justify-between space-y-3 min-w-[240px]">
                      <div>
                        <div className="flex items-center flex-wrap gap-1.5 mb-1.5">
                          <span className="badge bg-stone-100 dark:bg-neutral-800 text-stone-500 dark:text-stone-400">
                            {p.categoria?.nome || 'Sem categoria'}
                          </span>
                          <span className={`badge ${p.ativo ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600' : 'bg-stone-100 text-stone-500'}`}>
                            {p.ativo ? 'Ativo' : 'Inativo'}
                          </span>
                          <span className={`badge border ${
                            p.isIfoodEnabled
                              ? 'bg-orange-50 dark:bg-orange-950/20 text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-900/30'
                              : 'bg-stone-50 text-stone-400 border-stone-200'
                          }`}>
                            {p.isIfoodEnabled ? '🌐 iFood Ativo' : '🌐 iFood Inativo'}
                          </span>
                        </div>
                        <h3 className="font-semibold text-stone-900 dark:text-stone-100 text-base">
                          {p.nome}
                        </h3>
                        {p.descricao && (
                          <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 max-w-md line-clamp-2">
                            {p.descricao}
                          </p>
                        )}
                      </div>

                      {/* Ingredients list compact */}
                      {p.insumos.length > 0 && (
                        <div className="space-y-1">
                          <h4 className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">
                            Ingredientes ({p.insumos.length})
                          </h4>
                          <div className="flex flex-wrap gap-1 max-w-md">
                            {p.insumos.map((pi) => {
                              const ins = state.insumos.find((i) => i.id === pi.insumoId);
                              return (
                                <span key={pi.insumoId} className="text-[10px] bg-stone-50 dark:bg-neutral-800 border border-stone-100 dark:border-neutral-800 text-stone-600 dark:text-stone-300 px-1.5 py-0.5 rounded">
                                  {ins?.nome ?? '—'}: {pi.quantidade} {ins?.unidadeMedida}
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex gap-2 pt-2">
                        <button
                          className="btn-ghost text-xs py-1 px-3"
                          onClick={() => startEdit(p)}
                        >
                          Editar
                        </button>
                        <button
                          className="btn-danger text-xs py-1 px-3"
                          onClick={() => deleteProduto(p.id)}
                        >
                          Excluir
                        </button>
                      </div>
                    </div>

                    {/* Right Side: Financial Table */}
                    <div className="flex-[3] bg-stone-50/50 dark:bg-neutral-900/40 border border-stone-105 dark:border-neutral-800 rounded-xl p-3 flex flex-col justify-center">
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 text-xs">
                        {/* Custo */}
                        <div className="bg-amber-50/50 dark:bg-amber-950/10 border border-amber-100 dark:border-amber-900/20 rounded-xl p-2.5 flex flex-col justify-between">
                          <span className="text-[10px] text-stone-400 uppercase font-semibold tracking-wider">Custo</span>
                          <span className="font-mono font-bold text-amber-600 dark:text-amber-400 text-sm mt-1">{fmt(custo)}</span>
                        </div>

                        {/* Peso Total */}
                        <div className="bg-stone-50 dark:bg-neutral-800/40 border border-stone-100 dark:border-neutral-800 rounded-xl p-2.5 flex flex-col justify-between">
                          <span className="text-[10px] text-stone-400 uppercase font-semibold tracking-wider">Peso Total</span>
                          <span className="font-mono font-semibold text-stone-700 dark:text-stone-300 text-sm mt-1">{pesoTotal > 0 ? `${pesoTotal.toFixed(0)}g` : '—'}</span>
                        </div>

                        {/* Taxas/Deduções */}
                        <div className="bg-stone-50 dark:bg-neutral-800/40 border border-stone-100 dark:border-neutral-800 rounded-xl p-2.5 flex flex-col justify-between col-span-1">
                          <span className="text-[10px] text-stone-400 uppercase font-semibold tracking-wider">Deduções</span>
                          <div className="flex flex-col mt-1 space-y-0.5 text-[9px] text-stone-500 dark:text-stone-400 font-mono leading-none">
                            <div className="flex justify-between">
                              <span>Imp ({impostoItem}%):</span>
                              <span>{fmt(valImposto)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Com ({comissaoAppItem}%):</span>
                              <span>{fmt(valComissao)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Taxa ({taxaCartaoItem}%):</span>
                              <span>{fmt(valTaxa)}</span>
                            </div>
                            {ifoodConfig.recebidosLoja > 0 && (
                              <div className="flex justify-between">
                                <span>Loja:</span>
                                <span>{fmt(valRecebidosLoja)}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Preço Normal */}
                        <div className="bg-blue-50/50 dark:bg-blue-950/10 border border-blue-100 dark:border-blue-900/20 rounded-xl p-2.5 flex flex-col justify-between">
                          <span className="text-[10px] text-blue-600 dark:text-blue-400 uppercase font-semibold tracking-wider font-bold">Preço Normal</span>
                          <span className="font-mono font-bold text-blue-600 dark:text-blue-400 text-sm mt-1">{fmt(precoFinal(p))}</span>
                        </div>

                        {/* Custo de Entrega */}
                        <div className="bg-stone-50 dark:bg-neutral-800/40 border border-stone-100 dark:border-neutral-800 rounded-xl p-2.5 flex flex-col justify-between">
                          <span className="text-[10px] text-stone-400 uppercase font-semibold tracking-wider">Entrega</span>
                          <span className="font-mono font-semibold text-stone-700 dark:text-stone-300 text-sm mt-1">{fmt(custoEntregaItem)}</span>
                        </div>

                        {/* Preço de Venda iFood */}
                        <div className="bg-orange-50/50 dark:bg-orange-950/10 border border-orange-100 dark:border-orange-900/20 rounded-xl p-2.5 flex flex-col justify-between col-span-1">
                          <span className="text-[10px] text-orange-500 uppercase font-semibold tracking-wider font-bold">Preço iFood</span>
                          <div className="flex flex-col mt-1">
                            <span className="font-mono font-bold text-orange-600 dark:text-orange-400 text-sm">
                              {fmt(precoVendaIfood)}
                            </span>
                            {!isPrecoManual ? (
                              <span className="text-[8px] text-amber-500 dark:text-amber-400 font-semibold mt-1">⚠️ Sugerido</span>
                            ) : (
                              <span className="text-[8px] text-blue-500 dark:text-blue-400 font-semibold mt-1">✓ Manual</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {state.produtos.length === 0 ? (
              <div className="card p-12 text-center text-stone-400">
                Nenhum produto cadastrado
              </div>
            ) : (
              state.produtos.map((p) => {
                const custo = custoProducao(p);
                const pesoTotal = calcPesoTotal(p);
                const precoSugeridoItem = precoSugerido(p);
                const precoVenda = precoFinal(p);
                
                const isPrecoManual = p.precoVenda !== undefined && p.precoVenda !== null;
                
                const lucro = precoVenda - custo;
                const cmv = precoVenda > 0 ? (custo / precoVenda) * 100 : 0;
                const margemReal = precoVenda > 0 ? (lucro / precoVenda) * 100 : 0;
                
                const cmvOk = cmv <= config.cmvMaximo;
                const margemOk = margemReal >= p.margemLucro;

                return (
                  <div key={p.id} className={`card p-5 flex flex-col lg:flex-row gap-5 items-stretch border-l-4 ${p.ativo ? 'border-blue-500 hover:shadow-md' : 'border-stone-350 dark:border-neutral-700 opacity-60'} transition-all duration-200`}>
                    {/* Left Side: Product Info */}
                    <div className="flex-1 flex flex-col justify-between space-y-3 min-w-[240px]">
                      <div>
                        <div className="flex items-center flex-wrap gap-1.5 mb-1.5">
                          <span className="badge bg-stone-100 dark:bg-neutral-800 text-stone-500 dark:text-stone-400">
                            {p.categoria?.nome || 'Sem categoria'}
                          </span>
                          <span className={`badge ${p.ativo ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600' : 'bg-stone-100 text-stone-500'}`}>
                            {p.ativo ? 'Ativo' : 'Inativo'}
                          </span>
                          {p.isIfoodEnabled && (
                            <span className="badge bg-orange-50 dark:bg-orange-950/20 text-orange-600 dark:text-orange-400 border border-orange-100 dark:border-orange-900/20">
                              🌐 iFood
                            </span>
                          )}
                        </div>
                        <h3 className="font-semibold text-stone-900 dark:text-stone-100 text-base">
                          {p.nome}
                        </h3>
                        {p.descricao && (
                          <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 max-w-md line-clamp-2">
                            {p.descricao}
                          </p>
                        )}
                      </div>

                      {/* Ingredients list compact */}
                      {p.insumos.length > 0 && (
                        <div className="space-y-1">
                          <h4 className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">
                            Ingredientes ({p.insumos.length})
                          </h4>
                          <div className="flex flex-wrap gap-1 max-w-md">
                            {p.insumos.map((pi) => {
                              const ins = state.insumos.find((i) => i.id === pi.insumoId);
                              return (
                                <span key={pi.insumoId} className="text-[10px] bg-stone-50 dark:bg-neutral-800 border border-stone-100 dark:border-neutral-800 text-stone-600 dark:text-stone-300 px-1.5 py-0.5 rounded">
                                  {ins?.nome ?? '—'}: {pi.quantidade} {ins?.unidadeMedida}
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex gap-2 pt-2">
                        <button
                          className="btn-ghost text-xs py-1 px-3"
                          onClick={() => startEdit(p)}
                        >
                          Editar
                        </button>
                        <button
                          className="btn-danger text-xs py-1 px-3"
                          onClick={() => deleteProduto(p.id)}
                        >
                          Excluir
                        </button>
                      </div>
                    </div>

                    {/* Right Side: Financial Table */}
                    <div className="flex-[3] bg-stone-50/50 dark:bg-neutral-900/40 border border-stone-105 dark:border-neutral-800 rounded-xl p-3 flex flex-col justify-center">
                      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-2 text-xs">
                        {/* Custo */}
                        <div className="bg-amber-50/50 dark:bg-amber-950/10 border border-amber-100 dark:border-amber-900/20 rounded-xl p-2.5 flex flex-col justify-between">
                          <span className="text-[10px] text-stone-400 uppercase font-semibold tracking-wider">Custo</span>
                          <span className="font-mono font-bold text-amber-600 dark:text-amber-400 text-sm mt-1">{fmt(custo)}</span>
                        </div>

                        {/* Peso Total */}
                        <div className="bg-stone-50 dark:bg-neutral-800/40 border border-stone-100 dark:border-neutral-800 rounded-xl p-2.5 flex flex-col justify-between">
                          <span className="text-[10px] text-stone-400 uppercase font-semibold tracking-wider">Peso Total</span>
                          <span className="font-mono font-semibold text-stone-700 dark:text-stone-300 text-sm mt-1">{pesoTotal > 0 ? `${pesoTotal.toFixed(0)}g` : '—'}</span>
                        </div>

                        {/* Margem Alvo */}
                        <div className="bg-stone-50 dark:bg-neutral-800/40 border border-stone-100 dark:border-neutral-800 rounded-xl p-2.5 flex flex-col justify-between">
                          <span className="text-[10px] text-stone-400 uppercase font-semibold tracking-wider">Margem Alvo</span>
                          <span className="font-mono font-semibold text-stone-700 dark:text-stone-300 text-sm mt-1">{p.margemLucro}%</span>
                        </div>

                        {/* Sugerido */}
                        <div className="bg-blue-50/50 dark:bg-blue-950/10 border border-blue-100 dark:border-blue-900/20 rounded-xl p-2.5 flex flex-col justify-between">
                          <span className="text-[10px] text-blue-600 dark:text-blue-400 uppercase font-semibold tracking-wider">Sugerido</span>
                          <span className="font-mono font-bold text-blue-600 dark:text-blue-400 text-sm mt-1">{fmt(precoSugeridoItem)}</span>
                        </div>

                        {/* Preço de Venda */}
                        <div className="bg-blue-50/50 dark:bg-blue-950/10 border border-blue-100 dark:border-blue-900/20 rounded-xl p-2.5 flex flex-col justify-between col-span-1">
                          <span className="text-[10px] text-blue-600 dark:text-blue-400 uppercase font-semibold tracking-wider">Venda</span>
                          <div className="flex flex-col mt-1">
                            <span className="font-mono font-bold text-blue-600 dark:text-blue-400 text-sm">
                              {fmt(precoVenda)}
                            </span>
                            {!isPrecoManual ? (
                              <span className="text-[8px] text-amber-500 dark:text-amber-400 font-semibold mt-1">⚠️ Sugerido</span>
                            ) : (
                              <span className="text-[8px] text-blue-500 dark:text-blue-400 font-semibold mt-1">✓ Manual</span>
                            )}
                          </div>
                        </div>

                        {/* Resultado */}
                        <div className="bg-emerald-50/50 dark:bg-emerald-950/10 border border-emerald-100 dark:border-emerald-900/20 rounded-xl p-2.5 flex flex-col justify-between">
                          <span className="text-[10px] text-emerald-600 dark:text-emerald-500 uppercase font-semibold tracking-wider">Resultado</span>
                          <div className="flex flex-col mt-1">
                            <span className={`font-mono font-bold text-sm ${lucro >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>{fmt(lucro)}</span>
                            <span className="text-[10px] text-stone-400 font-mono mt-0.5">CMV: {cmv.toFixed(1)}%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-hidden animate-in fade-in duration-200">
          <div className="bg-white dark:bg-neutral-900 border border-stone-200 dark:border-neutral-850 rounded-2xl shadow-2xl w-full max-w-2xl p-6 space-y-5 relative max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
            <button 
              onClick={() => { setShowForm(false); setEditing(null); }}
              className="absolute top-4 right-4 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 text-lg p-1 transition-colors"
              title="Fechar"
            >
              ✕
            </button>
            
            <h2 className="font-display text-xl font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
              {editing ? '🍽️ Editar Produto' : '✨ Novo Produto'}
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="label text-stone-500 dark:text-stone-400 font-semibold text-xs uppercase mb-1">Nome *</label>
                <input
                  className="input"
                  value={form.nome}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, nome: e.target.value }))
                  }
                  placeholder="Ex: Prato Feito"
                />
              </div>
              <div>
                <label className="label text-stone-500 dark:text-stone-400 font-semibold text-xs uppercase mb-1">Categoria *</label>
                <select
                  className="input"
                  value={form.categoriaId}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, categoriaId: e.target.value }))
                  }
                  required
                >
                  <option value="">Selecione...</option>
                  {state.categorias.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nome}
                    </option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-3">
                <label className="label text-stone-500 dark:text-stone-400 font-semibold text-xs uppercase mb-1">Descrição</label>
                <input
                  className="input"
                  value={form.descricao}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, descricao: e.target.value }))
                  }
                  placeholder="Ex: Delicioso prato feito com ingredientes frescos..."
                />
              </div>
              <div>
                <label className="label text-stone-500 dark:text-stone-400 font-semibold text-xs uppercase mb-1">Margem de Lucro (%)</label>
                <input
                  type="number"
                  className="input"
                  value={form.margemLucro}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, margemLucro: +e.target.value }))
                  }
                />
              </div>
              <div>
                <label className="label text-stone-500 dark:text-stone-400 font-semibold text-xs uppercase mb-1">Preço de Venda Manual (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  className="input"
                  value={form.precoVenda ?? ''}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      precoVenda: e.target.value ? +e.target.value : undefined,
                    }))
                  }
                  placeholder="Deixe vazio p/ sugerido"
                />
              </div>
              <div className="flex items-end pb-2 pl-1">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={form.ativo}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, ativo: e.target.checked }))
                    }
                    className="rounded border-stone-300 dark:border-neutral-800 text-blue-600 focus:ring-blue-500 h-4 w-4"
                  />
                  <span className="text-sm font-semibold text-stone-700 dark:text-stone-300">Produto Ativo</span>
                </label>
              </div>
              <div>
                <label className="label text-orange-500 font-semibold text-xs uppercase mb-1">Preço Venda iFood (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  className="input border-orange-100 dark:border-orange-950/20 focus:border-orange-500 focus:ring-orange-500/20"
                  value={form.ifoodPrice ?? ''}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      ifoodPrice: e.target.value ? +e.target.value : undefined,
                    }))
                  }
                  placeholder={precoSugeridoIfoodModal > 0 ? `Sugerido: R$ ${precoSugeridoIfoodModal.toFixed(2)}` : 'Deixe vazio p/ sugerido'}
                />
              </div>
              <div>
                <label className="label text-orange-500 font-semibold text-xs uppercase mb-1">Imposto iFood (%)</label>
                <input
                  type="number"
                  step="0.01"
                  className="input border-orange-100 dark:border-orange-950/20 focus:border-orange-500 focus:ring-orange-500/20"
                  value={form.ifoodTax ?? ''}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      ifoodTax: e.target.value ? +e.target.value : undefined,
                    }))
                  }
                  placeholder="Usa global se vazio"
                />
              </div>
              <div>
                <label className="label text-orange-500 font-semibold text-xs uppercase mb-1">Comissão APP (%)</label>
                <input
                  type="number"
                  step="0.01"
                  className="input border-orange-100 dark:border-orange-950/20 focus:border-orange-500 focus:ring-orange-500/20"
                  value={form.ifoodAppCommission ?? ''}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      ifoodAppCommission: e.target.value ? +e.target.value : undefined,
                    }))
                  }
                  placeholder="Usa global se vazio"
                />
              </div>
              <div>
                <label className="label text-orange-500 font-semibold text-xs uppercase mb-1">Taxa Cartão (%)</label>
                <input
                  type="number"
                  step="0.01"
                  className="input border-orange-100 dark:border-orange-950/20 focus:border-orange-500 focus:ring-orange-500/20"
                  value={form.ifoodCardFee ?? ''}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      ifoodCardFee: e.target.value ? +e.target.value : undefined,
                    }))
                  }
                  placeholder="Usa global se vazio"
                />
              </div>
              <div>
                <label className="label text-orange-500 font-semibold text-xs uppercase mb-1">Entrega Fixo (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  className="input border-orange-100 dark:border-orange-950/20 focus:border-orange-500 focus:ring-orange-500/20"
                  value={form.ifoodFixedDelivery ?? ''}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      ifoodFixedDelivery: e.target.value ? +e.target.value : undefined,
                    }))
                  }
                  placeholder="Usa global se vazio"
                />
              </div>
              <div className="flex items-end pb-2 pl-1">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={form.isIfoodEnabled}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, isIfoodEnabled: e.target.checked }))
                    }
                    className="rounded border-stone-300 dark:border-neutral-800 text-orange-600 focus:ring-orange-500 h-4 w-4"
                  />
                  <span className="text-sm font-semibold text-stone-700 dark:text-stone-300">Disponível no iFood</span>
                </label>
              </div>
            </div>

            {/* Ingredientes */}
            <div className="border-t border-stone-100 dark:border-neutral-850 pt-4">
              <h3 className="text-xs font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider mb-3">
                Ingredientes
              </h3>
              <div className="flex gap-2 mb-3">
                <select
                  className="input flex-1"
                  value={insumoId}
                  onChange={(e) => setInsumoId(e.target.value)}
                >
                  <option value="">Selecione o insumo</option>
                  {state.insumos.map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.nome} ({i.unidadeMedida})
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  className="input w-32"
                  value={insumoQty || ''}
                  onChange={(e) => setInsumoQty(+e.target.value)}
                  placeholder="Qtd."
                />
                <button className="btn-primary shrink-0 px-4 py-2" onClick={addIngrediente}>
                  Adicionar
                </button>
              </div>
              
              {form.insumos.length > 0 ? (
                <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                  {form.insumos.map((pi) => {
                    const ins = state.insumos.find((i) => i.id === pi.insumoId);
                    const sub = ins
                      ? (ins.custoEmbalagem / ins.quantidadeEmbalagem) *
                        pi.quantidade
                      : 0;
                    return (
                      <div
                        key={pi.insumoId}
                        className="flex items-center justify-between bg-stone-50 dark:bg-neutral-800/40 border border-stone-100 dark:border-neutral-800 rounded-xl px-3 py-2 text-sm"
                      >
                        <span className="font-medium text-stone-800 dark:text-stone-200">{ins?.nome ?? '—'}</span>
                        <span className="text-stone-500">
                          {pi.quantidade} {ins?.unidadeMedida}
                        </span>
                        <span className="font-mono text-blue-600 dark:text-blue-400">
                          {fmt(sub)}
                        </span>
                        <button
                          className="text-red-500 hover:text-red-700 text-xs ml-2 p-1 transition-colors"
                          onClick={() => removeIngrediente(pi.insumoId)}
                          title="Remover"
                        >
                          ✕
                        </button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-stone-400 dark:text-stone-500 text-xs italic">Nenhum insumo vinculado a este produto. O preço de custo será calculado como R$ 0,00.</p>
              )}
            </div>

            {/* Preview custos */}
            <div className={`grid ${form.isIfoodEnabled ? 'grid-cols-2 md:grid-cols-4' : 'grid-cols-3'} gap-3 border-t border-stone-100 dark:border-neutral-850 pt-4`}>
              {[
                {
                  label: 'Custo de Produção',
                  value: fmt(custo),
                  color: 'text-amber-600 dark:text-amber-400',
                  bg: 'bg-amber-50 dark:bg-amber-950/20 border border-amber-100/60 dark:border-amber-900/30',
                },
                {
                  label: `Preço Sugerido (+${form.margemLucro}%)`,
                  value: fmt(sugerido),
                  color: 'text-blue-600 dark:text-blue-400',
                  bg: 'bg-blue-50 dark:bg-blue-950/20 border border-blue-100/60 dark:border-blue-900/30',
                },
                {
                  label: 'Preço Final',
                  value: fmt(form.precoVenda ?? sugerido),
                  color: 'text-emerald-600 dark:text-emerald-400',
                  bg: 'bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100/60 dark:border-emerald-900/30',
                },
                ...(form.isIfoodEnabled ? [
                  {
                    label: 'Preço iFood Final',
                    value: fmt(form.ifoodPrice ?? precoSugeridoIfoodModal),
                    color: 'text-orange-600 dark:text-orange-400',
                    bg: 'bg-orange-50 dark:bg-orange-950/20 border border-orange-100/60 dark:border-orange-900/30',
                  }
                ] : []),
              ].map((c) => (
                <div
                  key={c.label}
                  className={`${c.bg} rounded-xl p-3 text-center`}
                >
                  <p className="text-[10px] text-stone-500 uppercase font-semibold tracking-wider mb-1">{c.label}</p>
                  <p className={`font-mono font-bold ${c.color}`}>
                    {c.value}
                  </p>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-stone-100 dark:border-neutral-800">
              <button
                className="px-4 py-2 rounded-xl bg-stone-100 dark:bg-neutral-800 hover:bg-stone-200 dark:hover:bg-neutral-700 text-stone-700 dark:text-stone-300 font-semibold text-sm transition-colors"
                onClick={() => {
                  setShowForm(false);
                  setEditing(null);
                }}
              >
                Cancelar
              </button>
              <button
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-sm transition-colors"
                onClick={handleSubmit}
              >
                {editing ? 'Salvar' : 'Criar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showCategoryManager && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-hidden animate-in fade-in duration-200">
          <div className="bg-white dark:bg-neutral-900 border border-stone-200 dark:border-neutral-850 rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-5 relative max-h-[85vh] overflow-y-auto animate-in zoom-in-95 duration-200">
            <button 
              onClick={() => { setShowCategoryManager(false); setEditingCatId(null); }}
              className="absolute top-4 right-4 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 text-lg p-1 transition-colors"
              title="Fechar"
            >
              ✕
            </button>
            
            <h2 className="font-display text-xl font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2 border-b pb-3 border-stone-100 dark:border-neutral-800">
              📁 Gerenciar Categorias
            </h2>

            {/* Nova Categoria Form */}
            <div className="space-y-2">
              <label className="label text-stone-500 dark:text-stone-400 font-semibold text-xs uppercase">Nova Categoria</label>
              <div className="flex gap-2">
                <input
                  className="input flex-1"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  placeholder="Ex: Bebidas, Sobremesas..."
                />
                <button 
                  className="btn-primary px-4 py-2 text-sm shrink-0"
                  onClick={handleAddCategory}
                >
                  Adicionar
                </button>
              </div>
            </div>

            {/* Lista de Categorias */}
            <div className="space-y-2 max-h-[40vh] overflow-y-auto pr-1">
              <label className="label text-stone-500 dark:text-stone-400 font-semibold text-xs uppercase">Categorias Existentes</label>
              {state.categorias.length === 0 ? (
                <p className="text-stone-400 dark:text-stone-500 text-xs italic">Nenhuma categoria criada.</p>
              ) : (
                <div className="space-y-1.5">
                  {state.categorias.map((cat) => (
                    <div 
                      key={cat.id} 
                      className="flex items-center justify-between bg-stone-50 dark:bg-neutral-800/40 border border-stone-150 dark:border-neutral-800 rounded-xl px-3 py-2 text-sm transition-all"
                    >
                      {editingCatId === cat.id ? (
                        <div className="flex gap-2 w-full">
                          <input
                            className="input flex-1 py-1 px-2 text-sm"
                            value={editingCatName}
                            onChange={(e) => setEditingCatName(e.target.value)}
                          />
                          <button 
                            className="text-emerald-500 hover:text-emerald-700 text-xs px-1.5 font-bold"
                            onClick={() => handleUpdateCategory(cat.id)}
                          >
                            Salvar
                          </button>
                          <button 
                            className="text-stone-400 hover:text-stone-600 text-xs px-1.5"
                            onClick={() => setEditingCatId(null)}
                          >
                            Cancelar
                          </button>
                        </div>
                      ) : (
                        <>
                          <span className="font-medium text-stone-850 dark:text-stone-105">{cat.nome}</span>
                          <div className="flex items-center gap-2">
                            <button
                              className="text-blue-500 hover:text-blue-700 text-xs p-1"
                              onClick={() => {
                                setEditingCatId(cat.id);
                                setEditingCatName(cat.nome);
                              }}
                              title="Editar"
                            >
                              ✏️
                            </button>
                            <button
                              className="text-red-500 hover:text-red-700 text-xs p-1"
                              onClick={() => handleDeleteCategory(cat.id)}
                              title="Excluir"
                            >
                              ✕
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2 border-t border-stone-100 dark:border-neutral-800">
              <button
                className="px-4 py-2 rounded-xl bg-stone-100 dark:bg-neutral-800 hover:bg-stone-200 dark:hover:bg-neutral-700 text-stone-700 dark:text-stone-300 font-semibold text-sm transition-colors"
                onClick={() => {
                  setShowCategoryManager(false);
                  setEditingCatId(null);
                }}
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
