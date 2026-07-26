import React from 'react';
import ReactTestRenderer from 'react-test-renderer';

import { ToastHost } from '@/libs/toast';
import { Button, Loader, ScreenContainer, Typography } from '@/UIKit';
import { UIProvider } from '@/UIProvider';

describe('UIKit', () => {
  it('renders every reusable component', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer | undefined;

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(
        <UIProvider>
          <ScreenContainer>
            <Typography>FastRep</Typography>
            <Button onPress={() => undefined} title="Continue" />
            <Loader />
          </ScreenContainer>
          <ToastHost />
        </UIProvider>,
      );
      await Promise.resolve();
    });

    expect(renderer?.root.findAllByType(ScreenContainer)).toHaveLength(1);
    expect(renderer?.root.findAllByType(Typography)).toHaveLength(2);
    expect(renderer?.root.findAllByType(Button)).toHaveLength(1);
    expect(renderer?.root.findAllByType(Loader)).toHaveLength(1);
    expect(renderer?.root.findAllByType(ToastHost)).toHaveLength(1);
  });
});
