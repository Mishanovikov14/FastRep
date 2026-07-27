import type { ITokenPair } from './auth';
import type { IUser } from './user';

export interface ITokenSnapshot {
  readonly tokens: ITokenPair | null;
  readonly version: number;
}

export type SessionRestoreResult =
  | {
      status: 'authorized';
      user: IUser;
    }
  | {
      status: 'unauthorized';
    }
  | {
      message?: string;
      status: 'temporary_error';
      statusCode?: number;
      type?: string;
    };
