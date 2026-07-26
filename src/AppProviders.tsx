import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ReactQueryProvider } from '@/libs/query/ReactQueryProvider';
import { ToastHost } from '@/libs/toast';
import { Loader } from '@/UIKit';
import { UIProvider } from '@/UIProvider/UIProvider';
import { useUIContext } from '@/UIProvider/useUIContext';

import type { IProps } from './AppProviders.types';

const AppContent = ({ children }: IProps) => {
  const { isInitialized } = useUIContext();

  if (!isInitialized) {
    return <Loader fullscreen />;
  }

  return (
    <>
      {children}
      <ToastHost />
    </>
  );
};

export const AppProviders = ({ children }: IProps) => {
  return (
    <GestureHandlerRootView>
      <SafeAreaProvider>
        <UIProvider>
          <ReactQueryProvider>
            <AppContent>{children}</AppContent>
          </ReactQueryProvider>
        </UIProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
};
