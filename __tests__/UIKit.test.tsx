import React from 'react';
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
        <UIProvider>
          <ScreenContainer>
            <Typography>FastRep</Typography>
            <Input label="Email" onChangeText={() => undefined} value="" />
            <Button onPress={() => undefined} title="Continue" />
            <Loader />
          </ScreenContainer>
          <ToastHost />
        </UIProvider>,
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
