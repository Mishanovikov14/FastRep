import type { IResponse } from '@/libs/requester/IResponse';

export class ReportRequestError extends Error {
  readonly errors?: unknown;
  readonly status?: number;
  readonly type?: string;

  constructor(response: IResponse<unknown>) {
    super(response.message);
    this.name = 'ReportRequestError';
    this.errors = response.errors;
    this.status = response.status;
    this.type = response.type;
  }
}
