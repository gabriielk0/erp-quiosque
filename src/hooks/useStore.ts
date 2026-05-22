'use client';
import { useState, useEffect, useCallback } from 'react';
import type { AppState, Insumo, Produto, Venda, MenuCategory } from '@/types';

const defaultState: AppState = {
  insumos: [],
  produtos: [],
  vendas: [],
  categorias: [],
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

const mapCategory = (raw: any): MenuCategory => ({
  id: String(raw.id),
  nome: raw.nome,
});

const mapProduto = (raw: any): Produto =>
  ({
    id: String(raw.id),
    nome: raw.nome,
    categoriaId: String(raw.categoriaId),
    categoria: raw.categoria ? mapCategory(raw.categoria) : undefined,
    descricao: raw.descricao ?? undefined,
    margemLucro: Number(raw.margemSeguranca ?? raw.margemLucro ?? 10),
    precoVenda:
      raw.precoVenda !== null && raw.precoVenda !== undefined
        ? Number(raw.precoVenda)
        : undefined,
    isIfoodEnabled: Boolean(raw.isIfoodEnabled),
    ifoodPrice:
      raw.ifoodPrice !== null && raw.ifoodPrice !== undefined
        ? Number(raw.ifoodPrice)
        : undefined,
    ifoodTax:
      raw.ifoodTax !== null && raw.ifoodTax !== undefined
        ? Number(raw.ifoodTax)
        : undefined,
    ifoodAppCommission:
      raw.ifoodAppCommission !== null && raw.ifoodAppCommission !== undefined
        ? Number(raw.ifoodAppCommission)
        : undefined,
    ifoodCardFee:
      raw.ifoodCardFee !== null && raw.ifoodCardFee !== undefined
        ? Number(raw.ifoodCardFee)
        : undefined,
    ifoodFixedDelivery:
      raw.ifoodFixedDelivery !== null && raw.ifoodFixedDelivery !== undefined
        ? Number(raw.ifoodFixedDelivery)
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

const mapVenda = (raw: any): Venda =>
  ({
    id: String(raw.id),
    subtotal: Number(raw.subtotal ?? 0),
    desconto: Number(raw.desconto ?? 0),
    taxaAdicional: Number(raw.taxaAdicional ?? 0),
    total: Number(raw.total),
    observacoes: raw.observacoes ?? undefined,
    canal: raw.canal ?? 'salao',
    criadaEm: String(raw.criadaEm),
    itens: Array.isArray(raw.itens)
      ? raw.itens.map((item: any) => ({
          produtoId: item.produtoId ? String(item.produtoId) : undefined,
          insumoId: item.insumoId ? String(item.insumoId) : undefined,
          nomeCustom: item.nomeCustom ?? undefined,
          quantidade: Number(item.quantidade),
          precoUnitario: Number(item.precoUnitario),
          custoUnitarioInsumos: item.custoUnitarioInsumos !== null && item.custoUnitarioInsumos !== undefined ? Number(item.custoUnitarioInsumos) : undefined,
        }))
      : [],
  }) as any;

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
  categoriaId: Number(produto.categoriaId),
  descricao: produto.descricao ?? null,
  margemSeguranca: produto.margemLucro,
  precoVenda: produto.precoVenda ?? null,
  isIfoodEnabled: produto.isIfoodEnabled,
  ifoodPrice: produto.ifoodPrice ?? null,
  ifoodTax: produto.ifoodTax ?? null,
  ifoodAppCommission: produto.ifoodAppCommission ?? null,
  ifoodCardFee: produto.ifoodCardFee ?? null,
  ifoodFixedDelivery: produto.ifoodFixedDelivery ?? null,
  ativo: produto.ativo,
  insumos: produto.insumos.map((item) => ({
    insumoId: Number(item.insumoId),
    qtdBruta: item.quantidade,
  })),
});

export function useStore() {
  const [state, setState] = useState<AppState>(defaultState);
  const [hydrated, setHydrated] = useState(false);
  const [config, setConfig] = useState({
    margemLucroPadrao: 18.23,
    markupPadrao: 2.8,
    cmvMaximo: 37.5,
  });

  useEffect(() => {
    async function load() {
      try {
        const [insumos, produtos, vendas, categorias, cfg] = await Promise.all([
          fetchJson('/api/insumos'),
          fetchJson('/api/produtos'),
          fetchJson('/api/vendas?limite=100'),
          fetchJson('/api/categorias'),
          fetchJson('/api/configuracao').catch(() => null),
        ]);

        if (cfg) {
          setConfig({
            margemLucroPadrao: Number(cfg.margemLucroPadrao) * 100,
            markupPadrao: Number(cfg.markupPadrao),
            cmvMaximo: Number(cfg.cmvMaximo) * 100,
          });
        }

        setState({
          insumos: Array.isArray(insumos) ? insumos.map(mapInsumo) : [],
          produtos: Array.isArray(produtos) ? produtos.map(mapProduto) : [],
          vendas: Array.isArray(vendas) ? vendas.map(mapVenda) : [],
          categorias: Array.isArray(categorias) ? categorias.map(mapCategory) : [],
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
          categoriaId: data.categoriaId !== undefined ? Number(data.categoriaId) : undefined,
          margemSeguranca: data.margemLucro !== undefined ? data.margemLucro : undefined,
          precoVenda: data.precoVenda === undefined ? undefined : data.precoVenda,
          isIfoodEnabled: data.isIfoodEnabled !== undefined ? data.isIfoodEnabled : undefined,
          ifoodPrice: data.ifoodPrice === undefined ? undefined : data.ifoodPrice,
          ifoodTax: data.ifoodTax === undefined ? undefined : data.ifoodTax,
          ifoodAppCommission: data.ifoodAppCommission === undefined ? undefined : data.ifoodAppCommission,
          ifoodCardFee: data.ifoodCardFee === undefined ? undefined : data.ifoodCardFee,
          ifoodFixedDelivery: data.ifoodFixedDelivery === undefined ? undefined : data.ifoodFixedDelivery,
          insumos: data.insumos?.map((item) => ({
            insumoId: Number(item.insumoId),
            qtdBruta: item.quantidade,
          })),
        } as any;
        delete body.margemLucro;
        delete body.categoria;
        Object.keys(body).forEach((key) => {
          if (body[key] === undefined) {
            delete body[key];
          }
        });

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

  const addCategory = useCallback(
    async (nome: string) => {
      try {
        const created = await fetchJson('/api/categorias', {
          method: 'POST',
          body: JSON.stringify({ nome }),
        });
        setState((prev) => ({
          ...prev,
          categorias: [...prev.categorias, mapCategory(created)],
        }));
      } catch (error) {
        console.error('Erro ao criar categoria:', error);
        throw error;
      }
    },
    [],
  );

  const updateCategory = useCallback(
    async (id: string, nome: string) => {
      try {
        const updated = await fetchJson(`/api/categorias/${id}`, {
          method: 'PUT',
          body: JSON.stringify({ nome }),
        });
        const mappedCat = mapCategory(updated);
        setState((prev) => ({
          ...prev,
          categorias: prev.categorias.map((item) =>
            item.id === id ? mappedCat : item,
          ),
          produtos: prev.produtos.map((p) =>
            p.categoriaId === id ? { ...p, categoria: mappedCat } : p
          ),
        }));
      } catch (error) {
        console.error('Erro ao atualizar categoria:', error);
        throw error;
      }
    },
    [],
  );

  const deleteCategory = useCallback(async (id: string) => {
    try {
      await fetchJson(`/api/categorias/${id}`, { method: 'DELETE' });
      setState((prev) => ({
        ...prev,
        categorias: prev.categorias.filter((item) => item.id !== id),
      }));
    } catch (error) {
      console.error('Erro ao excluir categoria:', error);
      throw error;
    }
  }, []);

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

  const deleteVenda = useCallback(async (id: string) => {
    try {
      await fetchJson(`/api/vendas/${id}`, { method: 'DELETE' });

      setState((prev) => {
        const venda = prev.vendas.find((v) => v.id === id);
        if (!venda) return prev;

        // Estorna o estoque localmente
        const insumos = prev.insumos.map((i) => {
          let estoqueAtual = i.estoqueAtual;
          for (const item of venda.itens) {
            if (item.produtoId) {
              const produto = prev.produtos.find((p) => p.id === item.produtoId);
              if (!produto) continue;
              for (const pi of produto.insumos) {
                if (pi.insumoId === i.id) {
                  estoqueAtual += pi.quantidade * item.quantidade;
                }
              }
            } else if (item.insumoId === i.id) {
              estoqueAtual += item.quantidade;
            }
          }
          return { ...i, estoqueAtual };
        });

        return {
          ...prev,
          insumos,
          vendas: prev.vendas.filter((v) => v.id !== id),
        };
      });
    } catch (error: any) {
      console.error('Erro ao excluir venda:', error);
      alert(`Erro ao excluir venda: ${error?.message || 'Erro desconhecido'}`);
    }
  }, []);

  const addVenda = useCallback(
    async (venda: Omit<Venda, 'id' | 'criadaEm'> & { canal?: string }) => {
      try {
        const created = await fetchJson('/api/vendas', {
          method: 'POST',
          body: JSON.stringify({
            itens: venda.itens.map((item) => ({
              produtoId: item.produtoId ? Number(item.produtoId) : null,
              insumoId: item.insumoId ? Number(item.insumoId) : null,
              nomeCustom: item.nomeCustom ?? null,
              quantidade: item.quantidade,
              precoUnitario: item.precoUnitario,
            })),
            canal: venda.canal ?? 'salao',
            desconto: venda.desconto ?? 0,
            taxaAdicional: venda.taxaAdicional ?? 0,
            observacoes: venda.observacoes ?? '',
          }),
        });

        const novo = mapVenda(created);

        setState((prev) => {
          const insumos = prev.insumos.map((i) => {
            let estoqueAtual = i.estoqueAtual;
            for (const item of venda.itens) {
              if (item.produtoId) {
                const produto = prev.produtos.find(
                  (p) => p.id === item.produtoId,
                );
                if (!produto) continue;
                for (const pi of produto.insumos) {
                  if (pi.insumoId === i.id) {
                    estoqueAtual -= pi.quantidade * item.quantidade;
                  }
                }
              } else if (item.insumoId === i.id) {
                estoqueAtual -= item.quantidade;
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
    config,
    hydrated,
    addInsumo,
    updateInsumo,
    deleteInsumo,
    addProduto,
    updateProduto,
    deleteProduto,
    addCategory,
    updateCategory,
    deleteCategory,
    addVenda,
    deleteVenda,
    custoUnitario,
    custoProducao,
    precoSugerido,
    precoFinal,
  };
}
