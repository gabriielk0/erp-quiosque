'use client';

import { useState, useEffect, useMemo } from 'react';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend,
  ComposedChart, Line
} from 'recharts';
import { CategoryType, ExpenseCategory, FinancialRecord, MonthlyRevenue } from '@/types/finance';

const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

const DEFAULT_FIXED_EXPENSES = [
  { descricao: 'LUZ', valor: 1000 },
  { descricao: 'ÁGUA', valor: 0 },
  { descricao: 'GÁS', valor: 440 },
  { descricao: 'TAXA', valor: 1800 },
  { descricao: 'ALUGUEL', valor: 2000 },
  { descricao: 'SISTEMA', valor: 150 },
  { descricao: 'INTERNET', valor: 100 },
  { descricao: 'MAQUINA', valor: 87 },
  { descricao: 'FUNCIONARIOS', valor: 1800 },
  { descricao: 'GELO', valor: 28 },
  { descricao: 'PROLABORE 1', valor: 0 },
  { descricao: 'PROLABORE 2', valor: 0 },
  { descricao: 'Gasolina', valor: 800 },
  { descricao: 'Alimentação de funcionários', valor: 1900 },
  { descricao: 'Material de limpeza', valor: 100 },
  { descricao: 'CONTADOR', valor: 400 },
  { descricao: 'musica', valor: 600 }
];

const DEFAULT_VARIABLE_EXPENSES = [
  { descricao: 'SIMPLES', valor: 4.5 },
  { descricao: 'METODO DE PAGAMENTO', valor: 1.7 }
];

const DEFAULT_ANNUAL_REVENUES = [
  { mes: 1, faturamento: 0 },
  { mes: 2, faturamento: 0 },
  { mes: 3, faturamento: 80000 },
  { mes: 4, faturamento: 81333.33 },
  { mes: 5, faturamento: 76333.33 },
  { mes: 6, faturamento: 71333.33 },
  { mes: 7, faturamento: 66333.33 },
  { mes: 8, faturamento: 61333.33 },
  { mes: 9, faturamento: 56333.33 },
  { mes: 10, faturamento: 51333.33 },
  { mes: 11, faturamento: 46333.33 },
  { mes: 12, faturamento: 41333.33 }
];

export default function DespesasPage() {
  const [selectedAno, setSelectedAno] = useState<number>(new Date().getFullYear());
  const [selectedMes, setSelectedMes] = useState<number>(new Date().getMonth() + 1);

  // Database lists
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [revenuesList, setRevenuesList] = useState<MonthlyRevenue[]>([]);
  const [records, setRecords] = useState<any[]>([]); // Todos os records do ano

  // Lançamentos do mês selecionado ativos para edição
  const [activeRecords, setActiveRecords] = useState<any[]>([]);


  // Estados de string locais para a edição do Markup (experiência de digitação fluida)
  const [lucroInput, setLucroInput] = useState('18.23');
  const [despesasFixasInput, setDespesasFixasInput] = useState('');
  const [despesasVariaveisInput, setDespesasVariaveisInput] = useState('');
  const [cmvInput, setCmvInput] = useState('');
  const [markupInput, setMarkupInput] = useState('');

  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingData, setIsFetchingData] = useState(true);
  const [saveStatus, setSaveStatus] = useState<{ type: 'success' | 'error' | null, msg: string }>({ type: null, msg: '' });
  const [isChartsExpanded, setIsChartsExpanded] = useState(false);

  // 1. Fetch Categories and Revenues List (runs on load)
  async function loadMetadata() {
    setIsFetchingData(true);
    try {
      const [catsRes, revsRes] = await Promise.all([
        fetch('/api/finance/categories', { cache: 'no-store' }),
        fetch('/api/finance/revenue', { cache: 'no-store' })
      ]);

      let cats = await catsRes.json();
      const revs = await revsRes.json();

      // Ensure both FIXED and VARIABLE category types exist
      const hasFixed = Array.isArray(cats) && cats.some((c: any) => c.tipo === 'FIXED');
      const hasVariable = Array.isArray(cats) && cats.some((c: any) => c.tipo === 'VARIABLE');

      if (!hasFixed || !hasVariable) {
        if (!hasFixed) {
          await fetch('/api/finance/categories', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nome: 'Despesas Fixas', tipo: 'FIXED' })
          });
        }
        if (!hasVariable) {
          await fetch('/api/finance/categories', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nome: 'Despesas Variáveis', tipo: 'VARIABLE' })
          });
        }
        
        const reloadCatsRes = await fetch('/api/finance/categories', { cache: 'no-store' });
        cats = await reloadCatsRes.json();
      }

      if (Array.isArray(cats)) setCategories(cats);
      if (Array.isArray(revs)) setRevenuesList(revs);
    } catch (err) {
      console.error('Error loading metadata:', err);
      setIsFetchingData(false);
    }
  }

  // 2. Fetch records for the selected Year
  async function loadYearData() {
    setIsFetchingData(true);
    setIsLoading(true);
    setSaveStatus({ type: null, msg: '' });
    try {
      const recordsRes = await fetch(`/api/finance/records?ano=${selectedAno}`, { cache: 'no-store' });
      const recordsData = await recordsRes.json();

      if (Array.isArray(recordsData)) {
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
    } catch (err) {
      console.error('Error loading year data:', err);
    } finally {
      setIsLoading(false);
      setIsFetchingData(false);
    }
  }

  useEffect(() => {
    loadMetadata();
  }, []);

  useEffect(() => {
    if (categories.length > 0) {
      loadYearData();
    } else {
      setIsFetchingData(false);
    }
  }, [selectedAno, categories]);

  // 3. Build Active Records of the Month
  useEffect(() => {
    if (isFetchingData) return;
    if (categories.length === 0) return;
    
    const fixedCat = categories.find(c => c.tipo === 'FIXED');
    const variableCat = categories.find(c => c.tipo === 'VARIABLE');
    if (!fixedCat || !variableCat) return;

    const dbFixedRecords = records.filter(
      r => r.ano === selectedAno && r.mes === selectedMes && r.categoriaId === fixedCat.id
    );
    const dbVariableRecords = records.filter(
      r => r.ano === selectedAno && r.mes === selectedMes && r.categoriaId === variableCat.id
    );

    const finalFixed = dbFixedRecords.length > 0 
      ? dbFixedRecords 
      : DEFAULT_FIXED_EXPENSES.map(item => ({
          descricao: item.descricao,
          valor: item.valor,
          ano: selectedAno,
          mes: selectedMes,
          categoriaId: fixedCat.id
        }));

    const finalVariable = dbVariableRecords.length > 0 
      ? dbVariableRecords 
      : DEFAULT_VARIABLE_EXPENSES.map(item => ({
          descricao: item.descricao,
          valor: item.valor,
          ano: selectedAno,
          mes: selectedMes,
          categoriaId: variableCat.id
        }));

    setActiveRecords([...finalFixed, ...finalVariable]);
  }, [records, selectedMes, selectedAno, categories, isFetchingData]);

  // 4. Build 12 months faturamento state
  const annualRevenues = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => {
      const mesNum = i + 1;
      const dbRev = revenuesList.find(r => r.ano === selectedAno && r.mes === mesNum);
      const defaultRev = DEFAULT_ANNUAL_REVENUES.find(d => d.mes === mesNum);
      
      return {
        ano: selectedAno,
        mes: mesNum,
        faturamento: dbRev ? dbRev.faturamento : (defaultRev ? defaultRev.faturamento : 0),
        cmvMeta: dbRev?.cmvMeta !== undefined && dbRev.cmvMeta !== null ? dbRev.cmvMeta : 37.50,
        lucroMeta: dbRev?.lucroMeta !== undefined && dbRev.lucroMeta !== null ? dbRev.lucroMeta : 18.23,
        despesasFixasMeta: dbRev?.despesasFixasMeta ?? null,
        despesasVariaveisMeta: dbRev?.despesasVariaveisMeta ?? null,
        markupMeta: dbRev?.markupMeta ?? null,
        useManualMarkup: dbRev?.useManualMarkup ?? false
      };
    });
  }, [revenuesList, selectedAno]);

  // Tabela anual (Jan a Dez) de faturamento
  const [annualRevenuesState, setAnnualRevenuesState] = useState<any[]>(() => annualRevenues);

  useEffect(() => {
    setAnnualRevenuesState(annualRevenues);
  }, [annualRevenues]);

  // 5. Input Handlers for active month list
  const addRecordRow = (tipo: CategoryType) => {
    const cat = categories.find(c => c.tipo === tipo);
    if (!cat) return;

    setActiveRecords(prev => [
      ...prev,
      {
        descricao: '',
        valor: 0,
        ano: selectedAno,
        mes: selectedMes,
        categoriaId: cat.id
      }
    ]);
  };

  const removeRecordRow = (index: number) => {
    setActiveRecords(prev => prev.filter((_, idx) => idx !== index));
  };

  const updateRecordRow = (index: number, field: 'descricao' | 'valor', value: any) => {
    setActiveRecords(prev => prev.map((item, idx) => {
      if (idx === index) {
        return {
          ...item,
          [field]: field === 'valor' ? (parseFloat(value) || 0) : value
        };
      }
      return item;
    }));
  };

  // 6. Update Faturamento for a month in annual list
  const updateAnnualRevenueValue = (index: number, val: string) => {
    const floatVal = parseFloat(val) || 0;
    setAnnualRevenuesState(prev => prev.map((item, idx) => {
      if (idx === index) {
        return { ...item, faturamento: floatVal };
      }
      return item;
    }));
  };

  // 7. Update Active Month Meta Parameter (Lucro, CMV, manual fields)
  const updateActiveMonthField = (field: string, value: any) => {
    setAnnualRevenuesState(prev => prev.map((item, idx) => {
      if (idx === selectedMes - 1) {
        return { ...item, [field]: value };
      }
      return item;
    }));
  };

  // 8. Calculations for Active Month
  const activeMonthRevenue = useMemo(() => {
    return annualRevenuesState[selectedMes - 1] || {
      faturamento: 0,
      cmvMeta: 37.50,
      lucroMeta: 18.23,
      despesasFixasMeta: null,
      despesasVariaveisMeta: null,
      markupMeta: null,
      useManualMarkup: false
    };
  }, [annualRevenuesState, selectedMes]);

  const faturamentoValor = activeMonthRevenue.faturamento;
  const lucroMetaValor = activeMonthRevenue.lucroMeta;
  const useManualMarkup = activeMonthRevenue.useManualMarkup;

  // Split active month records into fixed and variable totals
  const aggregatedMetrics = useMemo(() => {
    let custosFixosTotal = 0;
    let custosVariaveisTaxa = 0;

    const fixedCat = categories.find(c => c.tipo === 'FIXED');
    const variableCat = categories.find(c => c.tipo === 'VARIABLE');

    activeRecords.forEach(r => {
      if (fixedCat && r.categoriaId === fixedCat.id) {
        custosFixosTotal += r.valor;
      } else if (variableCat && r.categoriaId === variableCat.id) {
        custosVariaveisTaxa += r.valor;
      }
    });

    return { custosFixosTotal, custosVariaveisTaxa };
  }, [activeRecords, categories]);

  // Calculate default dynamic percentages
  const dfPercentCalculado = faturamentoValor > 0 
    ? (aggregatedMetrics.custosFixosTotal / faturamentoValor) * 100 
    : 0;
  const dvPercentCalculado = aggregatedMetrics.custosVariaveisTaxa;
  
  const cmvPercentCalculado = activeMonthRevenue.cmvMeta ?? 37.50;
  const markupCalculado = cmvPercentCalculado > 0 ? 100 / cmvPercentCalculado : 0;

  // Resolve active display metrics
  const dfPercent = activeMonthRevenue.despesasFixasMeta !== null && activeMonthRevenue.despesasFixasMeta !== undefined
    ? activeMonthRevenue.despesasFixasMeta
    : dfPercentCalculado;

  const dvPercent = activeMonthRevenue.despesasVariaveisMeta !== null && activeMonthRevenue.despesasVariaveisMeta !== undefined
    ? activeMonthRevenue.despesasVariaveisMeta
    : dvPercentCalculado;

  const cmvPercent = activeMonthRevenue.cmvMeta !== null && activeMonthRevenue.cmvMeta !== undefined
    ? activeMonthRevenue.cmvMeta
    : 37.50;

  const markupValue = activeMonthRevenue.markupMeta !== null && activeMonthRevenue.markupMeta !== undefined
    ? activeMonthRevenue.markupMeta
    : (cmvPercent > 0 ? 100 / cmvPercent : 0);

  const totalPercent = lucroMetaValor + dfPercent + dvPercent + cmvPercent;

  // 9. Synchronize text inputs local state (only when selected month/year, override toggle, or DB data list changes)
  useEffect(() => {
    if (activeMonthRevenue) {
      setLucroInput(activeMonthRevenue.lucroMeta !== undefined && activeMonthRevenue.lucroMeta !== null 
        ? activeMonthRevenue.lucroMeta.toFixed(2)
        : '18.23');
      
      const dfVal = activeMonthRevenue.despesasFixasMeta !== null && activeMonthRevenue.despesasFixasMeta !== undefined
        ? activeMonthRevenue.despesasFixasMeta
        : dfPercentCalculado;
      setDespesasFixasInput(dfVal.toFixed(2));

      const dvVal = activeMonthRevenue.despesasVariaveisMeta !== null && activeMonthRevenue.despesasVariaveisMeta !== undefined
        ? activeMonthRevenue.despesasVariaveisMeta
        : dvPercentCalculado;
      setDespesasVariaveisInput(dvVal.toFixed(2));

      const cmvVal = activeMonthRevenue.cmvMeta !== null && activeMonthRevenue.cmvMeta !== undefined
        ? activeMonthRevenue.cmvMeta
        : 37.50;
      setCmvInput(cmvVal.toFixed(2));

      const mkVal = activeMonthRevenue.markupMeta !== null && activeMonthRevenue.markupMeta !== undefined
        ? activeMonthRevenue.markupMeta
        : (cmvVal > 0 ? 100 / cmvVal : 0);
      setMarkupInput(mkVal.toFixed(2));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMes, selectedAno, useManualMarkup, revenuesList]);

  const updateActiveMonthFields = (fields: Record<string, any>) => {
    setAnnualRevenuesState(prev => prev.map((item, idx) => {
      if (idx === selectedMes - 1) {
        return { ...item, ...fields };
      }
      return item;
    }));
  };

  // 10. Handlers of manual string input changes (independent typing, no linked updates)
  const handleLucroChange = (val: string) => {
    setLucroInput(val);
    const sanitized = val.replace(',', '.');
    const num = parseFloat(sanitized);
    if (!isNaN(num)) {
      updateActiveMonthFields({ lucroMeta: num });
    } else if (val === '') {
      updateActiveMonthFields({ lucroMeta: 0 });
    }
  };

  const handleDFChange = (val: string) => {
    setDespesasFixasInput(val);
    const sanitized = val.replace(',', '.');
    const num = parseFloat(sanitized);
    if (!isNaN(num)) {
      updateActiveMonthFields({ despesasFixasMeta: num });
    } else if (val === '') {
      updateActiveMonthFields({ despesasFixasMeta: 0 });
    }
  };

  const handleDVChange = (val: string) => {
    setDespesasVariaveisInput(val);
    const sanitized = val.replace(',', '.');
    const num = parseFloat(sanitized);
    if (!isNaN(num)) {
      updateActiveMonthFields({ despesasVariaveisMeta: num });
    } else if (val === '') {
      updateActiveMonthFields({ despesasVariaveisMeta: 0 });
    }
  };

  const handleCmvChange = (val: string) => {
    setCmvInput(val);
    const sanitized = val.replace(',', '.');
    const num = parseFloat(sanitized);
    if (!isNaN(num)) {
      const calculatedMarkup = num > 0 ? 100 / num : 0;
      setMarkupInput(calculatedMarkup > 0 ? calculatedMarkup.toFixed(2) : '0.00');
      updateActiveMonthFields({ 
        cmvMeta: num,
        markupMeta: parseFloat(calculatedMarkup.toFixed(4))
      });
    } else if (val === '') {
      setMarkupInput('0.00');
      updateActiveMonthFields({ 
        cmvMeta: 0,
        markupMeta: 0
      });
    }
  };

  const handleMarkupChange = (val: string) => {
    setMarkupInput(val);
    const sanitized = val.replace(',', '.');
    const num = parseFloat(sanitized);
    if (!isNaN(num)) {
      const calculatedCmv = num > 0 ? 100 / num : 0;
      setCmvInput(calculatedCmv > 0 ? calculatedCmv.toFixed(2) : '0.00');
      updateActiveMonthFields({ 
        markupMeta: num,
        cmvMeta: parseFloat(calculatedCmv.toFixed(4))
      });
    } else if (val === '') {
      setCmvInput('0.00');
      updateActiveMonthFields({ 
        markupMeta: 0,
        cmvMeta: 0
      });
    }
  };

  // 11. Toggle Manual Override
  const toggleManualMarkup = (checked: boolean) => {
    setAnnualRevenuesState(prev => prev.map((item, idx) => {
      if (idx === selectedMes - 1) {
        const lucroMetaVal = item.lucroMeta ?? parseFloat(lucroMetaValor.toFixed(2));
        const dfMetaVal = item.despesasFixasMeta ?? parseFloat(dfPercentCalculado.toFixed(2));
        const dvMetaVal = item.despesasVariaveisMeta ?? parseFloat(dvPercentCalculado.toFixed(2));
        const cmvMetaVal = item.cmvMeta ?? parseFloat(cmvPercentCalculado.toFixed(2));
        const markupMetaVal = item.markupMeta ?? parseFloat((cmvMetaVal > 0 ? 100 / cmvMetaVal : 0).toFixed(2));

        return {
          ...item,
          useManualMarkup: checked,
          cmvMeta: checked ? cmvMetaVal : item.cmvMeta,
          lucroMeta: checked ? lucroMetaVal : item.lucroMeta,
          despesasFixasMeta: checked ? dfMetaVal : item.despesasFixasMeta,
          despesasVariaveisMeta: checked ? dvMetaVal : item.despesasVariaveisMeta,
          markupMeta: checked ? markupMetaVal : item.markupMeta,
        };
      }
      return item;
    }));
  };

  // 12. Save all data (Bulk revenues + active records)
  const handleSaveAll = async () => {
    setIsLoading(true);
    setSaveStatus({ type: null, msg: '' });

    try {
      // 12.1 Save all annual faturamentos and goals for the selected year
      const revenueRes = await fetch('/api/finance/revenue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(annualRevenuesState)
      });

      if (!revenueRes.ok) {
        const errData = await revenueRes.json();
        throw new Error(errData.error || 'Erro ao salvar faturamento anual');
      }

      // 12.2 Save fixed/variable records for the active month
      const recordsRes = await fetch('/api/finance/records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          activeRecords.map(r => ({
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

      setSaveStatus({ type: 'success', msg: 'Gestão Financeira e metas salvas com sucesso!' });
      
      // Reload everything
      await loadMetadata();
      await loadYearData();
    } catch (err: any) {
      setSaveStatus({ type: 'error', msg: err.message || 'Falha ao salvar dados' });
    } finally {
      setIsLoading(false);
    }
  };

  // 13. Dynamic calculations for yearly graphs (based on year data array)
  const monthlyFixedCostsSum = useMemo(() => {
    const sums = Array(12).fill(0);
    const fixedCat = categories.find(c => c.tipo === 'FIXED');
    if (!fixedCat) return sums;

    records.forEach(r => {
      if (r.categoriaId === fixedCat.id && r.mes >= 1 && r.mes <= 12) {
        sums[r.mes - 1] += r.valor;
      }
    });

    // Fallback template for months with zero db records
    const defaultFixedTotal = DEFAULT_FIXED_EXPENSES.reduce((sum, item) => sum + item.valor, 0);

    for (let m = 0; m < 12; m++) {
      const hasRecords = records.some(r => r.mes === m + 1);
      if (!hasRecords) {
        sums[m] = defaultFixedTotal;
      }
    }

    return sums;
  }, [records, categories]);

  const monthlyVariableRatesSum = useMemo(() => {
    const rates = Array(12).fill(0);
    const variableCat = categories.find(c => c.tipo === 'VARIABLE');
    if (!variableCat) return rates;

    records.forEach(r => {
      if (r.categoriaId === variableCat.id && r.mes >= 1 && r.mes <= 12) {
        rates[r.mes - 1] += r.valor;
      }
    });

    const defaultVarTotal = DEFAULT_VARIABLE_EXPENSES.reduce((sum, item) => sum + item.valor, 0);

    for (let m = 0; m < 12; m++) {
      const hasRecords = records.some(r => r.mes === m + 1);
      if (!hasRecords) {
        rates[m] = defaultVarTotal;
      }
    }

    return rates;
  }, [records, categories]);

  // Combined annual graph data
  const yearlyChartData = useMemo(() => {
    return annualRevenuesState.map((r) => {
      const m = r.mes - 1;
      const faturamento = r.faturamento || 0;
      
      const fixedCosts = monthlyFixedCostsSum[m];
      const varRate = r.despesasVariaveisMeta !== null 
        ? r.despesasVariaveisMeta 
        : monthlyVariableRatesSum[m];
      
      const lucroMeta = r.lucroMeta || 18.23;
      
      const dfPercent = r.despesasFixasMeta !== null
        ? r.despesasFixasMeta
        : (faturamento > 0 ? (fixedCosts / faturamento) * 100 : 0);

      const cmvPercent = r.cmvMeta ?? 37.5;

      const mcPercent = Math.max(0, 100 - (varRate + cmvPercent));
      const breakEven = mcPercent > 0 ? fixedCosts / (mcPercent / 100) : 0;

      return {
        name: MONTHS[m].substring(0, 3), // "Jan", "Fev", ...
        'Faturamento': Math.round(faturamento),
        'Ponto de Equilíbrio': Math.round(breakEven)
      };
    });
  }, [annualRevenuesState, monthlyFixedCostsSum, monthlyVariableRatesSum]);

  // Monetary values for active month metrics
  const activeMargemContrib = Math.max(0, 100 - (dvPercent + cmvPercent));
  const activePontoEquilibrio = activeMargemContrib > 0 ? (aggregatedMetrics.custosFixosTotal / (activeMargemContrib / 100)) : 0;
  const activeResultadoEstimado = faturamentoValor * (lucroMetaValor / 100);
  const activeCustoCmvEstimado = faturamentoValor * (cmvPercent / 100);
  const activeCustoVariavelEstimado = faturamentoValor * (dvPercent / 100);
  const activeCustosFixos = aggregatedMetrics.custosFixosTotal;

  // Active month monetary breakdown graph data
  const activeMoneyData = useMemo(() => {
    return [
      { name: 'CMV', 'Valor (R$)': Math.round(activeCustoCmvEstimado), color: '#7030a0' },
      { name: 'Fixo', 'Valor (R$)': Math.round(activeCustosFixos), color: '#c00000' },
      { name: 'Variável', 'Valor (R$)': Math.round(activeCustoVariavelEstimado), color: '#70ad47' },
      { name: 'Lucro Est.', 'Valor (R$)': Math.round(activeResultadoEstimado), color: '#4f81bd' }
    ];
  }, [activeCustoCmvEstimado, activeCustosFixos, activeCustoVariavelEstimado, activeResultadoEstimado]);

  // Total Annual Revenue sum
  const totalAnnualRevenueSum = useMemo(() => {
    return annualRevenuesState.reduce((sum, r) => sum + (r.faturamento || 0), 0);
  }, [annualRevenuesState]);

  // Pie chart data
  const pieData = useMemo(() => {
    return [
      { name: 'Lucro Desejado', value: lucroMetaValor, color: '#4f81bd' },
      { name: 'Despesas Fixas', value: dfPercent, color: '#c00000' },
      { name: 'Despesas Variáveis', value: dvPercent, color: '#70ad47' },
      { name: 'CMV', value: cmvPercent, color: '#7030a0' }
    ].filter(slice => slice.value > 0);
  }, [lucroMetaValor, dfPercent, dvPercent, cmvPercent]);

  // Formatting helpers
  const fmtBRL = (n: number) =>
    n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0, maximumFractionDigits: 0 });

  const fmtBRLPrecise = (n: number) =>
    n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const fmtPercent = (n: number) =>
    n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '%';

  const fixedRecords = useMemo(() => {
    const cat = categories.find(c => c.tipo === 'FIXED');
    return cat ? activeRecords.filter(r => r.categoriaId === cat.id) : [];
  }, [activeRecords, categories]);

  const variableRecords = useMemo(() => {
    const cat = categories.find(c => c.tipo === 'VARIABLE');
    return cat ? activeRecords.filter(r => r.categoriaId === cat.id) : [];
  }, [activeRecords, categories]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6 text-stone-800 dark:text-stone-100">
      
      {/* Header & Save Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-stone-200 dark:border-neutral-800 shadow-sm">
        <div>
          <h1 className="font-display text-2xl font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
            📊 Gestão de Margem e Despesas
          </h1>
          <p className="text-stone-500 dark:text-stone-400 text-xs mt-0.5">
            Analise despesas fixas, variáveis, faturamento anual, metas comerciais e markup da sua operação.
          </p>
        </div>

        <div className="flex items-center gap-3 self-end md:self-auto">
          {/* Month/Year selector */}
          <div className="flex items-center gap-1.5 bg-stone-50 dark:bg-neutral-950 p-1 rounded-xl border border-stone-200 dark:border-neutral-800">
            <select
              value={selectedMes}
              onChange={(e) => setSelectedMes(parseInt(e.target.value))}
              className="bg-transparent text-xs font-semibold py-1 px-2 border-none outline-none focus:ring-0 text-stone-700 dark:text-stone-200 cursor-pointer"
            >
              {MONTHS.map((m, idx) => (
                <option key={m} value={idx + 1} className="bg-white dark:bg-neutral-900 text-stone-800 dark:text-stone-100">
                  {m}
                </option>
              ))}
            </select>
            <div className="w-[1px] h-4 bg-stone-200 dark:bg-neutral-800" />
            <select
              value={selectedAno}
              onChange={(e) => setSelectedAno(parseInt(e.target.value))}
              className="bg-transparent text-xs font-semibold py-1 px-2 border-none outline-none focus:ring-0 text-stone-700 dark:text-stone-200 cursor-pointer"
            >
              {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map(year => (
                <option key={year} value={year} className="bg-white dark:bg-neutral-900 text-stone-800 dark:text-stone-100">
                  {year}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            disabled={isLoading || isFetchingData}
            onClick={handleSaveAll}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-sm transition-all hover:scale-[1.02] disabled:opacity-50 flex items-center gap-1.5"
          >
            {isLoading ? 'Salvando...' : isFetchingData ? 'Carregando...' : '💾 Salvar Alterações'}
          </button>
        </div>
      </div>

      {/* Save status message */}
      {saveStatus.type && (
        <div className={`p-3.5 rounded-xl text-xs border font-medium transition-all animate-in fade-in-50 duration-200 ${
          saveStatus.type === 'success' 
            ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/50' 
            : 'bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 border-red-200 dark:border-red-900/50'
        }`}>
          {saveStatus.type === 'success' ? '✓ ' : '⚠️ '} {saveStatus.msg}
        </div>
      )}

      {/* Abas e Painel Expansível de Gráficos Analíticos */}
      <div className="bg-white dark:bg-neutral-900 border border-stone-200 dark:border-neutral-800 rounded-2xl shadow-sm overflow-hidden transition-all duration-300">
        <button
          type="button"
          onClick={() => setIsChartsExpanded(!isChartsExpanded)}
          className="w-full flex items-center justify-between p-4 hover:bg-stone-50 dark:hover:bg-neutral-800/40 transition-colors text-left focus:outline-none"
        >
          <div className="flex items-center gap-2">
            <span className="text-lg">📊</span>
            <div>
              <span className="font-display text-sm font-bold text-stone-900 dark:text-stone-100">
                Gráficos Extras de Análise e Projeção Financeira
              </span>
              <span className="block text-[10px] text-stone-450 dark:text-stone-500 mt-0.5">
                {isChartsExpanded ? 'Clique para ocultar as projeções e gráficos extras' : 'Clique para visualizar a evolução anual e divisão de custos estimada'}
              </span>
            </div>
          </div>
          <span className={`text-stone-400 text-xs transition-transform duration-300 ${isChartsExpanded ? 'rotate-180' : ''}`}>
            ▼
          </span>
        </button>

        {isChartsExpanded && (
          <div className="p-4 border-t border-stone-150 dark:border-neutral-800 bg-stone-50/50 dark:bg-neutral-950/10 grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in duration-300">
            {/* Gráfico 1: Divisão de Custos do Mês (R$) */}
            <div className="bg-white dark:bg-neutral-900 border border-stone-200 dark:border-neutral-800 rounded-xl p-4 space-y-3 shadow-xs">
              <h3 className="text-center font-display text-xs font-bold text-stone-800 dark:text-stone-200 uppercase tracking-wider">
                Divisão de Custos do Mês ({MONTHS[selectedMes - 1]} - R$)
              </h3>
              <div className="h-56 w-full">
                {faturamentoValor === 0 ? (
                  <div className="h-full flex items-center justify-center text-stone-400 text-xs italic">
                    Defina um faturamento para ver a projeção em reais.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={activeMoneyData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e5e5" className="dark:stroke-neutral-800" />
                      <XAxis dataKey="name" tick={{ fontSize: 9 }} stroke="#888888" />
                      <YAxis tickFormatter={(v) => `R$${v}`} tick={{ fontSize: 9 }} stroke="#888888" />
                      <Tooltip 
                        formatter={(v: number) => fmtBRLPrecise(v)}
                        contentStyle={{ background: '#1c1917', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '10px' }}
                      />
                      <Bar dataKey="Valor (R$)" radius={[4, 4, 0, 0]}>
                        {activeMoneyData.map((entry, idx) => (
                          <Cell key={`cell-${idx}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Gráfico 2: Evolução Anual: Faturamento vs Ponto de Equilíbrio */}
            <div className="bg-white dark:bg-neutral-900 border border-stone-200 dark:border-neutral-800 rounded-xl p-4 space-y-3 shadow-xs">
              <h3 className="text-center font-display text-xs font-bold text-stone-800 dark:text-stone-200 uppercase tracking-wider">
                Evolução Anual: Faturamento vs Ponto de Equilíbrio
              </h3>
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={yearlyChartData} margin={{ top: 10, right: 10, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" className="dark:stroke-neutral-800" />
                    <XAxis dataKey="name" stroke="#888888" tick={{ fontSize: 9 }} />
                    <YAxis tickFormatter={(v) => `R$ ${v / 1000}k`} stroke="#888888" tick={{ fontSize: 9 }} />
                    <Tooltip 
                      formatter={(v: number) => fmtBRLPrecise(v)}
                      contentStyle={{ background: '#1c1917', border: 'none', borderRadius: '12px', color: '#fff', fontSize: '11px' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '9px' }} />
                    <Bar dataKey="Faturamento" fill="#4f81bd" radius={[4, 4, 0, 0]} maxBarSize={30} />
                    <Line type="monotone" dataKey="Ponto de Equilíbrio" stroke="#c00000" strokeWidth={2.5} dot={{ r: 2.5 }} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Excel Sheet Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
        
        {/* COLUNA 1: Despesas Fixas (Esquerda) */}
        <div className="bg-white dark:bg-neutral-900 border border-stone-200 dark:border-neutral-800 rounded-2xl shadow-sm overflow-hidden transition-all duration-300 hover:shadow-md">
          {/* Table Header Row 1 */}
          <div className="bg-red-50 dark:bg-red-950/40 px-4 py-3 flex justify-between items-center text-red-800 dark:text-red-300 font-bold border-b border-red-100 dark:border-red-900/30">
            <span className="text-sm font-display uppercase tracking-wide text-red-900 dark:text-red-250">Despesas Fixas</span>
            <span className="text-base font-mono text-red-950 dark:text-red-100">{fmtBRLPrecise(aggregatedMetrics.custosFixosTotal)}</span>
          </div>
          {/* Table Header Row 2 */}
          <div className="bg-stone-100 dark:bg-neutral-800/80 px-4 py-1.5 grid grid-cols-12 text-[10px] font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wide border-b border-stone-200 dark:border-neutral-800">
            <span className="col-span-8">Descrição</span>
            <span className="col-span-4 text-right">R$</span>
          </div>

          {/* Table Body */}
          <div className="p-3 space-y-1.5 max-h-[600px] overflow-y-auto">
            {fixedRecords.length === 0 ? (
              <p className="text-xs text-stone-400 dark:text-stone-500 italic py-4 text-center">
                Nenhum custo fixo lançado.
              </p>
            ) : (
              activeRecords.map((item, idx) => {
                const isFixedCat = categories.find(c => c.id === item.categoriaId)?.tipo === 'FIXED';
                if (!isFixedCat) return null;

                return (
                  <div key={idx} className="group grid grid-cols-12 gap-2 items-center hover:bg-stone-50 dark:hover:bg-neutral-800/40 p-1 rounded-lg transition-all duration-150">
                    <input
                      type="text"
                      placeholder="Descrição da despesa fixa"
                      value={item.descricao}
                      onChange={(e) => updateRecordRow(idx, 'descricao', e.target.value)}
                      className="col-span-8 bg-transparent border border-transparent hover:border-stone-300 focus:border-stone-400 dark:hover:border-neutral-700 dark:focus:border-neutral-600 rounded-md py-1 px-2 text-xs focus:outline-none text-stone-800 dark:text-stone-200 focus:bg-white dark:focus:bg-neutral-950 transition-all font-medium"
                    />
                    
                    <div className="col-span-3 relative rounded-md">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-1.5">
                        <span className="text-[10px] text-stone-400">R$</span>
                      </div>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="0,00"
                        value={item.valor || ''}
                        onChange={(e) => updateRecordRow(idx, 'valor', e.target.value)}
                        className="w-full text-right bg-transparent border border-transparent hover:border-stone-300 focus:border-stone-400 dark:hover:border-neutral-700 dark:focus:border-neutral-600 rounded-md py-1 pl-5 pr-1.5 text-xs font-mono focus:outline-none text-stone-800 dark:text-stone-200 focus:bg-white dark:focus:bg-neutral-950 transition-all"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => removeRecordRow(idx)}
                      className="col-span-1 text-center text-[10px] opacity-0 group-hover:opacity-100 text-stone-400 hover:text-red-500 transition-all duration-150"
                      title="Excluir despesa"
                    >
                      ❌
                    </button>
                  </div>
                );
              })
            )}
          </div>

          <div className="p-3 bg-stone-50 dark:bg-neutral-900/50 border-t border-stone-200 dark:border-neutral-800 flex justify-end">
            <button
              type="button"
              onClick={() => addRecordRow('FIXED')}
              className="px-2.5 py-1.5 rounded-lg border border-stone-200 dark:border-neutral-800 hover:bg-white dark:hover:bg-neutral-800 text-[10px] font-bold text-stone-600 dark:text-stone-300 shadow-sm transition-all"
            >
              ➕ Adicionar Despesa Fixa
            </button>
          </div>
        </div>

        {/* COLUNA 2: Despesas Variáveis & Faturamento do Ano (Centro) */}
        <div className="space-y-6">
          
          {/* Despesas Variáveis */}
          <div className="bg-white dark:bg-neutral-900 border border-stone-200 dark:border-neutral-800 rounded-2xl shadow-sm overflow-hidden transition-all duration-300 hover:shadow-md">
            {/* Header Row 1 */}
            <div className="bg-red-50 dark:bg-red-950/40 px-4 py-3 flex justify-between items-center text-red-800 dark:text-red-300 font-bold border-b border-red-100 dark:border-red-900/30">
              <span className="text-sm font-display uppercase tracking-wide text-red-900 dark:text-red-250">Despesas Variáveis</span>
              <span className="text-base font-mono text-red-950 dark:text-red-100">{fmtPercent(aggregatedMetrics.custosVariaveisTaxa)}</span>
            </div>
            {/* Header Row 2 */}
            <div className="bg-stone-100 dark:bg-neutral-800/80 px-4 py-1.5 grid grid-cols-12 text-[10px] font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wide border-b border-stone-200 dark:border-neutral-800">
              <span className="col-span-8">Descrição</span>
              <span className="col-span-4 text-right">%</span>
            </div>

            {/* Table Body */}
            <div className="p-3 space-y-1.5 max-h-[250px] overflow-y-auto">
              {variableRecords.length === 0 ? (
                <p className="text-xs text-stone-400 dark:text-stone-500 italic py-4 text-center">
                  Nenhum custo variável lançado.
                </p>
              ) : (
                activeRecords.map((item, idx) => {
                  const isVarCat = categories.find(c => c.id === item.categoriaId)?.tipo === 'VARIABLE';
                  if (!isVarCat) return null;

                  return (
                    <div key={idx} className="group grid grid-cols-12 gap-2 items-center hover:bg-stone-50 dark:hover:bg-neutral-800/40 p-1 rounded-lg transition-all duration-150">
                      <input
                        type="text"
                        placeholder="Descrição da despesa variável"
                        value={item.descricao}
                        onChange={(e) => updateRecordRow(idx, 'descricao', e.target.value)}
                        className="col-span-8 bg-transparent border border-transparent hover:border-stone-300 focus:border-stone-400 dark:hover:border-neutral-700 dark:focus:border-neutral-600 rounded-md py-1 px-2 text-xs focus:outline-none text-stone-800 dark:text-stone-200 focus:bg-white dark:focus:bg-neutral-950 transition-all font-medium"
                      />
                      
                      <div className="col-span-3 relative rounded-md">
                        <input
                          type="number"
                          step="0.01"
                          placeholder="0,00"
                          value={item.valor || ''}
                          onChange={(e) => updateRecordRow(idx, 'valor', e.target.value)}
                          className="w-full text-right bg-transparent border border-transparent hover:border-stone-300 focus:border-stone-400 dark:hover:border-neutral-700 dark:focus:border-neutral-600 rounded-md py-1 pl-1.5 pr-5 text-xs font-mono focus:outline-none text-stone-800 dark:text-stone-200 focus:bg-white dark:focus:bg-neutral-950 transition-all"
                        />
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-1.5">
                          <span className="text-[10px] text-stone-400">%</span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeRecordRow(idx)}
                        className="col-span-1 text-center text-[10px] opacity-0 group-hover:opacity-100 text-stone-400 hover:text-red-500 transition-all duration-150"
                        title="Excluir despesa"
                      >
                        ❌
                      </button>
                    </div>
                  );
                })
              )}
            </div>

            <div className="p-3 bg-stone-50 dark:bg-neutral-900/50 border-t border-stone-200 dark:border-neutral-800 flex justify-end">
              <button
                type="button"
                onClick={() => addRecordRow('VARIABLE')}
                className="px-2.5 py-1.5 rounded-lg border border-stone-200 dark:border-neutral-800 hover:bg-white dark:hover:bg-neutral-800 text-[10px] font-bold text-stone-600 dark:text-stone-300 shadow-sm transition-all"
              >
                ➕ Adicionar Despesa Variável
              </button>
            </div>
          </div>

          {/* Faturamento do Ano */}
          <div className="bg-white dark:bg-neutral-900 border border-stone-200 dark:border-neutral-800 rounded-2xl shadow-sm overflow-hidden transition-all duration-300 hover:shadow-md">
            {/* Header */}
            <div className="bg-stone-200 dark:bg-neutral-800 px-4 py-3 flex justify-between items-center text-stone-800 dark:text-stone-200 font-bold border-b border-stone-300 dark:border-neutral-700">
              <span className="text-sm font-display uppercase tracking-wide">Faturamento do Ano</span>
              <span className="text-xs text-stone-450 dark:text-stone-550 font-normal">Clique no mês para trabalhar</span>
            </div>
            {/* Header 2 */}
            <div className="bg-stone-100 dark:bg-neutral-800/40 px-4 py-1 grid grid-cols-12 text-[10px] font-bold text-stone-500 uppercase tracking-wide border-b border-stone-200 dark:border-neutral-800">
              <span className="col-span-8">Mês Faturamento</span>
              <span className="col-span-4 text-right">R$</span>
            </div>

            {/* List */}
            <div className="p-2 space-y-0.5">
              {annualRevenuesState.map((r, index) => {
                const isActive = r.mes === selectedMes;
                return (
                  <div 
                    key={r.mes} 
                    onClick={() => setSelectedMes(r.mes)}
                    className={`grid grid-cols-12 gap-2 items-center p-1 rounded-lg transition-all duration-150 cursor-pointer ${
                      isActive 
                        ? 'bg-blue-50/50 dark:bg-blue-950/20 outline outline-1 outline-blue-400 dark:outline-blue-800' 
                        : 'hover:bg-stone-50 dark:hover:bg-neutral-800/30'
                    }`}
                  >
                    <span className="col-span-8 text-xs font-semibold text-stone-600 dark:text-stone-300 pl-2">
                      {MONTHS[r.mes - 1]}
                    </span>
                    <div className="col-span-4 relative rounded-md" onClick={(e) => e.stopPropagation()}>
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-1.5">
                        <span className="text-[10px] text-stone-400">R$</span>
                      </div>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="-"
                        value={r.faturamento || ''}
                        onChange={(e) => updateAnnualRevenueValue(index, e.target.value)}
                        className={`w-full text-right bg-transparent border border-transparent hover:border-stone-300 focus:border-stone-400 dark:hover:border-neutral-700 dark:focus:border-neutral-600 rounded-md py-0.5 pl-5 pr-1.5 text-xs font-mono focus:outline-none ${
                          isActive ? 'text-blue-600 dark:text-blue-400 font-bold' : 'text-stone-700 dark:text-stone-200'
                        } focus:bg-white dark:focus:bg-neutral-950`}
                      />
                    </div>
                  </div>
                );
              })}

              {/* Total Row */}
              <div className="grid grid-cols-12 gap-2 items-center p-2 rounded-lg border-t border-stone-200 dark:border-neutral-800 font-bold bg-stone-50 dark:bg-neutral-950/50 mt-2">
                <span className="col-span-7 text-xs text-stone-900 dark:text-stone-200">Total</span>
                <span className="col-span-5 text-right text-xs font-mono text-stone-900 dark:text-stone-100">
                  {fmtBRL(totalAnnualRevenueSum)}
                </span>
              </div>
            </div>
          </div>

          {/* Box Calculo para Despesas Variaveis */}
          <div className="flex justify-between items-center bg-stone-50 dark:bg-neutral-950 border border-stone-200 dark:border-neutral-800 rounded-xl p-3.5 text-xs font-semibold text-stone-600 dark:text-stone-400">
            <span>Calculo para Despesas Variáveis</span>
            <div className="text-right">
              <span className="block text-stone-400 text-[10px] font-mono">Total Base</span>
              <span className="font-mono text-stone-800 dark:text-stone-200">100</span>
            </div>
          </div>

        </div>

        {/* COLUNA 3: Markup Card, Pie Chart & Métricas (Direita) */}
        <div className="space-y-6">
          
          {/* Markup Card */}
          <div className="bg-white dark:bg-neutral-900 border border-stone-200 dark:border-neutral-800 rounded-2xl shadow-sm overflow-hidden transition-all duration-300 hover:shadow-md">
            {/* Header */}
            <div className="bg-[#4f81bd] px-4 py-3 flex justify-between items-center text-white font-bold border-b border-[#3b6ea5]">
              <span className="text-sm font-display uppercase tracking-wide">Mark up</span>
              <span className="text-base font-mono">{markupValue > 0 ? markupValue.toFixed(2) : '-'}</span>
            </div>

            <div className="p-4 space-y-4">
              {/* Manual mode checkbox */}
              <label className="flex items-center gap-2 bg-stone-50 dark:bg-neutral-950 p-2.5 rounded-xl border border-stone-100 dark:border-neutral-800/80 cursor-pointer">
                <input
                  type="checkbox"
                  checked={useManualMarkup}
                  onChange={(e) => toggleManualMarkup(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500 border-stone-300 dark:border-neutral-800"
                />
                <div className="text-left">
                  <span className="block text-[11px] font-bold text-stone-700 dark:text-stone-300">Sobrescrever Métricas (Modo Manual)</span>
                  <span className="block text-[9px] text-stone-400">Permite editar os percentuais e o Markup manualmente.</span>
                </div>
              </label>

              {/* Input Fields */}
              <div className="space-y-3">
                {/* Lucro Desejado */}
                <div className="flex justify-between items-center py-1 border-b border-stone-100 dark:border-neutral-800/50">
                  <span className="text-xs text-stone-500 font-medium">Lucro Desejado</span>
                  <div className="relative w-28">
                    <input
                      type="text"
                      disabled={!useManualMarkup}
                      value={lucroInput}
                      onChange={(e) => handleLucroChange(e.target.value)}
                      className={`w-full text-right bg-transparent border border-transparent rounded-md py-0.5 pl-1.5 pr-5 text-xs font-mono font-bold focus:outline-none focus:bg-stone-50 dark:focus:bg-neutral-950 text-blue-600 dark:text-blue-400 ${
                        useManualMarkup ? 'hover:border-stone-300 dark:hover:border-neutral-800 cursor-text' : 'cursor-not-allowed opacity-80'
                      }`}
                    />
                    <span className="absolute inset-y-0 right-1.5 flex items-center text-[10px] text-stone-400 font-mono">%</span>
                  </div>
                </div>

                {/* Despesas Fixas */}
                <div className="flex justify-between items-center py-1 border-b border-stone-100 dark:border-neutral-800/50">
                  <span className="text-xs text-stone-500 font-medium">Despesas Fixas</span>
                  <div className="relative w-28">
                    <input
                      type="text"
                      disabled={!useManualMarkup}
                      value={despesasFixasInput}
                      onChange={(e) => handleDFChange(e.target.value)}
                      className={`w-full text-right bg-transparent border border-transparent rounded-md py-0.5 pl-1.5 pr-5 text-xs font-mono font-bold focus:outline-none focus:bg-stone-50 dark:focus:bg-neutral-950 text-[#c00000] ${
                        useManualMarkup ? 'hover:border-stone-300 dark:hover:border-neutral-800 cursor-text' : 'cursor-not-allowed opacity-80'
                      }`}
                    />
                    <span className="absolute inset-y-0 right-1.5 flex items-center text-[10px] text-stone-400 font-mono">%</span>
                  </div>
                </div>

                {/* Despesas Variaveis */}
                <div className="flex justify-between items-center py-1 border-b border-stone-100 dark:border-neutral-800/50">
                  <span className="text-xs text-stone-500 font-medium">Despesas Variáveis</span>
                  <div className="relative w-28">
                    <input
                      type="text"
                      disabled={!useManualMarkup}
                      value={despesasVariaveisInput}
                      onChange={(e) => handleDVChange(e.target.value)}
                      className={`w-full text-right bg-transparent border border-transparent rounded-md py-0.5 pl-1.5 pr-5 text-xs font-mono font-bold focus:outline-none focus:bg-stone-50 dark:focus:bg-neutral-950 text-[#70ad47] ${
                        useManualMarkup ? 'hover:border-stone-300 dark:hover:border-neutral-800 cursor-text' : 'cursor-not-allowed opacity-80'
                      }`}
                    />
                    <span className="absolute inset-y-0 right-1.5 flex items-center text-[10px] text-stone-400 font-mono">%</span>
                  </div>
                </div>

                {/* Custo Max c/ Producao - CMV */}
                <div className="flex justify-between items-center py-1 border-b border-stone-100 dark:border-neutral-800/50">
                  <span className="text-xs text-stone-500 font-medium">Custo Máx c/ Produção - CMV</span>
                  <div className="relative w-28">
                    <input
                      type="text"
                      disabled={!useManualMarkup}
                      value={cmvInput}
                      onChange={(e) => handleCmvChange(e.target.value)}
                      className={`w-full text-right bg-transparent border border-transparent rounded-md py-0.5 pl-1.5 pr-5 text-xs font-mono font-bold focus:outline-none focus:bg-stone-50 dark:focus:bg-neutral-950 text-[#7030a0] ${
                        useManualMarkup ? 'hover:border-stone-300 dark:hover:border-neutral-800 cursor-text' : 'cursor-not-allowed opacity-80'
                      }`}
                    />
                    <span className="absolute inset-y-0 right-1.5 flex items-center text-[10px] text-stone-400 font-mono">%</span>
                  </div>
                </div>

                {/* Multiplicador Markup */}
                <div className="flex justify-between items-center py-1 border-b border-stone-100 dark:border-neutral-800/50">
                  <span className="text-xs text-stone-500 font-medium font-bold">Multiplicador Markup</span>
                  <div className="relative w-28">
                    <input
                      type="text"
                      disabled={!useManualMarkup}
                      value={markupInput}
                      onChange={(e) => handleMarkupChange(e.target.value)}
                      className={`w-full text-right bg-transparent border border-transparent rounded-md py-0.5 pl-1.5 pr-5 text-xs font-mono font-bold focus:outline-none focus:bg-stone-50 dark:focus:bg-neutral-950 text-stone-800 dark:text-stone-200 ${
                        useManualMarkup ? 'hover:border-stone-300 dark:hover:border-neutral-800 cursor-text' : 'cursor-not-allowed opacity-80'
                      }`}
                    />
                    <span className="absolute inset-y-0 right-1.5 flex items-center text-[10px] text-stone-400 font-mono">x</span>
                  </div>
                </div>

                {/* Total */}
                <div className="flex justify-between items-center py-2 font-bold text-stone-900 dark:text-stone-200 mt-2 bg-stone-50 dark:bg-neutral-950/30 p-1.5 rounded-lg">
                  <span className="text-xs uppercase tracking-wide">Total</span>
                  <span className={`text-xs font-mono ${Math.abs(totalPercent - 100) > 0.05 ? 'text-red-500' : 'text-stone-900 dark:text-stone-100'}`}>
                    {fmtPercent(totalPercent)}
                  </span>
                </div>
              </div>

              {/* Warnings */}
              {Math.abs(totalPercent - 100) > 0.05 && (
                <div className="p-2.5 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 rounded-xl text-[10px] text-amber-700 dark:text-amber-400 font-medium animate-pulse">
                  ⚠️ A soma dos percentuais é de <strong>{totalPercent.toFixed(2)}%</strong>. O total ideal deve ser exatamente <strong>100,00%</strong>. Ajuste os valores para obter o equilíbrio comercial.
                </div>
              )}
            </div>
          </div>

          {/* Gráfico de Composição (Percentual) */}
          <div className="bg-white dark:bg-neutral-900 border border-stone-200 dark:border-neutral-800 rounded-2xl shadow-sm p-4 space-y-3 transition-all duration-300 hover:shadow-md">
            <h2 className="text-center font-display text-xs font-bold text-stone-800 dark:text-stone-200 uppercase tracking-wider">
              Composição da Margem (%)
            </h2>

            <div className="h-40 flex items-center justify-center">
              {pieData.length === 0 ? (
                <div className="text-stone-400 text-xs italic">Aguardando dados...</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={58}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(v: number) => `${v.toFixed(2)}%`}
                      contentStyle={{ background: '#1c1917', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '10px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Custom Grid Legend */}
            <div className="grid grid-cols-2 gap-2 text-[9px]">
              <div className="flex items-center gap-1">
                <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: '#4f81bd' }} />
                <span className="text-stone-500 dark:text-stone-400">Lucro: <strong>{lucroMetaValor.toFixed(2)}%</strong></span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: '#c00000' }} />
                <span className="text-stone-500 dark:text-stone-400">Fixo: <strong>{dfPercent.toFixed(2)}%</strong></span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: '#70ad47' }} />
                <span className="text-stone-500 dark:text-stone-400">Var.: <strong>{dvPercent.toFixed(2)}%</strong></span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: '#7030a0' }} />
                <span className="text-stone-500 dark:text-stone-400">CMV: <strong>{cmvPercent.toFixed(2)}%</strong></span>
              </div>
            </div>
          </div>

          {/* NOVAS MÉTRICAS: Painel de Indicadores Financeiros */}
          <div className="bg-white dark:bg-neutral-900 border border-stone-200 dark:border-neutral-800 rounded-2xl shadow-sm p-4 space-y-3.5 transition-all duration-300 hover:shadow-md">
            <h2 className="font-display text-xs font-bold text-stone-800 dark:text-stone-200 uppercase tracking-wider border-b border-stone-100 dark:border-neutral-850 pb-2">
              📊 Indicadores de Viabilidade
            </h2>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-stone-50 dark:bg-neutral-950 p-2.5 rounded-xl border border-stone-100 dark:border-neutral-800">
                <span className="block text-[9px] text-stone-400 font-bold uppercase">Margem Contribuição</span>
                <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 font-mono">{fmtPercent(activeMargemContrib)}</span>
              </div>
              <div className="bg-stone-50 dark:bg-neutral-950 p-2.5 rounded-xl border border-stone-100 dark:border-neutral-800">
                <span className="block text-[9px] text-stone-400 font-bold uppercase">Ponto de Equilíbrio</span>
                <span className="text-sm font-bold text-stone-800 dark:text-stone-200 font-mono">{fmtBRL(activePontoEquilibrio)}</span>
              </div>
              <div className="bg-stone-50 dark:bg-neutral-950 p-2.5 rounded-xl border border-stone-100 dark:border-neutral-800 col-span-2">
                <span className="block text-[9px] text-stone-400 font-bold uppercase">Lucro Líquido Estimado</span>
                <span className={`text-base font-bold font-mono ${activeResultadoEstimado >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-red-500'}`}>
                  {fmtBRLPrecise(activeResultadoEstimado)}
                </span>
              </div>
            </div>

            <div className="text-[10px] text-stone-400 space-y-1.5 bg-stone-50/50 dark:bg-neutral-950/20 p-2.5 rounded-xl">
              <div className="flex justify-between">
                <span>Custo CMV Limite:</span>
                <span className="font-mono font-semibold text-stone-600 dark:text-stone-300">{fmtBRLPrecise(activeCustoCmvEstimado)}</span>
              </div>
              <div className="flex justify-between">
                <span>Despesa Variável Limite:</span>
                <span className="font-mono font-semibold text-stone-600 dark:text-stone-300">{fmtBRLPrecise(activeCustoVariavelEstimado)}</span>
              </div>
              <div className="flex justify-between">
                <span>Despesa Fixa Absoluta:</span>
                <span className="font-mono font-semibold text-stone-600 dark:text-stone-300">{fmtBRLPrecise(activeCustosFixos)}</span>
              </div>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
