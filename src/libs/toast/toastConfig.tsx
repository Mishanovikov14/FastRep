import { StyleSheet } from 'react-native';
import type { ToastConfig } from 'react-native-toast-message';
import { BaseToast } from 'react-native-toast-message';

import type { Colors } from '@/UIProvider';

export function createToastConfig(colors: Colors): ToastConfig {
  const createToast = (accentColor: string): ToastConfig[string] => {
    const styles = StyleSheet.create({
      content: {
        paddingHorizontal: 16,
      },
      root: {
        borderLeftColor: accentColor,
      },
      text1: {
        color: colors.textPrimary,
        fontSize: 15,
        fontWeight: '600',
      },
      text2: {
        color: colors.textSecondary,
        fontSize: 14,
      },
    });

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
}
