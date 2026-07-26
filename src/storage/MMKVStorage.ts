import { createMMKV } from 'react-native-mmkv';

const storage = createMMKV({
  id: 'fastrep.storage',
});

class MMKVStorage {
  clear(): void {
    storage.clearAll();
  }

  contains(key: string): boolean {
    return storage.contains(key);
  }

  delete(key: string): boolean {
    return storage.remove(key);
  }

  getBoolean(key: string): boolean | undefined {
    return storage.getBoolean(key);
  }

  getNumber(key: string): number | undefined {
    return storage.getNumber(key);
  }

  getObject<T>(key: string): T | undefined {
    const value = storage.getString(key);

    if (value === undefined) {
      return undefined;
    }

    try {
      return JSON.parse(value) as T;
    } catch {
      return undefined;
    }
  }

  getString(key: string): string | undefined {
    return storage.getString(key);
  }

  setBoolean(key: string, value: boolean): void {
    storage.set(key, value);
  }

  setNumber(key: string, value: number): void {
    storage.set(key, value);
  }

  setObject<T>(key: string, value: T): void {
    storage.set(key, JSON.stringify(value));
  }

  setString(key: string, value: string): void {
    storage.set(key, value);
  }
}

export const mmkvStorage = new MMKVStorage();
