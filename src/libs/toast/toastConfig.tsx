import type { ToastConfig } from 'react-native-toast-message';
import { BaseToast } from 'react-native-toast-message';

import type { Colors, Fonts, Spacing } from '@/UIProvider/theme/types';

import { getStyles } from './styles';

export const createToastConfig = (colors: Colors, fonts: Fonts, spacing: Spacing): ToastConfig => {
  const createToast = (accentColor: string, compactWhenSingleLine = false): ToastConfig[string] => {
    const styles = getStyles(colors, fonts, spacing, accentColor);

    return (props) => {
      const isCompact = compactWhenSingleLine && !props.text2;

      return (
        <BaseToast
          {...props}
          contentContainerStyle={isCompact ? styles.contentCompact : styles.content}
          style={isCompact ? styles.rootCompact : styles.root}
          text1NumberOfLines={0}
          text1Style={styles.text1}
          text2NumberOfLines={0}
          text2Style={styles.text2}
        />
      );
    };
  };

  return {
    error: createToast(colors.error),
    info: createToast(colors.info),
    success: createToast(colors.success, true),
    warning: createToast(colors.warning),
  };
};
