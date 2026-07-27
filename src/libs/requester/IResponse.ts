export interface IResponse<T> {
  data?: T;
  errors?: unknown;
  isError: boolean;
  message: string;
  status?: number;
  type?: string;
}
