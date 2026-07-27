import { Platform } from 'react-native';

import type { FontFamilies, Fonts } from './types';

export const fontFamiliesByPlatform: {
  android: FontFamilies;
  ios: FontFamilies;
} = {
  android: {
    bold: 'GoogleSansFlex_24pt-Bold',
    medium: 'GoogleSansFlex_24pt-Medium',
    regular: 'GoogleSansFlex_24pt-Regular',
    semibold: 'GoogleSansFlex_24pt-SemiBold',
  },
  ios: {
    bold: 'GoogleSansFlex24pt-Bold',
    medium: 'GoogleSansFlex24pt-Medium',
    regular: 'GoogleSansFlex24pt-Regular',
    semibold: 'GoogleSansFlex24pt-SemiBold',
  },
};

export const fontFamilies: FontFamilies = Platform.select({
  android: fontFamiliesByPlatform.android,
  default: fontFamiliesByPlatform.android,
  ios: fontFamiliesByPlatform.ios,
});

export const fonts: Fonts = {
  bold: {
    fontFamily: fontFamilies.bold,
  },
  medium: {
    fontFamily: fontFamilies.medium,
  },
  regular: {
    fontFamily: fontFamilies.regular,
  },
  semibold: {
    fontFamily: fontFamilies.semibold,
  },
};

export const systemFonts: Fonts = {
  bold: {
    fontWeight: '700',
  },
  medium: {
    fontWeight: '500',
  },
  regular: {
    fontWeight: '400',
  },
  semibold: {
    fontWeight: '600',
  },
};
