'use client';
import { useState, useEffect, useCallback } from 'react';
import type { AppState, Insumo, Produto, Venda } from '@/types';

const defaultState: AppState = {
  insumos: [],
  produtos: [],
  vendas: [],
};

async function fetchJson(url: string, options?: RequestInit) {
  const response = await fetch(url, {
    cache: 'no-store',
    headers: {
      'Content-Type': 'application/json',
      ...(options?.headers ?? {}),
    },
    ...options,
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`${response.status} ${response.statusText}: ${body}`);
  }

  return response.json();
}

const normalizeUnit = (unit: string): Insumo['unidadeMedida'] => {
  const normalized = String(unit ?? '')
    .trim()
    .toLowerCase();
  if (normalized === 'kg') return 'kg';
  if (normalized === 'g') return 'g';
  if (normalized === 'ml') return 'ml';
  if (normalized === 'l') return 'L';
  return 'un';
};

const mapInsumo = (raw: any): Insumo => ({
  id: String(raw.id),
  nome: raw.nome,
  unidadeMedida: normalizeUnit(raw.unidadeMedida),
  estoqueAtual: Number(raw.estoqueAtual ?? 0),
  custoEmbalagem: Number(raw.rsPago ?? raw.custoEmbalagem ?? 0),
  quantidadeEmbalagem: Number(
    raw.volumeEmbalagem ?? raw.quantidadeEmbalagem ?? 0,
  ),
  criadoEm: String(raw.criadoEm),
});

const mapProduto = (raw: any): Produto => ({
  id: String(raw.id),
  nome: raw.nome,
  categoria: raw.categoria ?? '',
  descricao: raw.descricao ?? undefined,
  margemLucro: Number(raw.margemSeguranca ?? raw.margemLucro ?? 10),
  precoVenda:
    raw.precoVenda !== null && raw.precoVenda !== undefined
      ? Number(raw.precoVenda)
      : undefined,
  ativo: Boolean(raw.ativo),
  insumos: Array.isArray(raw.insumos)
    ? raw.insumos.map((item: any) => ({
        insumoId: String(item.insumoId),
        quantidade: Number(item.qtdBruta ?? item.quantidade ?? 0),
      }))
    : [],
  criadoEm: String(raw.criadoEm),
});

const mapVenda = (raw: any): Venda => ({
  id: String(raw.id),
  total: Number(raw.total),
  criadaEm: String(raw.criadaEm),
  itens: Array.isArray(raw.itens)
    ? raw.itens.map((item: any) => ({
        produtoId: String(item.produtoId),
        quantidade: Number(item.quantidade),
        precoUnitario: Number(item.precoUnitario),
      }))
    : [],
});

const prepareInsumoBody = (insumo: Omit<Insumo, 'id' | 'criadoEm'>) => ({
  nome: insumo.nome,
  unidadeMedida: insumo.unidadeMedida,
  estoqueAtual: insumo.estoqueAtual,
  rsPago: insumo.custoEmbalagem,
  volumeEmbalagem: insumo.quantidadeEmbalagem,
  ativo: true,
});

const prepareProdutoBody = (produto: Omit<Produto, 'id' | 'criadoEm'>) => ({
  nome: produto.nome,
  categoria: produto.categoria,
  descricao: produto.descricao ?? null,
  margemSeguranca: produto.margemLucro,
  precoVenda: produto.precoVenda ?? null,
  ativo: produto.ativo,
  insumos: produto.insumos.map((item) => ({
    insumoId: Number(item.insumoId),
    qtdBruta: item.quantidade,
  })),
});

export function useStore() {
  const [state, setState] = useState<AppState>(defaultState);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const [insumos, produtos, vendas] = await Promise.all([
          fetchJson('/api/insumos'),
          fetchJson('/api/produtos'),
          fetchJson('/api/vendas?limite=100'),
        ]);

        setState({
          insumos: Array.isArray(insumos) ? insumos.map(mapInsumo) : [],
          produtos: Array.isArray(produtos) ? produtos.map(mapProduto) : [],
          vendas: Array.isArray(vendas) ? vendas.map(mapVenda) : [],
        });
      } catch (error) {
        console.error('Falha ao carregar dados do servidor:', error);
        setState(defaultState);
      } finally {
        setHydrated(true);
      }
    }

    load();
  }, []);

  const addInsumo = useCallback(
    async (insumo: Omit<Insumo, 'id' | 'criadoEm'>) => {
      try {
        const created = await fetchJson('/api/insumos', {
          method: 'POST',
          body: JSON.stringify(prepareInsumoBody(insumo)),
        });
        setState((prev) => ({
          ...prev,
          insumos: [...prev.insumos, mapInsumo(created)],
        }));
      } catch (error) {
        console.error('Erro ao criar insumo:', error);
      }
    },
    [],
  );

  const updateInsumo = useCallback(
    async (id: string, data: Partial<Insumo>) => {
      try {
        const body = {
          ...data,
          rsPago: data.custoEmbalagem,
          volumeEmbalagem: data.quantidadeEmbalagem,
        } as any;
        delete body.custoEmbalagem;
        delete body.quantidadeEmbalagem;

        const updated = await fetchJson(`/api/insumos/${id}`, {
          method: 'PUT',
          body: JSON.stringify(body),
        });

        setState((prev) => ({
          ...prev,
          insumos: prev.insumos.map((item) =>
            item.id === id ? mapInsumo(updated) : item,
          ),
        }));
      } catch (error) {
        console.error('Erro ao atualizar insumo:', error);
      }
    },
    [],
  );

  const deleteInsumo = useCallback(async (id: string) => {
    try {
      await fetchJson(`/api/insumos/${id}`, { method: 'DELETE' });
      setState((prev) => ({
        ...prev,
        insumos: prev.insumos.filter((item) => item.id !== id),
      }));
    } catch (error) {
      console.error('Erro ao excluir insumo:', error);
    }
  }, []);

  const addProduto = useCallback(
    async (produto: Omit<Produto, 'id' | 'criadoEm'>) => {
      try {
        const created = await fetchJson('/api/produtos', {
          method: 'POST',
          body: JSON.stringify(prepareProdutoBody(produto)),
        });
        setState((prev) => ({
          ...prev,
          produtos: [...prev.produtos, mapProduto(created)],
        }));
      } catch (error) {
        console.error('Erro ao criar produto:', error);
      }
    },
    [],
  );

  const updateProduto = useCallback(
    async (id: string, data: Partial<Produto>) => {
      try {
        const body = {
          ...data,
          margemSeguranca: data.margemLucro,
          precoVenda: data.precoVenda ?? null,
          insumos: data.insumos?.map((item) => ({
            insumoId: Number(item.insumoId),
            qtdBruta: item.quantidade,
          })),
        } as any;
        delete body.margemLucro;

        const updated = await fetchJson(`/api/produtos/${id}`, {
          method: 'PUT',
          body: JSON.stringify(body),
        });

        setState((prev) => ({
          ...prev,
          produtos: prev.produtos.map((item) =>
            item.id === id ? mapProduto(updated) : item,
          ),
        }));
      } catch (error) {
        console.error('Erro ao atualizar produto:', error);
      }
    },
    [],
  );

  const deleteProduto = useCallback(async (id: string) => {
    try {
      await fetchJson(`/api/produtos/${id}`, { method: 'DELETE' });
      setState((prev) => ({
        ...prev,
        produtos: prev.produtos.filter((item) => item.id !== id),
      }));
    } catch (error) {
      console.error('Erro ao excluir produto:', error);
    }
  }, []);

  const addVenda = useCallback(
    async (venda: Omit<Venda, 'id' | 'criadaEm'>) => {
      try {
        const created = await fetchJson('/api/vendas', {
          method: 'POST',
          body: JSON.stringify({
            itens: venda.itens.map((item) => ({
              produtoId: Number(item.produtoId),
              quantidade: item.quantidade,
              precoUnitario: item.precoUnitario,
            })),
            canal: 'salao',
          }),
        });

        const novo = mapVenda(created);

        setState((prev) => {
          const insumos = prev.insumos.map((i) => {
            let estoqueAtual = i.estoqueAtual;
            for (const item of venda.itens) {
              const produto = prev.produtos.find(
                (p) => p.id === item.produtoId,
              );
              if (!produto) continue;
              for (const pi of produto.insumos) {
                if (pi.insumoId === i.id) {
                  estoqueAtual -= pi.quantidade * item.quantidade;
                }
              }
            }
            return { ...i, estoqueAtual };
          });

          return { ...prev, insumos, vendas: [novo, ...prev.vendas] };
        });
      } catch (error) {
        console.error('Erro ao registrar venda:', error);
      }
    },
    [],
  );

  const custoUnitario = useCallback(
    (insumo: Insumo) =>
      insumo.quantidadeEmbalagem > 0
        ? insumo.custoEmbalagem / insumo.quantidadeEmbalagem
        : 0,
    [],
  );

  const custoProducao = useCallback(
    (produto: Produto): number =>
      produto.insumos.reduce((acc, pi) => {
        const insumo = state.insumos.find((i) => i.id === pi.insumoId);
        return acc + (insumo ? custoUnitario(insumo) * pi.quantidade : 0);
      }, 0),
    [state.insumos, custoUnitario],
  );

  const precoSugerido = useCallback(
    (produto: Produto): number =>
      custoProducao(produto) * (1 + produto.margemLucro / 100),
    [custoProducao],
  );

  const precoFinal = useCallback(
    (produto: Produto): number => produto.precoVenda ?? precoSugerido(produto),
    [precoSugerido],
  );

  return {
    state,
    hydrated,
    addInsumo,
    updateInsumo,
    deleteInsumo,
    addProduto,
    updateProduto,
    deleteProduto,
    addVenda,
    custoUnitario,
    custoProducao,
    precoSugerido,
    precoFinal,
  };
}
