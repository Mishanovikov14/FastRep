export interface IResponse<T> {
  code?: string;
  data?: T;
  errors?: unknown;
  isError: boolean;
  message: string;
  retryAfterSeconds?: number;
  status?: number;
  type?: string;
}
