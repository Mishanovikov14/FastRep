import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import ReactTestRenderer from 'react-test-renderer';

import { ArrowBackIcon } from '@/assets/icons/ArrowBackIcon';
import { ReportsIcon } from '@/assets/icons/ReportsIcon';
import { ToastHost } from '@/libs/toast';
import { Button } from '@/UIKit/Button';
import { CustomAlert } from '@/UIKit/CustomAlert';
import { EmptyState } from '@/UIKit/EmptyState';
import { Header } from '@/UIKit/Header';
import { Input } from '@/UIKit/Input';
import { Loader } from '@/UIKit/Loader';
import { ScreenContainer } from '@/UIKit/ScreenContainer';
import { Typography } from '@/UIKit/Typography';
import { UIProvider } from '@/UIProvider/UIProvider';

describe('UIKit', () => {
  it('renders every reusable component', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer | undefined;

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(
        <SafeAreaProvider
          initialMetrics={{
            frame: { height: 844, width: 390, x: 0, y: 0 },
            insets: { bottom: 0, left: 0, right: 0, top: 0 },
          }}
        >
          <UIProvider>
            <NavigationContainer>
              <ScreenContainer headerComponent={<Header showBackButton title="FastRep" />}>
                <Typography>FastRep</Typography>
                <Input label="Email" onChangeText={() => undefined} value="" />
                <Button onPress={() => undefined} title="Continue" />
                <Loader />
                <EmptyState
                  description="Create your first item."
                  image={<ReportsIcon color="#000000" />}
                  title="No items"
                />
              </ScreenContainer>
              <CustomAlert
                actions={[]}
                description="Description"
                onDismiss={() => undefined}
                title="Alert"
                visible={false}
              />
              <ToastHost />
            </NavigationContainer>
          </UIProvider>
        </SafeAreaProvider>,
      );
      await Promise.resolve();
    });

    expect(renderer?.root.findAllByType(ScreenContainer)).toHaveLength(1);
    expect(renderer?.root.findAllByType(Header)).toHaveLength(1);
    expect(renderer?.root.findAllByType(EmptyState)).toHaveLength(1);
    expect(renderer?.root.findAllByType(CustomAlert)).toHaveLength(1);
    expect(renderer?.root.findAllByType(ArrowBackIcon)).toHaveLength(1);
    expect(renderer?.root.findAllByType(ReportsIcon)).toHaveLength(1);
    expect(renderer?.root.findAllByType(Typography)).toHaveLength(6);
    expect(renderer?.root.findAllByType(Input)).toHaveLength(1);
    expect(renderer?.root.findAllByType(Button)).toHaveLength(1);
    expect(renderer?.root.findAllByType(Loader)).toHaveLength(1);
    expect(renderer?.root.findAllByType(ToastHost)).toHaveLength(1);
  });
});
