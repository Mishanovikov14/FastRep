export interface IStorage {
  clearAll(): void;
  contains(key: string): boolean;
  get<T>(key: string): T | null;
  remove(key: string): boolean;
  set<T>(key: string, value: T): boolean;
}
