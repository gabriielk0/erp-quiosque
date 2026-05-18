'use client';
import { useState, useEffect } from 'react';

type Despesa = {
  id: number;
  descricao: string;
  tipo: 'fixa' | 'variavel';
  valor: number;
  ativo: boolean;
};

export default function DespesasPage() {
  const [despesas, setDespesas] = useState<Despesa[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<Partial<Despesa>>({
    descricao: '',
    tipo: 'fixa',
    valor: 0,
    ativo: true,
  });
  const [editing, setEditing] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetch('/api/despesas')
      .then((res) => res.json())
      .then((data) => {
        setDespesas(data.map((d: any) => ({ ...d, valor: Number(d.valor) })));
        setLoading(false);
      });
  }, []);

  const fmt = (n: number, tipo: string) =>
    tipo === 'fixa'
      ? n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
      : `${n.toFixed(2).replace('.', ',')}%`;

  const handleSubmit = async () => {
    if (!form.descricao) return;
    try {
      const method = editing ? 'PUT' : 'POST';
      const url = editing ? `/api/despesas/${editing}` : '/api/despesas';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (!res.ok) throw new Error('Falha ao salvar');
      const saved = await res.json();

      setDespesas((prev) =>
        editing
          ? prev.map((d) =>
              d.id === editing ? { ...saved, valor: Number(saved.valor) } : d,
            )
          : [...prev, { ...saved, valor: Number(saved.valor) }],
      );

      setShowForm(false);
      setEditing(null);
    } catch (error) {
      alert('Erro ao salvar despesa. Verifique o servidor.');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Tem certeza que deseja excluir esta despesa?')) return;
    try {
      const res = await fetch(`/api/despesas/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Falha ao excluir');
      setDespesas((prev) => prev.filter((d) => d.id !== id));
    } catch (error) {
      alert('Erro ao excluir despesa.');
    }
  };

  const fixas = despesas.filter((d) => d.tipo === 'fixa');
  const variaveis = despesas.filter((d) => d.tipo === 'variavel');

  const totalFixas = fixas.reduce((acc, d) => acc + d.valor, 0);
  const totalVariaveis = variaveis.reduce((acc, d) => acc + d.valor, 0);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8 animate-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl">Despesas</h1>
          <p className="text-stone-500 text-sm mt-1">
            Gerencie custos fixos e variáveis
          </p>
        </div>
        <button
          className="btn-primary"
          onClick={() => {
            setForm({ descricao: '', tipo: 'fixa', valor: 0, ativo: true });
            setEditing(null);
            setShowForm(true);
          }}
        >
          + Nova Despesa
        </button>
      </div>

      {showForm && (
        <div className="card p-6 space-y-4">
          <h2 className="font-semibold text-stone-800 dark:text-stone-200">
            {editing ? 'Editar' : 'Nova'} Despesa
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="label">Descrição</label>
              <input
                className="input"
                value={form.descricao}
                onChange={(e) =>
                  setForm((f) => ({ ...f, descricao: e.target.value }))
                }
                placeholder="Ex: Aluguel"
              />
            </div>
            <div>
              <label className="label">Tipo</label>
              <select
                className="input"
                value={form.tipo}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    tipo: e.target.value as 'fixa' | 'variavel',
                  }))
                }
              >
                <option value="fixa">Fixa (Mensalidade em R$)</option>
                <option value="variavel">Variável (Porcentagem %)</option>
              </select>
            </div>
            <div>
              <label className="label">
                {form.tipo === 'fixa' ? 'Valor (R$)' : 'Porcentagem (%)'}
              </label>
              <input
                type="number"
                step="0.01"
                className="input"
                value={form.valor}
                onChange={(e) =>
                  setForm((f) => ({ ...f, valor: +e.target.value }))
                }
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button className="btn-primary" onClick={handleSubmit}>
              Salvar
            </button>
            <button className="btn-ghost" onClick={() => setShowForm(false)}>
              Cancelar
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-stone-500">
          Carregando despesas...
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-8">
          {/* Lista de Fixas */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-stone-700 dark:text-stone-300">
                Despesas Fixas
              </h3>
              <span className="badge bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                Total: {fmt(totalFixas, 'fixa')}
              </span>
            </div>
            <div className="card divide-y divide-stone-100 dark:divide-neutral-800">
              {fixas.length === 0 ? (
                <p className="p-6 text-center text-stone-400">
                  Nenhuma despesa fixa
                </p>
              ) : (
                fixas.map((d) => (
                  <div
                    key={d.id}
                    className="p-4 flex items-center justify-between hover:bg-stone-50 dark:hover:bg-neutral-900 transition-colors"
                  >
                    <div>
                      <p className="font-medium text-stone-800 dark:text-stone-200">
                        {d.descricao}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="font-mono text-amber-600">
                        {fmt(d.valor, d.tipo)}
                      </span>
                      <div className="flex gap-1">
                        <button
                          className="btn-ghost px-2 py-1 text-xs"
                          onClick={() => {
                            setForm(d);
                            setEditing(d.id);
                            setShowForm(true);
                          }}
                        >
                          Edit
                        </button>
                        <button
                          className="btn-danger px-2 py-1 text-xs"
                          onClick={() => handleDelete(d.id)}
                        >
                          Del
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Lista de Variáveis */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-stone-700 dark:text-stone-300">
                Despesas Variáveis
              </h3>
              <span className="badge bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                Total: {fmt(totalVariaveis, 'variavel')}
              </span>
            </div>
            <div className="card divide-y divide-stone-100 dark:divide-neutral-800">
              {variaveis.length === 0 ? (
                <p className="p-6 text-center text-stone-400">
                  Nenhuma despesa variável
                </p>
              ) : (
                variaveis.map((d) => (
                  <div
                    key={d.id}
                    className="p-4 flex items-center justify-between hover:bg-stone-50 dark:hover:bg-neutral-900 transition-colors"
                  >
                    <div>
                      <p className="font-medium text-stone-800 dark:text-stone-200">
                        {d.descricao}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="font-mono text-blue-600">
                        {fmt(d.valor, d.tipo)}
                      </span>
                      <div className="flex gap-1">
                        <button
                          className="btn-ghost px-2 py-1 text-xs"
                          onClick={() => {
                            setForm(d);
                            setEditing(d.id);
                            setShowForm(true);
                          }}
                        >
                          Edit
                        </button>
                        <button
                          className="btn-danger px-2 py-1 text-xs"
                          onClick={() => handleDelete(d.id)}
                        >
                          Del
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
