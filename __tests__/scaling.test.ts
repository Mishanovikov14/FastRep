import {
  isAndroid,
  isIOS,
  scaleFontSize,
  scaleHorizontal,
  scaleLineHeight,
  scaleVertical,
  screenSize,
} from '@/utils/scaling';

jest.mock('react-native', () => ({
  Dimensions: {
    get: jest.fn(() => ({
      fontScale: 2,
      height: 812,
      scale: 3,
      width: 375,
    })),
  },
  PixelRatio: {
    getFontScale: jest.fn(() => 2),
  },
  Platform: {
    OS: 'ios',
  },
}));

describe('scaling', () => {
  it('exposes the current platform and screen snapshot', () => {
    expect(isIOS).toBe(true);
    expect(isAndroid).toBe(false);
    expect(screenSize).toMatchObject({
      height: 812,
      width: 375,
    });
  });

  it('keeps design-space dimensions unchanged at the reference size', () => {
    expect(scaleHorizontal(24)).toBe(24);
    expect(scaleVertical(32)).toBe(32);
  });

  it('accounts for the system font scale', () => {
    expect(scaleFontSize(16)).toBe(8);
    expect(scaleLineHeight(24)).toBe(12);
  });
});
