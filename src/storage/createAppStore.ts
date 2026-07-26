import type { StateCreator } from 'zustand';
import { create } from 'zustand';

export function createAppStore<TState extends object>(initializer: StateCreator<TState>) {
  return create<TState>()(initializer);
}
