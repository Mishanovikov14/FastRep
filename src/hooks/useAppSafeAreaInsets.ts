import { Dimensions, Platform } from 'react-native';
import { useSafeAreaInsets, initialWindowMetrics } from 'react-native-safe-area-context';

const ANDROID_BOTTOM_INSET_FALLBACK = 12;

const getAndroidBottomInset = (): number => {
  if (Platform.OS !== 'android') {
    return 0;
  }

  const screenHeight = Dimensions.get('screen').height;
  const windowHeight = Dimensions.get('window').height;
  const systemBarDifference = Math.max(0, screenHeight - windowHeight);

  return Math.max(ANDROID_BOTTOM_INSET_FALLBACK, Math.min(systemBarDifference, 48));
};

const getResolvedInset = (current: number, initial: number | undefined): number => {
  return current > 0 ? current : (initial ?? 0);
};

export const useAppSafeAreaInsets = () => {
  const insets = useSafeAreaInsets();
  const initialBottom = initialWindowMetrics?.insets.bottom;

  return {
    bottom: Math.max(getResolvedInset(insets.bottom, initialBottom), getAndroidBottomInset()),
    left: getResolvedInset(insets.left, initialWindowMetrics?.insets.left),
    right: getResolvedInset(insets.right, initialWindowMetrics?.insets.right),
    top: getResolvedInset(insets.top, initialWindowMetrics?.insets.top),
  };
};
