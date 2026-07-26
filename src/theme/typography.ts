import type { TextStyle } from 'react-native';

export const typography = {
  body: {
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 24,
  } satisfies TextStyle,
  caption: {
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 16,
  } satisfies TextStyle,
  heading: {
    fontSize: 24,
    fontWeight: '700',
    lineHeight: 32,
  } satisfies TextStyle,
} as const;
