import type { ITokenPair } from '@/types/auth';

export interface ITokenSnapshot {
  readonly tokens: ITokenPair | null;
  readonly version: number;
}
