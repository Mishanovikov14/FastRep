import type { TextStyle } from 'react-native';

import type { radius, spacing } from '@/theme';

export interface Colors {
  background: string;
  black: string;
  border: string;
  error: string;
  info: string;
  primary: string;
  primaryLight: string;
  primaryPressed: string;
  success: string;
  surface: string;
  textDisabled: string;
  textOnPrimary: string;
  textPrimary: string;
  textSecondary: string;
  warning: string;
  white: string;
}

export interface Fonts {
  bold: TextStyle;
  medium: TextStyle;
  regular: TextStyle;
  semibold: TextStyle;
}

export interface FontFamilies {
  bold: string;
  medium: string;
  regular: string;
  semibold: string;
}

export type Spacing = typeof spacing;
export type Radius = typeof radius;
