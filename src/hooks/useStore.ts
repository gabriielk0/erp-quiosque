'use client';
import { useState, useEffect, useCallback } from 'react';
import type { AppState, Insumo, Produto, Venda } from '@/types';

const STORAGE_KEY = 'kiosk_erp_v1';

const defaultState: AppState = {
  insumos: [],
  produtos: [],
  vendas: [],
};

function loadState(): AppState {
  if (typeof window === 'undefined') return defaultState;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : defaultState;
  } catch {
    return defaultState;
  }
}

function saveState(state: AppState) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function useStore() {
  const [state, setState] = useState<AppState>(defaultState);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setState(loadState());
    setHydrated(true);
  }, []);

  const update = useCallback((updater: (s: AppState) => AppState) => {
    setState(prev => {
      const next = updater(prev);
      saveState(next);
      return next;
    });
  }, []);

  // --- Insumos ---
  const addInsumo = (insumo: Omit<Insumo, 'id' | 'criadoEm'>) =>
    update(s => ({
      ...s,
      insumos: [...s.insumos, { ...insumo, id: crypto.randomUUID(), criadoEm: new Date().toISOString() }],
    }));

  const updateInsumo = (id: string, data: Partial<Insumo>) =>
    update(s => ({ ...s, insumos: s.insumos.map(i => (i.id === id ? { ...i, ...data } : i)) }));

  const deleteInsumo = (id: string) =>
    update(s => ({ ...s, insumos: s.insumos.filter(i => i.id !== id) }));

  // --- Produtos ---
  const addProduto = (produto: Omit<Produto, 'id' | 'criadoEm'>) =>
    update(s => ({
      ...s,
      produtos: [...s.produtos, { ...produto, id: crypto.randomUUID(), criadoEm: new Date().toISOString() }],
    }));

  const updateProduto = (id: string, data: Partial<Produto>) =>
    update(s => ({ ...s, produtos: s.produtos.map(p => (p.id === id ? { ...p, ...data } : p)) }));

  const deleteProduto = (id: string) =>
    update(s => ({ ...s, produtos: s.produtos.filter(p => p.id !== id) }));

  // --- Vendas ---
  const addVenda = (venda: Omit<Venda, 'id' | 'criadaEm'>) => {
    update(s => {
      // baixa estoque
      let insumos = [...s.insumos];
      for (const item of venda.itens) {
        const produto = s.produtos.find(p => p.id === item.produtoId);
        if (!produto) continue;
        for (const pi of produto.insumos) {
          const idx = insumos.findIndex(i => i.id === pi.insumoId);
          if (idx >= 0) {
            insumos[idx] = {
              ...insumos[idx],
              estoqueAtual: insumos[idx].estoqueAtual - pi.quantidade * item.quantidade,
            };
          }
        }
      }
      return {
        ...s,
        insumos,
        vendas: [...s.vendas, { ...venda, id: crypto.randomUUID(), criadaEm: new Date().toISOString() }],
      };
    });
  };

  // --- Calc helpers ---
  const custoUnitario = (insumo: Insumo) =>
    insumo.quantidadeEmbalagem > 0 ? insumo.custoEmbalagem / insumo.quantidadeEmbalagem : 0;

  const custoProducao = (produto: Produto): number =>
    produto.insumos.reduce((acc, pi) => {
      const insumo = state.insumos.find(i => i.id === pi.insumoId);
      return acc + (insumo ? custoUnitario(insumo) * pi.quantidade : 0);
    }, 0);

  const precoSugerido = (produto: Produto): number =>
    custoProducao(produto) * (1 + produto.margemLucro / 100);

  const precoFinal = (produto: Produto): number =>
    produto.precoVenda ?? precoSugerido(produto);

  return {
    state,
    hydrated,
    addInsumo, updateInsumo, deleteInsumo,
    addProduto, updateProduto, deleteProduto,
    addVenda,
    custoUnitario, custoProducao, precoSugerido, precoFinal,
  };
}
