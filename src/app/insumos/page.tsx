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

      {/* Form */}
      {showForm && (
        <div className="card p-6 space-y-4 animate-in">
          <h2 className="font-semibold text-stone-800 dark:text-stone-200">{editing ? 'Editar' : 'Novo'} Insumo</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="col-span-2 md:col-span-1">
              <label className="label">Nome *</label>
              <input className="input" value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} placeholder="Ex: Arroz" />
            </div>
            <div>
              <label className="label">Unidade de Medida</label>
              <select className="input" value={form.unidadeMedida} onChange={e => setForm(f => ({ ...f, unidadeMedida: e.target.value as UnidadeMedida }))}>
                {UNIDADES.map(u => <option key={u}>{u}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Estoque Atual</label>
              <input type="number" className="input" value={form.estoqueAtual} onChange={e => setForm(f => ({ ...f, estoqueAtual: +e.target.value }))} />
            </div>
            <div>
              <label className="label">Custo da Embalagem (R$)</label>
              <input type="number" step="0.01" className="input" value={form.custoEmbalagem} onChange={e => setForm(f => ({ ...f, custoEmbalagem: +e.target.value }))} placeholder="Ex: 25.00" />
            </div>
            <div>
              <label className="label">Qtd. na Embalagem ({form.unidadeMedida})</label>
              <input type="number" className="input" value={form.quantidadeEmbalagem} onChange={e => setForm(f => ({ ...f, quantidadeEmbalagem: +e.target.value }))} placeholder="Ex: 5000" />
            </div>
            <div className="flex items-end">
              <div className="w-full p-3 bg-blue-50 dark:bg-blue-950 rounded-xl text-sm">
                <span className="text-stone-500 dark:text-stone-400 block text-xs mb-0.5">Custo por {form.unidadeMedida}</span>
                <span className="font-mono font-medium text-blue-700 dark:text-blue-300">
                  {form.quantidadeEmbalagem > 0 ? fmt(form.custoEmbalagem / form.quantidadeEmbalagem) : '—'}
                </span>
              </div>
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <button className="btn-primary" onClick={handleSubmit}>{editing ? 'Salvar' : 'Criar'}</button>
            <button className="btn-ghost" onClick={() => { setShowForm(false); setEditing(null); }}>Cancelar</button>
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
