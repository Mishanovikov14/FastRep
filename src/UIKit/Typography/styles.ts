import type { TextStyle } from 'react-native';
import { StyleSheet } from 'react-native';

import { scaleFontSize, scaleLineHeight } from '@/utils/scaling';

import type { TypographyVariant } from './types';

export const variantStyles: Record<TypographyVariant, TextStyle> = StyleSheet.create({
  body: {
    fontSize: scaleFontSize(16),
    lineHeight: scaleLineHeight(24),
  },
  bodyMedium: {
    fontSize: scaleFontSize(16),
    lineHeight: scaleLineHeight(24),
  },
  button: {
    fontSize: scaleFontSize(16),
    lineHeight: scaleLineHeight(20),
  },
  caption: {
    fontSize: scaleFontSize(13),
    lineHeight: scaleLineHeight(18),
  },
  heading: {
    fontSize: scaleFontSize(22),
    lineHeight: scaleLineHeight(28),
  },
  title: {
    fontSize: scaleFontSize(30),
    lineHeight: scaleLineHeight(36),
  },
});
