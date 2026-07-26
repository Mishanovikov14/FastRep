import { useMemo } from 'react';
import Toast from 'react-native-toast-message';

import { useUIContext } from '@/UIProvider';

import { createToastConfig } from './toastConfig';

export function ToastHost() {
  const { colors } = useUIContext();
  const config = useMemo(() => createToastConfig(colors), [colors]);

  return <Toast config={config} />;
}
