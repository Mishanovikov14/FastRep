import { useMemo } from 'react';
import Toast from 'react-native-toast-message';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useUIContext } from '@/UIProvider/useUIContext';
import { scaleVertical } from '@/utils/scaling';

import { createToastConfig } from './toastConfig';

export const ToastHost = () => {
  const { colors, fonts, spacing } = useUIContext();
  const safeAreaInsets = useSafeAreaInsets();
  const config = useMemo(() => createToastConfig(colors, fonts, spacing), [colors, fonts, spacing]);
  const topOffset = safeAreaInsets.top + scaleVertical(spacing.md);

  return <Toast config={config} topOffset={topOffset} />;
};
