import { useCallback, useMemo, useState } from 'react';
import type { LayoutChangeEvent } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const KEYBOARD_SCROLL_GAP = 16;

export const useKeyboardStickyLayout = () => {
  const { bottom } = useSafeAreaInsets();
  const [stickyHeight, setStickyHeight] = useState(0);

  const onStickyLayout = useCallback((event: LayoutChangeEvent) => {
    setStickyHeight(event.nativeEvent.layout.height);
  }, []);

  const scrollBottomOffset = useMemo(() => stickyHeight + KEYBOARD_SCROLL_GAP, [stickyHeight]);

  return {
    extraKeyboardSpace: scrollBottomOffset,
    onStickyLayout,
    scrollBottomOffset,
    stickyOpenedOffset: bottom,
  };
};
