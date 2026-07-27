import type { TextStyle } from 'react-native';
import { StyleSheet } from 'react-native';

import type { TypographyVariant } from './types';

export const variantStyles: Record<TypographyVariant, TextStyle> = StyleSheet.create({
  body: {
    fontSize: 16,
    lineHeight: 24,
  },
  bodyMedium: {
    fontSize: 16,
    lineHeight: 24,
  },
  button: {
    fontSize: 16,
    lineHeight: 20,
  },
  caption: {
    fontSize: 13,
    lineHeight: 18,
  },
  heading: {
    fontSize: 22,
    lineHeight: 28,
  },
  title: {
    fontSize: 30,
    lineHeight: 36,
  },
});
