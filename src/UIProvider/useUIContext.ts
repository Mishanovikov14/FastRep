import { useContext } from 'react';

import type { UIContextValue } from './types';
import { UIContext } from './UIContext';

export function useUIContext(): UIContextValue {
  const context = useContext(UIContext);

  if (!context) {
    throw new Error('useUIContext must be used within UIProvider.');
  }

  return context;
}
