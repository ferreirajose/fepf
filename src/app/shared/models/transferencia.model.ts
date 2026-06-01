export interface Transferencia {
  id?: string;
  _id?: string;
  contaOrigemId: string | {
    _id: string;
    nome: string;
  };
  contaDestinoId: string | {
    _id: string;
    nome: string;
  };
  valor: number;
  data: Date | string;
  descricao: string;
  ativo: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface TransferenciaResponse {
  success: boolean;
  data?: Transferencia | Transferencia[];
  error?: string;
  details?: any;
}

export interface FiltrosTransferencia {
  dataInicio?: string;
  dataFim?: string;
  contaId?: string;
}
