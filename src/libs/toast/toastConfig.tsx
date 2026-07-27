import type { ToastConfig } from 'react-native-toast-message';
import { BaseToast } from 'react-native-toast-message';

import type { Colors, Fonts, Spacing } from '@/UIProvider/theme/types';

import { getStyles } from './styles';

export const createToastConfig = (colors: Colors, fonts: Fonts, spacing: Spacing): ToastConfig => {
  const createToast = (accentColor: string): ToastConfig[string] => {
    const styles = getStyles(colors, fonts, spacing, accentColor);

    return (props) => (
      <BaseToast
        {...props}
        contentContainerStyle={styles.content}
        style={styles.root}
        text1Style={styles.text1}
        text2Style={styles.text2}
      />
    );
  };

  return {
    error: createToast(colors.error),
    info: createToast(colors.info),
    success: createToast(colors.success),
    warning: createToast(colors.warning),
  };
};
