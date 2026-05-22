'use client';
import { useState } from 'react';
import { useAppStore } from '@/lib/store-context';
import type { Insumo, UnidadeMedida } from '@/types';

const UNIDADES: UnidadeMedida[] = ['g', 'kg', 'ml', 'L', 'un'];

const empty = (): Omit<Insumo, 'id' | 'criadoEm'> => ({
  nome: '', unidadeMedida: 'g', estoqueAtual: 0,
  custoEmbalagem: 0, quantidadeEmbalagem: 0,
});

export default function InsumosPage() {
  const { state, addInsumo, updateInsumo, deleteInsumo, custoUnitario } = useAppStore();
  const [form, setForm] = useState(empty());
  const [editing, setEditing] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  const fmt = (n: number) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 4 });

  const handleSubmit = () => {
    if (!form.nome.trim()) return;
    if (editing) {
      updateInsumo(editing, form);
      setEditing(null);
    } else {
      addInsumo(form);
    }
    setForm(empty());
    setShowForm(false);
  };

  const startEdit = (insumo: Insumo) => {
    setForm({ nome: insumo.nome, unidadeMedida: insumo.unidadeMedida, estoqueAtual: insumo.estoqueAtual, custoEmbalagem: insumo.custoEmbalagem, quantidadeEmbalagem: insumo.quantidadeEmbalagem });
    setEditing(insumo.id);
    setShowForm(true);
  };

  const handleAjusteEstoque = (insumo: Insumo, tipo: 'entrada' | 'saida') => {
    const qtdStr = window.prompt(`Quantos(as) ${insumo.unidadeMedida} de ${insumo.nome} darão ${tipo}?`);
    if (!qtdStr) return;
    const qtd = Number(qtdStr.replace(',', '.'));
    if (isNaN(qtd) || qtd <= 0) return alert('Quantidade inválida!');

    const novoEstoque = tipo === 'entrada' ? insumo.estoqueAtual + qtd : insumo.estoqueAtual - qtd;
    updateInsumo(insumo.id, { ...insumo, estoqueAtual: novoEstoque });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6 animate-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl">Insumos</h1>
          <p className="text-stone-500 text-sm mt-1">{state.insumos.length} ingrediente(s) cadastrado(s)</p>
        </div>
        <button className="btn-primary" onClick={() => { setForm(empty()); setEditing(null); setShowForm(true); }}>
          + Novo Insumo
        </button>
      </div>

      {/* Modal Form */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white dark:bg-neutral-900 border border-stone-200 dark:border-neutral-800 rounded-2xl shadow-2xl w-full max-w-lg p-6 space-y-5 relative animate-in zoom-in-95 duration-200">
            <button 
              onClick={() => { setShowForm(false); setEditing(null); }}
              className="absolute top-4 right-4 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 text-lg p-1 transition-colors"
              title="Fechar"
            >
              ✕
            </button>
            
            <h2 className="font-display text-xl font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
              {editing ? '📝 Editar Insumo' : '🌱 Novo Insumo'}
            </h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="label text-stone-500 dark:text-stone-400 font-semibold text-xs uppercase mb-1">Nome *</label>
                <input className="input" value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} placeholder="Ex: Arroz" />
              </div>
              <div>
                <label className="label text-stone-500 dark:text-stone-400 font-semibold text-xs uppercase mb-1">Unidade de Medida</label>
                <select className="input" value={form.unidadeMedida} onChange={e => setForm(f => ({ ...f, unidadeMedida: e.target.value as UnidadeMedida }))}>
                  {UNIDADES.map(u => <option key={u}>{u}</option>)}
                </select>
              </div>
              <div>
                <label className="label text-stone-500 dark:text-stone-400 font-semibold text-xs uppercase mb-1">Estoque Atual</label>
                <input type="number" className="input" value={form.estoqueAtual} onChange={e => setForm(f => ({ ...f, estoqueAtual: +e.target.value }))} />
              </div>
              <div>
                <label className="label text-stone-500 dark:text-stone-400 font-semibold text-xs uppercase mb-1">Custo da Embalagem (R$)</label>
                <input type="number" step="0.01" className="input" value={form.custoEmbalagem} onChange={e => setForm(f => ({ ...f, custoEmbalagem: +e.target.value }))} placeholder="Ex: 25.00" />
              </div>
              <div>
                <label className="label text-stone-500 dark:text-stone-400 font-semibold text-xs uppercase mb-1">Qtd. na Embalagem ({form.unidadeMedida})</label>
                <input type="number" className="input" value={form.quantidadeEmbalagem} onChange={e => setForm(f => ({ ...f, quantidadeEmbalagem: +e.target.value }))} placeholder="Ex: 5000" />
              </div>
              <div className="sm:col-span-2 p-3.5 bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/50 rounded-xl text-sm flex items-center justify-between">
                <div>
                  <span className="text-stone-400 dark:text-stone-500 block text-[10px] uppercase font-bold tracking-wider mb-0.5">Custo Unitário Calculado</span>
                  <span className="text-stone-500 dark:text-stone-400 text-xs">Custo por {form.unidadeMedida}</span>
                </div>
                <span className="font-mono font-bold text-base text-blue-600 dark:text-blue-400">
                  {form.quantidadeEmbalagem > 0 ? fmt(form.custoEmbalagem / form.quantidadeEmbalagem) : '—'}
                </span>
              </div>
            </div>
            
            <div className="flex justify-end gap-2 pt-4 border-t border-stone-100 dark:border-neutral-800">
              <button className="px-4 py-2 rounded-xl bg-stone-100 dark:bg-neutral-800 hover:bg-stone-200 dark:hover:bg-neutral-700 text-stone-700 dark:text-stone-300 font-semibold text-sm transition-colors" onClick={() => { setShowForm(false); setEditing(null); }}>
                Cancelar
              </button>
              <button className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-sm transition-colors" onClick={handleSubmit}>
                {editing ? 'Salvar' : 'Criar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-stone-200 dark:border-neutral-800 bg-stone-50 dark:bg-neutral-900">
                {['Nome', 'Unidade', 'Estoque', 'Custo Emb.', 'Qtd Emb.', 'Custo/Un.', 'Ações'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {state.insumos.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-stone-400">Nenhum insumo cadastrado</td></tr>
              ) : state.insumos.map(insumo => (
                <tr key={insumo.id} className="border-b border-stone-100 dark:border-neutral-800 hover:bg-stone-50 dark:hover:bg-neutral-900 transition-colors">
                  <td className="px-4 py-3 font-medium">{insumo.nome}</td>
                  <td className="px-4 py-3"><span className="badge bg-stone-100 dark:bg-neutral-800 text-stone-600 dark:text-stone-400">{insumo.unidadeMedida}</span></td>
                  <td className="px-4 py-3">
                    <span className={insumo.estoqueAtual <= 0 ? 'text-red-500 font-medium' : ''}>
                      {insumo.estoqueAtual.toLocaleString('pt-BR')} {insumo.unidadeMedida}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono">{insumo.custoEmbalagem.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                  <td className="px-4 py-3 font-mono">{insumo.quantidadeEmbalagem} {insumo.unidadeMedida}</td>
                  <td className="px-4 py-3 font-mono text-blue-600 dark:text-blue-400">{fmt(custoUnitario(insumo))}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        className="btn-ghost text-xs py-1 px-2 text-emerald-600 hover:text-emerald-700 dark:text-emerald-400"
                        onClick={() => handleAjusteEstoque(insumo, 'entrada')}
                      >
                        + Entrada
                      </button>
                      <button
                        className="btn-ghost text-xs py-1 px-2 text-amber-600 hover:text-amber-700 dark:text-amber-400"
                        onClick={() => handleAjusteEstoque(insumo, 'saida')}
                      >
                        - Saída
                      </button>
                      <button className="btn-ghost text-xs py-1 px-2" onClick={() => startEdit(insumo)}>Editar</button>
                      <button className="btn-danger text-xs py-1 px-2" onClick={() => deleteInsumo(insumo.id)}>Del</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
