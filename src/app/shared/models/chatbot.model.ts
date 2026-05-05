export interface ChatMessage {
  _id?: string;
  sessionId: string;
  role: 'user' | 'assistant';
  content: string;
  attachments?: ChatAttachment[];
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export interface ChatAttachment {
  filename: string;
  mimetype: string;
  size: number;
  url?: string;
}

export interface ChatResponse {
  success: boolean;
  data?: {
    message?: ChatMessage;
    messages?: ChatMessage[];
    count?: number;
    timestamp?: string;
    deletedCount?: number;
    context?: ChatbotContext;
  };
  error?: string;
}

export interface ChatbotContext {
  resumo?: {
    totalDespesas: number;
    totalReceitas: number;
    saldo: number;
    periodo: string;
  };
  despesas?: any[];
  receitas?: any[];
  categorias?: any[];
  cartoes?: any[];
  orcamentos?: any[];
}

export interface SendMessageRequest {
  sessionId: string;
  message: string;
  files?: File[];
  provider?: 'deepseek' | 'chatgpt' | 'gemini';
  model?: string;
}
