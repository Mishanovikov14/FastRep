import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import ReactTestRenderer from 'react-test-renderer';

import { ToastHost } from '@/libs/toast';
import { Button } from '@/UIKit/Button';
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
            <ScreenContainer>
              <Typography>FastRep</Typography>
              <Input label="Email" onChangeText={() => undefined} value="" />
              <Button onPress={() => undefined} title="Continue" />
              <Loader />
            </ScreenContainer>
            <ToastHost />
          </UIProvider>
        </SafeAreaProvider>,
      );
      await Promise.resolve();
    });

    expect(renderer?.root.findAllByType(ScreenContainer)).toHaveLength(1);
    expect(renderer?.root.findAllByType(Typography)).toHaveLength(3);
    expect(renderer?.root.findAllByType(Input)).toHaveLength(1);
    expect(renderer?.root.findAllByType(Button)).toHaveLength(1);
    expect(renderer?.root.findAllByType(Loader)).toHaveLength(1);
    expect(renderer?.root.findAllByType(ToastHost)).toHaveLength(1);
  });
});
