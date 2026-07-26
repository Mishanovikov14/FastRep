import { useMemo } from 'react';
import Toast from 'react-native-toast-message';

import { useUIContext } from '@/UIProvider';

import { createToastConfig } from './toastConfig';

export function ToastHost() {
  const { colors, fonts, spacing } = useUIContext();
  const config = useMemo(() => createToastConfig(colors, fonts, spacing), [colors, fonts, spacing]);

  return <Toast config={config} />;
}
