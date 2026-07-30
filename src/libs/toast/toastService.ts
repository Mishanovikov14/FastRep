import Toast from 'react-native-toast-message';

import type { ToastMessage, ToastType } from './types';

const VISIBILITY_TIME_BY_TYPE: Record<ToastType, number> = {
  error: 4500,
  info: 4000,
  success: 2500,
  warning: 3000,
};

const show = (type: ToastType, { message, title }: ToastMessage): void => {
  Toast.show({
    text1: title,
    text2: message,
    type,
    visibilityTime: VISIBILITY_TIME_BY_TYPE[type],
  });
};

export const toastService = {
  hide(): void {
    Toast.hide();
  },

  showError(title: string, message?: string): void {
    show('error', { message, title });
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
};
