'use client';

import { useState, useEffect, useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { calcularMetricasFinanceiras } from '@/utils/finance';
import { CategoryType, ExpenseCategory, FinancialRecord, MonthlyRevenue } from '@/types/finance';

const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

interface EditableRecord {
  id?: number;
  descricao: string;
  valor: number;
  ano: number;
  mes: number;
  categoriaId: number;
}

export default function DespesasPage() {
  const [selectedAno, setSelectedAno] = useState<number>(new Date().getFullYear());
  const [selectedMes, setSelectedMes] = useState<number>(new Date().getMonth() + 1);

  // Database lists
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [revenuesList, setRevenuesList] = useState<MonthlyRevenue[]>([]);

  // Month values
  const [faturamentoInput, setFaturamentoInput] = useState<string>('0');
  const [cmvMetaInput, setCmvMetaInput] = useState<string>('35');
  const [lucroMetaInput, setLucroMetaInput] = useState<string>('20');

  // Dynamic rows form state
  const [records, setRecords] = useState<EditableRecord[]>([]);

  // Category creation inline state
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [newCatNome, setNewCatNome] = useState('');
  const [newCatTipo, setNewCatTipo] = useState<CategoryType>('FIXED');

  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState<{ type: 'success' | 'error' | null, msg: string }>({ type: null, msg: '' });

  // 1. Fetch Categories and Revenues List (runs on load)
  async function loadMetadata() {
    try {
      const [catsRes, revsRes] = await Promise.all([
        fetch('/api/finance/categories'),
        fetch('/api/finance/revenue')
      ]);

      const cats = await catsRes.json();
      const revs = await revsRes.json();

      if (Array.isArray(cats)) setCategories(cats);
      if (Array.isArray(revs)) setRevenuesList(revs);
    } catch (err) {
      console.error('Error loading metadata:', err);
    }
  }

  useEffect(() => {
    loadMetadata();
  }, []);

  // 2. Fetch specific Month records and Revenue
  async function loadMonthData() {
    setIsLoading(true);
    setSaveStatus({ type: null, msg: '' });
    try {
      const [recordsRes, revenueRes] = await Promise.all([
        fetch(`/api/finance/records?ano=${selectedAno}&mes=${selectedMes}`),
        fetch(`/api/finance/revenue?ano=${selectedAno}&mes=${selectedMes}`)
      ]);

      const recordsData = await recordsRes.json();
      const revenueData = await revenueRes.json();

      if (Array.isArray(recordsData)) {
        // Map decimal strings to numbers
        setRecords(recordsData.map((r: any) => ({
          id: r.id,
          descricao: r.descricao,
          valor: Number(r.valor),
          ano: r.ano,
          mes: r.mes,
          categoriaId: r.categoriaId
        })));
      } else {
        setRecords([]);
      }

      if (revenueData && !revenueData.error) {
        setFaturamentoInput(revenueData.faturamento.toString());
        setCmvMetaInput(revenueData.cmvMeta.toString());
        setLucroMetaInput(revenueData.lucroMeta.toString());
      } else {
        setFaturamentoInput('0');
        setCmvMetaInput('35');
        setLucroMetaInput('20');
      }
    } catch (err) {
      console.error('Error loading month data:', err);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadMonthData();
  }, [selectedAno, selectedMes]);

  // 3. Dynamic Form Handlers
  const addRecordRow = (categoriaId: number) => {
    setRecords(prev => [
      ...prev,
      {
        descricao: '',
        valor: 0,
        ano: selectedAno,
        mes: selectedMes,
        categoriaId
      }
    ]);
  };

  const removeRecordRow = (index: number) => {
    setRecords(prev => prev.filter((_, idx) => idx !== index));
  };

  const updateRecordRow = (index: number, field: 'descricao' | 'valor', value: any) => {
    setRecords(prev => prev.map((item, idx) => {
      if (idx === index) {
        return {
          ...item,
          [field]: field === 'valor' ? (parseFloat(value) || 0) : value
        };
      }
      return item;
    }));
  };

  // 4. Create Dynamic Category Handler
  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatNome.trim()) return;

    try {
      const res = await fetch('/api/finance/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome: newCatNome.trim(), tipo: newCatTipo })
      });

      const data = await res.json();
      if (res.ok) {
        setCategories(prev => [...prev, data].sort((a, b) => a.nome.localeCompare(b.nome)));
        setNewCatNome('');
        setIsCreatingCategory(false);
      } else {
        alert(data.error || 'Erro ao criar categoria');
      }
    } catch (err) {
      console.error('Error creating category:', err);
    }
  };

  // 5. Save all inputs for the active month
  const handleSaveAll = async () => {
    setIsLoading(true);
    setSaveStatus({ type: null, msg: '' });

    try {
      // 5.1 Save monthly revenue parameters
      const revenueRes = await fetch('/api/finance/revenue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ano: selectedAno,
          mes: selectedMes,
          faturamento: parseFloat(faturamentoInput) || 0,
          cmvMeta: parseFloat(cmvMetaInput) || 0,
          lucroMeta: parseFloat(lucroMetaInput) || 0
        })
      });

      if (!revenueRes.ok) {
        const errData = await revenueRes.json();
        throw new Error(errData.error || 'Erro ao salvar parâmetros de faturamento');
      }

      // 5.2 Save records
      const recordsRes = await fetch('/api/finance/records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          records.map(r => ({
            descricao: r.descricao || 'Item sem descrição',
            valor: r.valor,
            ano: selectedAno,
            mes: selectedMes,
            categoriaId: r.categoriaId
          }))
        )
      });

      if (!recordsRes.ok) {
        const errData = await recordsRes.json();
        throw new Error(errData.error || 'Erro ao salvar lançamentos de custos');
      }

      setSaveStatus({ type: 'success', msg: 'Gestão Financeira salva com sucesso!' });
      // Reload lists to reflect update in acumulado
      loadMetadata();
      loadMonthData();
    } catch (err: any) {
      setSaveStatus({ type: 'error', msg: err.message || 'Falha ao salvar dados' });
    } finally {
      setIsLoading(false);
    }
  };

  // 6. Real-time Calculations (Reactive to inputs and unsaved form states)
  const faturamentoValor = parseFloat(faturamentoInput) || 0;
  const cmvMetaValor = parseFloat(cmvMetaInput) || 0;
  const lucroMetaValor = parseFloat(lucroMetaInput) || 0;

  // Split records into FIXED and VARIABLE to aggregate
  const aggregatedMetrics = useMemo(() => {
    let custosFixosTotal = 0;
    let custosVariaveisTaxa = 0;

    records.forEach(r => {
      const cat = categories.find(c => c.id === r.categoriaId);
      if (cat) {
        if (cat.tipo === 'FIXED') {
          custosFixosTotal += r.valor;
        } else if (cat.tipo === 'VARIABLE') {
          custosVariaveisTaxa += r.valor;
        }
      }
    });

    return { custosFixosTotal, custosVariaveisTaxa };
  }, [records, categories]);

  const financeCalculations = useMemo(() => {
    return calcularMetricasFinanceiras({
      faturamentoMensal: faturamentoValor,
      custosFixosTotal: aggregatedMetrics.custosFixosTotal,
      custosVariaveisTaxa: aggregatedMetrics.custosVariaveisTaxa,
      cmvMetaTaxa: cmvMetaValor,
      lucroMetaTaxa: lucroMetaValor
    });
  }, [faturamentoValor, aggregatedMetrics, cmvMetaValor, lucroMetaValor]);

  // 7. Faturamento Acumulado Anual calculation
  const faturamentoAcumuladoAnual = useMemo(() => {
    return revenuesList
      .filter(r => r.ano === selectedAno)
      .reduce((sum, r) => sum + Number(r.faturamento), 0);
  }, [revenuesList, selectedAno]);

  // 8. Recharts Donut data source (reactive)
  const pieData = useMemo(() => {
    const data = [
      {
        name: 'Custos Fixos (%DF)',
        value: financeCalculations.percentualDespesasFixas,
        color: '#2563eb' // Blue
      },
      {
        name: 'Custos Variáveis (%DV)',
        value: financeCalculations.percentualDespesasVariaveis,
        color: '#d97706' // Amber
      },
      {
        name: 'CMV Meta (%)',
        value: cmvMetaValor,
        color: '#dc2626' // Red
      },
      {
        name: 'Lucro Desejado (%)',
        value: lucroMetaValor,
        color: '#16a34a' // Green
      }
    ];

    // Se a soma for menor que 100%, preenchemos a "Margem de Contribuição Livre / Buffer"
    const totalSlices = financeCalculations.percentualDespesasFixas + financeCalculations.percentualDespesasVariaveis + cmvMetaValor + lucroMetaValor;
    if (totalSlices < 100) {
      data.push({
        name: 'Margem Excedente (%)',
        value: parseFloat((100 - totalSlices).toFixed(4)),
        color: '#6b7280' // Gray
      });
    }

    return data.filter(slice => slice.value > 0);
  }, [financeCalculations, cmvMetaValor, lucroMetaValor]);

  // Format Helper BRL
  const fmtBRL = (n: number) =>
    n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  // Separate records grouped by category for rendering
  const recordsByCategory = useMemo(() => {
    const grouped: Record<number, typeof records> = {};
    categories.forEach(c => {
      grouped[c.id] = records.filter(r => r.categoriaId === c.id);
    });
    return grouped;
  }, [records, categories]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8 animate-in text-stone-800 dark:text-stone-100">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-stone-900 dark:text-stone-100">
            Gestão Financeira
          </h1>
          <p className="text-stone-500 dark:text-stone-400 text-sm mt-1">
            Planejamento de custos, Markup e Ponto de Equilíbrio.
          </p>
        </div>

        {/* Date Selector */}
        <div className="flex items-center gap-2 bg-white dark:bg-neutral-900 p-1.5 rounded-xl border border-stone-200 dark:border-neutral-800 shadow-sm shrink-0">
          <select
            value={selectedMes}
            onChange={(e) => setSelectedMes(parseInt(e.target.value))}
            className="bg-transparent text-sm font-semibold py-1 px-3 border-none outline-none focus:ring-0 text-stone-700 dark:text-stone-200 cursor-pointer"
          >
            {MONTHS.map((m, idx) => (
              <option key={m} value={idx + 1} className="bg-white dark:bg-neutral-900">
                {m}
              </option>
            ))}
          </select>
          <div className="w-[1px] h-5 bg-stone-200 dark:bg-neutral-800" />
          <select
            value={selectedAno}
            onChange={(e) => setSelectedAno(parseInt(e.target.value))}
            className="bg-transparent text-sm font-semibold py-1 px-3 border-none outline-none focus:ring-0 text-stone-700 dark:text-stone-200 cursor-pointer"
          >
            {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map(year => (
              <option key={year} value={year} className="bg-white dark:bg-neutral-900">
                {year}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Save status message */}
      {saveStatus.type && (
        <div className={`p-4 rounded-xl text-sm border font-medium ${
          saveStatus.type === 'success' 
            ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/50' 
            : 'bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 border-red-200 dark:border-red-900/50'
        }`}>
          {saveStatus.msg}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Faturamento Acumulado */}
        <div className="card p-6 bg-white dark:bg-neutral-900 border border-stone-200 dark:border-neutral-800 shadow-sm rounded-2xl flex flex-col justify-between">
          <div>
            <span className="text-xs text-stone-400 dark:text-stone-500 font-semibold uppercase tracking-wider">
              Faturamento Acumulado ({selectedAno})
            </span>
            <h3 className="font-display text-2xl font-bold mt-1 text-blue-600 dark:text-blue-400">
              {fmtBRL(faturamentoAcumuladoAnual)}
            </h3>
          </div>
          <p className="text-[11px] text-stone-400 dark:text-stone-500 mt-4">
            Soma de todos os faturamentos salvos do ano de {selectedAno}.
          </p>
        </div>

        {/* Card 2: Custos Fixos totais */}
        <div className="card p-6 bg-white dark:bg-neutral-900 border border-stone-200 dark:border-neutral-800 shadow-sm rounded-2xl flex flex-col justify-between">
          <div>
            <span className="text-xs text-stone-400 dark:text-stone-500 font-semibold uppercase tracking-wider">
              Total Custos Fixos (Mês)
            </span>
            <h3 className="font-display text-2xl font-bold mt-1 text-amber-600 dark:text-amber-500">
              {fmtBRL(aggregatedMetrics.custosFixosTotal)}
            </h3>
          </div>
          <p className="text-[11px] text-stone-400 dark:text-stone-500 mt-4">
            Total absoluto de custos fixos lançados na planilha.
          </p>
        </div>

        {/* Card 3: Ponto de Equilibrio */}
        <div className={`card p-6 border shadow-sm rounded-2xl flex flex-col justify-between ${
          financeCalculations.insolvente 
            ? 'bg-red-50/50 dark:bg-red-950/10 border-red-200 dark:border-red-900/50' 
            : 'bg-white dark:bg-neutral-900 border-stone-200 dark:border-neutral-800'
        }`}>
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-stone-400 dark:text-stone-500 font-semibold uppercase tracking-wider">
                Ponto de Equilíbrio
              </span>
              {financeCalculations.insolvente && (
                <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded bg-red-600 text-white animate-pulse">
                  Insolvente
                </span>
              )}
            </div>
            <h3 className={`font-display text-2xl font-bold mt-1 ${
              financeCalculations.insolvente ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-500'
            }`}>
              {financeCalculations.insolvente ? 'Inviável' : fmtBRL(financeCalculations.pontoEquilibrio)}
            </h3>
          </div>
          <p className="text-[11px] text-stone-400 dark:text-stone-500 mt-4">
            {financeCalculations.insolvente 
              ? 'Custos percentuais excedem 100%. Impossível cobrir custos.'
              : 'Faturamento mínimo necessário para cobrir os custos e empatar.'}
          </p>
        </div>
      </div>

      {/* Main Panel grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Left/Middle Columns: Form inputs */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Base Revenue configuration */}
          <div className="p-6 bg-white dark:bg-neutral-900 border border-stone-200 dark:border-neutral-800 rounded-2xl shadow-sm space-y-4">
            <h2 className="text-base font-semibold text-stone-900 dark:text-stone-200 flex items-center gap-2">
              📊 Parâmetros da Receita e Metas
            </h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase mb-1">
                  Faturamento do Mês (R$)
                </label>
                <div className="relative rounded-lg shadow-sm">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <span className="text-stone-400 text-sm">R$</span>
                  </div>
                  <input
                    type="number"
                    value={faturamentoInput}
                    onChange={(e) => setFaturamentoInput(e.target.value)}
                    className="block w-full rounded-lg border border-stone-200 dark:border-neutral-800 bg-transparent py-2 pl-9 pr-3 text-sm focus:border-blue-500 focus:outline-none dark:focus:border-blue-500"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase mb-1">
                  CMV Meta (%)
                </label>
                <div className="relative rounded-lg shadow-sm">
                  <input
                    type="number"
                    value={cmvMetaInput}
                    onChange={(e) => setCmvMetaInput(e.target.value)}
                    className="block w-full rounded-lg border border-stone-200 dark:border-neutral-800 bg-transparent py-2 pl-3 pr-8 text-sm focus:border-blue-500 focus:outline-none dark:focus:border-blue-500"
                    placeholder="0.00"
                  />
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                    <span className="text-stone-400 text-sm">%</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase mb-1">
                  Lucro Desejado (%)
                </label>
                <div className="relative rounded-lg shadow-sm">
                  <input
                    type="number"
                    value={lucroMetaInput}
                    onChange={(e) => setLucroMetaInput(e.target.value)}
                    className="block w-full rounded-lg border border-stone-200 dark:border-neutral-800 bg-transparent py-2 pl-3 pr-8 text-sm focus:border-blue-500 focus:outline-none dark:focus:border-blue-500"
                    placeholder="0.00"
                  />
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                    <span className="text-stone-400 text-sm">%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Dynamic Costs Checklist */}
          <div className="p-6 bg-white dark:bg-neutral-900 border border-stone-200 dark:border-neutral-800 rounded-2xl shadow-sm space-y-6">
            
            <div className="flex items-center justify-between border-b border-stone-200 dark:border-neutral-800 pb-3">
              <div>
                <h2 className="text-base font-semibold text-stone-900 dark:text-stone-200">
                  💸 Lançamento Dinâmico de Custos
                </h2>
                <p className="text-xs text-stone-400 dark:text-stone-500 mt-0.5">
                  Adicione e configure seus itens de custos fixos e taxas de cartão ou impostos.
                </p>
              </div>

              {/* Toggle new category form */}
              <button
                type="button"
                onClick={() => setIsCreatingCategory(!isCreatingCategory)}
                className="px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 text-xs font-semibold hover:bg-blue-100 dark:hover:bg-blue-950/50 transition-colors"
              >
                {isCreatingCategory ? 'Fechar Nova Categoria' : '+ Nova Categoria'}
              </button>
            </div>

            {/* Inline creation form for category */}
            {isCreatingCategory && (
              <form onSubmit={handleCreateCategory} className="p-4 bg-stone-50 dark:bg-neutral-950 border border-stone-200 dark:border-neutral-800 rounded-xl space-y-3">
                <p className="text-xs font-bold text-stone-500 uppercase tracking-wide">Nova Categoria de Despesa</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <input
                    type="text"
                    required
                    value={newCatNome}
                    onChange={(e) => setNewCatNome(e.target.value)}
                    placeholder="Nome (ex: Sacolas, Uber eats)"
                    className="sm:col-span-2 block w-full rounded-lg border border-stone-200 dark:border-neutral-800 bg-transparent py-1.5 px-3 text-xs focus:border-blue-500 focus:outline-none dark:focus:border-blue-500"
                  />
                  <select
                    value={newCatTipo}
                    onChange={(e) => setNewCatTipo(e.target.value as CategoryType)}
                    className="block w-full rounded-lg border border-stone-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 py-1.5 px-3 text-xs focus:border-blue-500 focus:outline-none dark:focus:border-blue-500"
                  >
                    <option value="FIXED">Fixa (R$)</option>
                    <option value="VARIABLE">Variável (%)</option>
                  </select>
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsCreatingCategory(false)}
                    className="px-3 py-1 rounded bg-stone-200 dark:bg-neutral-800 text-stone-600 dark:text-stone-300 text-xs hover:bg-stone-300 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-3 py-1 rounded bg-blue-600 text-white text-xs hover:bg-blue-700 transition-colors font-semibold"
                  >
                    Salvar Categoria
                  </button>
                </div>
              </form>
            )}

            {/* List records grouped by category */}
            {categories.length === 0 ? (
              <div className="text-center py-6 text-stone-400 text-sm">
                Nenhuma categoria cadastrada. Crie uma acima para começar.
              </div>
            ) : (
              <div className="space-y-6">
                {categories.map((category) => {
                  const catRecords = records.filter(r => r.categoriaId === category.id);
                  const isFixed = category.tipo === 'FIXED';
                  
                  return (
                    <div
                      key={category.id}
                      className="border border-stone-100 dark:border-neutral-800/50 rounded-xl p-4 space-y-3 bg-stone-50/50 dark:bg-neutral-900/20"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm text-stone-800 dark:text-stone-200">
                            {category.nome}
                          </span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            isFixed 
                              ? 'bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400' 
                              : 'bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400'
                          }`}>
                            {isFixed ? 'Custo Fixo (R$)' : 'Variável (%)'}
                          </span>
                        </div>
                        
                        <button
                          type="button"
                          onClick={() => addRecordRow(category.id)}
                          className="px-2 py-1 rounded border border-stone-200 dark:border-neutral-800 hover:bg-stone-100 dark:hover:bg-neutral-800 text-xs font-medium text-stone-600 dark:text-stone-300 transition-colors"
                        >
                          + Adicionar Item
                        </button>
                      </div>

                      {/* Records Rows */}
                      {catRecords.length === 0 ? (
                        <p className="text-[11px] text-stone-400 dark:text-stone-500 italic py-1">
                          Nenhum lançamento nesta categoria para o mês.
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {records.map((item, idx) => {
                            if (item.categoriaId !== category.id) return null;

                            return (
                              <div key={idx} className="flex items-center gap-2">
                                <input
                                  type="text"
                                  placeholder="Descrição do custo"
                                  value={item.descricao}
                                  onChange={(e) => updateRecordRow(idx, 'descricao', e.target.value)}
                                  className="flex-1 rounded-lg border border-stone-200 dark:border-neutral-800 bg-transparent py-1 px-3 text-xs focus:border-blue-500 focus:outline-none dark:focus:border-blue-500"
                                />
                                
                                <div className="relative rounded-lg shadow-sm w-36">
                                  {isFixed && (
                                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2.5">
                                      <span className="text-stone-400 text-[10px]">R$</span>
                                    </div>
                                  )}
                                  <input
                                    type="number"
                                    placeholder="0.00"
                                    value={item.valor || ''}
                                    onChange={(e) => updateRecordRow(idx, 'valor', e.target.value)}
                                    className={`block w-full rounded-lg border border-stone-200 dark:border-neutral-800 bg-transparent py-1 text-xs focus:border-blue-500 focus:outline-none dark:focus:border-blue-500 ${
                                      isFixed ? 'pl-7 pr-2.5' : 'pl-2.5 pr-6'
                                    }`}
                                  />
                                  {!isFixed && (
                                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2.5">
                                      <span className="text-stone-400 text-[10px]">%</span>
                                    </div>
                                  )}
                                </div>

                                <button
                                  type="button"
                                  onClick={() => removeRecordRow(idx)}
                                  className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-950/30 text-stone-400 hover:text-red-500 transition-colors"
                                  title="Remover linha"
                                >
                                  ❌
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Save Button */}
            <div className="flex justify-end pt-2 border-t border-stone-200 dark:border-neutral-800">
              <button
                type="button"
                disabled={isLoading}
                onClick={handleSaveAll}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-sm transition-colors disabled:opacity-50"
              >
                {isLoading ? 'Salvando...' : 'Salvar Alterações'}
              </button>
            </div>

          </div>

        </div>

        {/* Right Column: Composition Donut & Formulas summary */}
        <div className="space-y-6">
          
          {/* Donut Pie Chart Card */}
          <div className="p-6 bg-white dark:bg-neutral-900 border border-stone-200 dark:border-neutral-800 rounded-2xl shadow-sm space-y-4">
            <h2 className="text-base font-semibold text-stone-900 dark:text-stone-200">
              🍰 Composição Comercial
            </h2>
            <p className="text-xs text-stone-400 dark:text-stone-500">
              Estrutura de preço baseada em faturamento de {fmtBRL(faturamentoValor)}.
            </p>

            <div className="h-56 flex items-center justify-center">
              {pieData.length === 0 ? (
                <div className="text-stone-400 text-xs italic">Preencha faturamento e custos para gerar o gráfico</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={75}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(v: number) => `${v.toFixed(2)}%`}
                      contentStyle={{ background: '#1c1917', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '11px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Chart Legend */}
            <div className="grid grid-cols-2 gap-2 text-xs pt-2">
              {pieData.map((item) => (
                <div key={item.name} className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                  <span className="text-stone-500 dark:text-stone-400 truncate" title={item.name}>
                    {item.name}: <strong>{item.value.toFixed(1)}%</strong>
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Formulas Output / Calculations details */}
          <div className="p-6 bg-white dark:bg-neutral-900 border border-stone-200 dark:border-neutral-800 rounded-2xl shadow-sm space-y-4">
            <h2 className="text-base font-semibold text-stone-900 dark:text-stone-200">
              🧮 Motor de Markup
            </h2>

            <div className="space-y-3.5 text-xs">
              <div className="flex justify-between items-center py-1.5 border-b border-stone-100 dark:border-neutral-800">
                <span className="text-stone-500 dark:text-stone-400">Total Fixo (%DF)</span>
                <span className="font-semibold text-stone-800 dark:text-stone-200">
                  {financeCalculations.percentualDespesasFixas.toFixed(2)}%
                </span>
              </div>
              
              <div className="flex justify-between items-center py-1.5 border-b border-stone-100 dark:border-neutral-800">
                <span className="text-stone-500 dark:text-stone-400">Total Variável (%DV)</span>
                <span className="font-semibold text-stone-800 dark:text-stone-200">
                  {financeCalculations.percentualDespesasVariaveis.toFixed(2)}%
                </span>
              </div>

              <div className="flex justify-between items-center py-1.5 border-b border-stone-100 dark:border-neutral-800">
                <span className="text-stone-500 dark:text-stone-400">CMV Meta</span>
                <span className="font-semibold text-stone-800 dark:text-stone-200">
                  {cmvMetaValor.toFixed(2)}%
                </span>
              </div>

              <div className="flex justify-between items-center py-1.5 border-b border-stone-100 dark:border-neutral-800">
                <span className="text-stone-500 dark:text-stone-400">Lucro Desejado</span>
                <span className="font-semibold text-stone-800 dark:text-stone-200">
                  {lucroMetaValor.toFixed(2)}%
                </span>
              </div>

              <div className="flex justify-between items-center py-1.5 border-b border-stone-100 dark:border-neutral-800">
                <span className="text-stone-500 dark:text-stone-400">Divisor de Markup</span>
                <span className={`font-semibold ${
                  financeCalculations.insolvente ? 'text-red-500' : 'text-stone-800 dark:text-stone-200'
                }`}>
                  {financeCalculations.divisorMarkup.toFixed(4)}
                </span>
              </div>

              <div className="flex justify-between items-center py-1.5 border-b border-stone-100 dark:border-neutral-800">
                <span className="text-stone-500 dark:text-stone-400">Multiplicador Markup</span>
                <span className="font-bold text-blue-600 dark:text-blue-400">
                  {financeCalculations.insolvente ? 'N/A' : financeCalculations.multiplicadorMarkup.toFixed(2)}
                </span>
              </div>
            </div>

            {financeCalculations.insolvente ? (
              <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 rounded-xl text-[11px] text-red-600 dark:text-red-400 font-medium">
                ⚠️ <strong>Ponto de Insolvência Atingido!</strong> A soma dos percentuais é de <strong>{financeCalculations.custosTotaisCalculados.toFixed(1)}%</strong> (excede 100%). Ajuste os custos, CMV ou reduza a meta de lucro.
              </div>
            ) : (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/50 rounded-xl text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                ✓ <strong>Precificação Viável!</strong> Multiplicador ideal de markup é <strong>{financeCalculations.multiplicadorMarkup.toFixed(2)}x</strong>. Para cada R$ 1,00 de CMV, cobre no mínimo {fmtBRL(financeCalculations.multiplicadorMarkup)}.
              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
}
