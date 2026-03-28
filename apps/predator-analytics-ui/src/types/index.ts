export type Theme = 'light' | 'dark';

export type SaleStatus = 'оплачено' | 'очікує';

export interface Sale {
  id: string;
  date: string;
  product: string;
  amount: number;
  status: SaleStatus;
}

export type MessageRole = 'user' | 'assistant';

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: string;
}
