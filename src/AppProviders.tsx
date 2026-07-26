import type { PropsWithChildren } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ReactQueryProvider } from '@/libs/query';
import { ToastHost } from '@/libs/toast';
import { Loader } from '@/UIKit';
import { UIProvider, useUIContext } from '@/UIProvider';

function AppContent({ children }: PropsWithChildren) {
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
}

export function AppProviders({ children }: PropsWithChildren) {
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
}
