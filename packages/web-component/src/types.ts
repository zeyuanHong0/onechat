export type Role = 'user' | 'assistant' | 'system';
export type MessageStatus = 'loading' | 'sending' | 'stopped' | 'success' | 'error';

export interface Message {
  id: string;
  role: Role;
  content: string;
  status?: MessageStatus;
}
