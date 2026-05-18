'use client';
import { useState } from 'react';
import { useAppStore } from '@/lib/store-context';
import type { Produto } from '@/types';

const emptyProduto = (): Omit<Produto, 'id' | 'criadoEm'> => ({
  nome: '',
  categoria: '',
  descricao: '',
  margemLucro: 10,
  precoVenda: undefined,
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
    precoFinal,
  } = useAppStore();
  const [form, setForm] = useState(emptyProduto());
  const [editing, setEditing] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [insumoId, setInsumoId] = useState('');
  const [insumoQty, setInsumoQty] = useState(0);

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

  const handleSubmit = () => {
    if (!form.nome.trim()) return;
    const data = { ...form, precoVenda: form.precoVenda || undefined };
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
      categoria: p.categoria,
      descricao: p.descricao ?? '',
      margemLucro: p.margemLucro || config.margemLucroPadrao,
      precoVenda: p.precoVenda,
      ativo: p.ativo,
      insumos: p.insumos,
    });
    setEditing(p.id);
    setShowForm(true);
  };

  const custo = calcCusto();
  const sugerido = custo * (1 + form.margemLucro / 100);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6 animate-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl">Cardápio</h1>
          <p className="text-stone-500 text-sm mt-1">
            {state.produtos.length} produto(s)
          </p>
        </div>
        <button
          className="btn-primary"
          onClick={() => {
            setForm(emptyProduto());
            setEditing(null);
            setShowForm(true);
          }}
        >
          + Novo Produto
        </button>
      </div>

      {showForm && (
        <div className="card p-6 space-y-5 animate-in">
          <h2 className="font-semibold text-stone-800 dark:text-stone-200">
            {editing ? 'Editar' : 'Novo'} Produto
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="col-span-2">
              <label className="label">Nome *</label>
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
              <label className="label">Categoria</label>
              <input
                className="input"
                value={form.categoria}
                onChange={(e) =>
                  setForm((f) => ({ ...f, categoria: e.target.value }))
                }
                placeholder="Ex: Prato"
              />
            </div>
            <div>
              <label className="label">Margem de Lucro (%)</label>
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
              <label className="label">Preço de Venda Manual (R$)</label>
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
            <div className="col-span-3">
              <label className="label">Descrição</label>
              <input
                className="input"
                value={form.descricao}
                onChange={(e) =>
                  setForm((f) => ({ ...f, descricao: e.target.value }))
                }
              />
            </div>
          </div>

          {/* Ingredientes */}
          <div>
            <h3 className="text-sm font-semibold text-stone-700 dark:text-stone-300 mb-3">
              Ingredientes
            </h3>
            <div className="flex gap-2 mb-3">
              <select
                className="input"
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
              <button className="btn-primary shrink-0" onClick={addIngrediente}>
                +
              </button>
            </div>
            {form.insumos.length > 0 && (
              <div className="space-y-2">
                {form.insumos.map((pi) => {
                  const ins = state.insumos.find((i) => i.id === pi.insumoId);
                  const sub = ins
                    ? (ins.custoEmbalagem / ins.quantidadeEmbalagem) *
                      pi.quantidade
                    : 0;
                  return (
                    <div
                      key={pi.insumoId}
                      className="flex items-center justify-between bg-stone-50 dark:bg-neutral-800 rounded-xl px-3 py-2 text-sm"
                    >
                      <span className="font-medium">{ins?.nome ?? '—'}</span>
                      <span className="text-stone-500">
                        {pi.quantidade} {ins?.unidadeMedida}
                      </span>
                      <span className="font-mono text-blue-600 dark:text-blue-400">
                        {fmt(sub)}
                      </span>
                      <button
                        className="text-red-500 hover:text-red-700 text-xs ml-2"
                        onClick={() => removeIngrediente(pi.insumoId)}
                      >
                        ✕
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Preview custos */}
          <div className="grid grid-cols-3 gap-3">
            {[
              {
                label: 'Custo de Produção',
                value: fmt(custo),
                color: 'text-amber-600',
              },
              {
                label: `Preço Sugerido (+${form.margemLucro}%)`,
                value: fmt(sugerido),
                color: 'text-blue-600',
              },
              {
                label: 'Preço Final',
                value: fmt(form.precoVenda ?? sugerido),
                color: 'text-emerald-600',
              },
            ].map((c) => (
              <div
                key={c.label}
                className="bg-stone-50 dark:bg-neutral-800 rounded-xl p-3 text-center"
              >
                <p className="text-xs text-stone-500 mb-1">{c.label}</p>
                <p className={`font-mono font-semibold ${c.color}`}>
                  {c.value}
                </p>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <button className="btn-primary" onClick={handleSubmit}>
              {editing ? 'Salvar' : 'Criar'}
            </button>
            <button
              className="btn-ghost"
              onClick={() => {
                setShowForm(false);
                setEditing(null);
              }}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Grid de produtos */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {state.produtos.length === 0 ? (
          <div className="col-span-3 card p-12 text-center text-stone-400">
            Nenhum produto cadastrado
          </div>
        ) : (
          state.produtos.map((p) => {
            const custo = custoProducao(p);
            const preco = precoFinal(p);
            const lucro = preco - custo;
            const cmvAtual = preco > 0 ? (custo / preco) * 100 : 0;
            const margemAtual = preco > 0 ? (lucro / preco) * 100 : 0;

            const cmvOk = cmvAtual <= config.cmvMaximo;
            const margemOk = margemAtual >= config.margemLucroPadrao;

            return (
              <div key={p.id} className="card p-5 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="badge bg-stone-100 dark:bg-neutral-800 text-stone-500 dark:text-stone-400 mb-1">
                      {p.categoria || 'Sem categoria'}
                    </span>
                    <h3 className="font-semibold text-stone-900 dark:text-stone-100">
                      {p.nome}
                    </h3>
                    {p.descricao && (
                      <p className="text-xs text-stone-500 mt-0.5">
                        {p.descricao}
                      </p>
                    )}
                  </div>
                  <span
                    className={`badge ${p.ativo ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-600' : 'bg-stone-100 text-stone-500'}`}
                  >
                    {p.ativo ? 'Ativo' : 'Inativo'}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="bg-amber-50 dark:bg-amber-950 rounded-lg p-2">
                    <p className="text-stone-500 mb-0.5">Custo</p>
                    <p className="font-mono font-semibold text-amber-600">
                      {fmt(custo)}
                    </p>
                  </div>
                  <div className="bg-blue-50 dark:bg-blue-950 rounded-lg p-2">
                    <p className="text-stone-500 mb-0.5">Venda</p>
                    <p className="font-mono font-semibold text-blue-600">
                      {fmt(preco)}
                    </p>
                  </div>
                  <div className="bg-emerald-50 dark:bg-emerald-950 rounded-lg p-2">
                    <p className="text-stone-500 mb-0.5">Lucro</p>
                    <p
                      className={`font-mono font-semibold ${lucro >= 0 ? 'text-emerald-600' : 'text-red-500'}`}
                    >
                      {fmt(lucro)}
                    </p>
                  </div>
                </div>

                {/* Indicadores de Saúde Financeira */}
                <div className="flex justify-between items-center bg-stone-50 dark:bg-neutral-900 rounded-lg p-2 border border-stone-100 dark:border-neutral-800 mt-2">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-stone-400 uppercase font-semibold tracking-wider">
                      CMV ({config.cmvMaximo.toFixed(1)}%)
                    </span>
                    <span
                      className={`text-xs font-mono font-medium ${cmvOk ? 'text-emerald-600' : 'text-red-500'}`}
                    >
                      {cmvAtual.toFixed(1)}%
                    </span>
                  </div>
                  <div className="h-6 w-px bg-stone-200 dark:bg-neutral-700"></div>
                  <div className="flex flex-col text-right">
                    <span className="text-[10px] text-stone-400 uppercase font-semibold tracking-wider">
                      Margem ({config.margemLucroPadrao.toFixed(1)}%)
                    </span>
                    <span
                      className={`text-xs font-mono font-medium ${margemOk ? 'text-emerald-600' : 'text-amber-500'}`}
                    >
                      {margemAtual.toFixed(1)}%
                    </span>
                  </div>
                </div>

                <div className="flex gap-2 pt-1">
                  <button
                    className="btn-ghost text-xs py-1 flex-1"
                    onClick={() => startEdit(p)}
                  >
                    Editar
                  </button>
                  <button
                    className="btn-danger text-xs py-1 flex-1"
                    onClick={() => deleteProduto(p.id)}
                  >
                    Excluir
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
