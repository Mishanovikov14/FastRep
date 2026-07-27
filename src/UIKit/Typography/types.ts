import type { ReactNode } from 'react';
import type { StyleProp, TextProps, TextStyle } from 'react-native';

import type { SupportedLanguage } from '@/localization/types';

export type TypographyVariant = 'body' | 'bodyMedium' | 'button' | 'caption' | 'heading' | 'title';
export type TypographyWeight = 'bold' | 'medium' | 'regular' | 'semibold';

export interface IProps extends Omit<TextProps, 'children' | 'style'> {
  align?: TextStyle['textAlign'];
  children: ReactNode;
  color?: string;
  language?: SupportedLanguage;
  style?: StyleProp<TextStyle>;
  variant?: TypographyVariant;
  weight?: TypographyWeight;
}
