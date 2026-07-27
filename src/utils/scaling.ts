import { Dimensions, PixelRatio, Platform } from 'react-native';

export const isIOS = Platform.OS === 'ios';
export const isAndroid = Platform.OS === 'android';

const DESIGN_WIDTH = 375;
const DESIGN_HEIGHT = 812;

export const screenSize = Dimensions.get('window');

const fontScale = PixelRatio.getFontScale();

export const scaleHorizontal = (value: number = 1): number => {
  return (screenSize.width / DESIGN_WIDTH) * value;
};

export const scaleVertical = (value: number = 1): number => {
  return (screenSize.height / DESIGN_HEIGHT) * value;
};

export const scaleFontSize = (value: number = 1): number => {
  return (screenSize.width / DESIGN_WIDTH) * (value / fontScale);
};

export const scaleLineHeight = (value: number = 1): number => {
  let result = (screenSize.height / DESIGN_HEIGHT) * (value / fontScale);

  if (screenSize.height < 700) {
    result += 4;
  }

  return result;
};
