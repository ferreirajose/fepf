export interface Cartao {
  id: string;
  nome: string;
  bandeira: 'visa' | 'mastercard' | 'elo' | 'amex' | 'outra';
  limite: number;
  diaVencimento: number;
  diaFechamento: number;
  ativo: boolean;
}
