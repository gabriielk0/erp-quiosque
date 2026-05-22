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

export interface MenuCategory {
  id: string;
  nome: string;
}

export interface Produto {
  id: string;
  nome: string;
  categoriaId: string;
  categoria?: MenuCategory;
  descricao?: string;
  margemLucro: number; // %
  precoVenda?: number | null; // override manual (salão)
  isIfoodEnabled: boolean;
  ifoodPrice?: number | null;
  ifoodTax?: number | null;
  ifoodAppCommission?: number | null;
  ifoodCardFee?: number | null;
  ifoodFixedDelivery?: number | null;
  ativo: boolean;
  insumos: ProdutoInsumo[];
  criadoEm: string;
}

export interface ItemVenda {
  id?: string;
  produtoId?: string; // Opcional para itens avulsos / insumos diretos
  insumoId?: string; // Opcional para venda direta de insumo
  nomeCustom?: string; // Nome personalizado para item avulso ou insumo direto
  quantidade: number;
  precoUnitario: number;
  custoUnitarioInsumos?: number; // Custo de insumos snapshot no momento da venda
}

export interface Venda {
  id: string;
  itens: ItemVenda[];
  subtotal: number;
  desconto: number;
  taxaAdicional: number;
  total: number;
  observacoes?: string;
  canal?: string;
  criadaEm: string;
}

export interface AppState {
  insumos: Insumo[];
  produtos: Produto[];
  vendas: Venda[];
  categorias: MenuCategory[];
}
