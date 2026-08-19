import { focusManager } from '@tanstack/react-query';
import { useEffect } from 'react';
import { AppState } from 'react-native';

export const useReactQueryAppLifecycle = (): void => {
  useEffect(() => {
    focusManager.setFocused(AppState.currentState === 'active');
    const subscription = AppState.addEventListener('change', (state) => {
      focusManager.setFocused(state === 'active');
    });

    return () => subscription.remove();
  }, []);
};
