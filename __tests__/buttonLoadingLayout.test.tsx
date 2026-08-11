import React from 'react';
import { StyleSheet } from 'react-native';
import ReactTestRenderer from 'react-test-renderer';

import { Button } from '@/UIKit/Button';
import { Typography } from '@/UIKit/Typography';
import { UIProvider } from '@/UIProvider/UIProvider';

interface IRenderOptions {
  disabled?: boolean;
  fullWidth?: boolean;
  loading?: boolean;
  size?: 'medium' | 'small';
}

const renderButton = async ({ disabled = false, fullWidth = true, loading = false, size = 'medium' }: IRenderOptions) => {
  let renderer: ReactTestRenderer.ReactTestRenderer | undefined;

  await ReactTestRenderer.act(async () => {
    renderer = ReactTestRenderer.create(
      <UIProvider>
        <Button
          disabled={disabled}
          fullWidth={fullWidth}
          loading={loading}
          onPress={() => undefined}
          size={size}
          title="Generate report"
        />
      </UIProvider>,
    );
  });

  return renderer as ReactTestRenderer.ReactTestRenderer;
};

describe('Button loading layout', () => {
  it('keeps the titled content in layout while overlaying the loader', async () => {
    const idle = await renderButton({});
    const loading = await renderButton({ loading: true });
    const idlePressable = idle.root.find((node) => node.props.accessibilityRole === 'button');
    const loadingPressable = loading.root.find((node) => node.props.accessibilityRole === 'button');
    const resolveStyle = (pressable: ReactTestRenderer.ReactTestInstance) =>
      StyleSheet.flatten(pressable.props.style({ pressed: false }));
    const idleStyle = resolveStyle(idlePressable);
    const loadingStyle = resolveStyle(loadingPressable);

    expect(idle.root.findByType(Typography).props.children).toBe('Generate report');
    expect(loading.root.findByType(Typography).props.children).toBe('Generate report');
    expect(idleStyle.alignSelf).toBe('stretch');
    expect(loadingStyle.alignSelf).toBe('stretch');
    expect(loadingStyle.minHeight).toBe(idleStyle.minHeight);
    expect(loadingStyle.paddingHorizontal).toBe(idleStyle.paddingHorizontal);

    ReactTestRenderer.act(() => {
      idle.unmount();
      loading.unmount();
    });
  });

  it('preserves full-width dimensions when disabled', async () => {
    const idle = await renderButton({});
    const disabled = await renderButton({ disabled: true });
    const getStyle = (renderer: ReactTestRenderer.ReactTestRenderer) => {
      const pressable = renderer.root.find((node) => node.props.accessibilityRole === 'button');
      return StyleSheet.flatten(pressable.props.style({ pressed: false }));
    };

    expect(getStyle(disabled)).toMatchObject({
      alignSelf: getStyle(idle).alignSelf,
      minHeight: getStyle(idle).minHeight,
      paddingHorizontal: getStyle(idle).paddingHorizontal,
    });

    ReactTestRenderer.act(() => {
      idle.unmount();
      disabled.unmount();
    });
  });

  it('keeps compact buttons compact while loading', async () => {
    const idle = await renderButton({ fullWidth: false, size: 'small' });
    const loading = await renderButton({ fullWidth: false, loading: true, size: 'small' });
    const getStyle = (renderer: ReactTestRenderer.ReactTestRenderer) => {
      const pressable = renderer.root.find((node) => node.props.accessibilityRole === 'button');
      return StyleSheet.flatten(pressable.props.style({ pressed: false }));
    };

    expect(getStyle(idle).alignSelf).toBeUndefined();
    expect(getStyle(loading).alignSelf).toBeUndefined();
    expect(getStyle(loading).minHeight).toBe(getStyle(idle).minHeight);
    expect(getStyle(loading).paddingHorizontal).toBe(getStyle(idle).paddingHorizontal);

    ReactTestRenderer.act(() => {
      idle.unmount();
      loading.unmount();
    });
  });
});
