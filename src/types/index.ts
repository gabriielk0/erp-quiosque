export type UnidadeMedida = 'g' | 'kg' | 'ml' | 'L' | 'un';

export interface Insumo {
  id: string;
  nome: string;
  unidadeMedida: UnidadeMedida;
  estoqueAtual: number; // em unidade básica
  custoEmbalagem: number;
  quantidadeEmbalagem: number;
  criadoEm: string;
}

export interface ProdutoInsumo {
  insumoId: string;
  quantidade: number; // em unidade básica
}

export interface Produto {
  id: string;
  nome: string;
  categoria: string;
  descricao?: string;
  margemLucro: number; // %
  precoVenda?: number; // override manual
  ativo: boolean;
  insumos: ProdutoInsumo[];
  criadoEm: string;
}

export interface ItemVenda {
  produtoId: string;
  quantidade: number;
  precoUnitario: number;
}

export interface Venda {
  id: string;
  itens: ItemVenda[];
  total: number;
  criadaEm: string;
}

export interface AppState {
  insumos: Insumo[];
  produtos: Produto[];
  vendas: Venda[];
}
