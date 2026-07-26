export type ToastType = 'error' | 'info' | 'success' | 'warning';

export interface ToastMessage {
  message?: string;
  title: string;
}
