import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AppLifecycle } from '@/AppLifecycle';
import { ReactQueryProvider } from '@/libs/query/ReactQueryProvider';
import { ToastHost } from '@/libs/toast';
import { UIProvider } from '@/UIProvider/UIProvider';

import type { IProps } from './AppProviders.types';

const AppContent = ({ children }: IProps) => {
  return (
    <>
      <AppLifecycle />
      {children}
      <ToastHost />
    </>
  );
};

export const AppProviders = ({ children }: IProps) => {
  return (
    <GestureHandlerRootView>
      <KeyboardProvider>
        <SafeAreaProvider>
          <UIProvider>
            <ReactQueryProvider>
              <AppContent>{children}</AppContent>
            </ReactQueryProvider>
          </UIProvider>
        </SafeAreaProvider>
      </KeyboardProvider>
    </GestureHandlerRootView>
  );
};
