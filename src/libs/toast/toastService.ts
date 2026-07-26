import Toast from 'react-native-toast-message';

import type { ToastMessage, ToastType } from './types';

let errorSuppressionDepth = 0;

function show(type: ToastType, { message, title }: ToastMessage): void {
  Toast.show({
    text1: title,
    text2: message,
    type,
  });
}

export const toastService = {
  hide(): void {
    Toast.hide();
  },

  showError(title: string, message?: string): void {
    if (errorSuppressionDepth === 0) {
      show('error', { message, title });
    }
  },

  showInfo(title: string, message?: string): void {
    show('info', { message, title });
  },

  showSuccess(title: string, message?: string): void {
    show('success', { message, title });
  },

  showWarning(title: string, message?: string): void {
    show('warning', { message, title });
  },

  async suppressErrorsFor<T>(operation: () => Promise<T>): Promise<T> {
    errorSuppressionDepth += 1;

    try {
      return await operation();
    } finally {
      errorSuppressionDepth = Math.max(0, errorSuppressionDepth - 1);
    }
  },
};
