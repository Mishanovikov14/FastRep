import { createContext } from 'react';

import type { UIContextValue } from './types';

export const UIContext = createContext<UIContextValue | undefined>(undefined);
