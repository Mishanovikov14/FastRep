import { createMMKV } from 'react-native-mmkv';

import type { IStorage } from './IStorage';

const mmkv = createMMKV({
  id: 'fastrep.storage',
});

export class MMKVStorage implements IStorage {
  clearAll(): void {
    try {
      mmkv.clearAll();
    } catch {
      // Storage failures must not propagate into the UI.
    }
  }

  contains(key: string): boolean {
    try {
      return mmkv.contains(key);
    } catch {
      return false;
    }
  }

  get<T>(key: string): T | null {
    try {
      const serializedValue = mmkv.getString(key);

      if (serializedValue === undefined) {
        return null;
      }

      return JSON.parse(serializedValue) as T;
    } catch {
      return null;
    }
  }

  remove(key: string): boolean {
    try {
      return mmkv.remove(key);
    } catch {
      return false;
    }
  }

  set<T>(key: string, value: T): boolean {
    try {
      mmkv.set(key, JSON.stringify(value));
      return true;
    } catch {
      return false;
    }
  }
}

export const storage: IStorage = new MMKVStorage();
