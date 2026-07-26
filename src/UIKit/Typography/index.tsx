import { Text } from 'react-native';

import { fonts as googleSansFonts, systemFonts } from '@/UIProvider/theme';
import { useUIContext } from '@/UIProvider/useUIContext';

import { typographyVariantWeights } from './config';
import { variantStyles } from './styles';
import type { IProps } from './types';

export function Typography({
  align,
  children,
  color,
  language,
  style,
  variant = 'body',
  weight,
  ...textProps
}: IProps) {
  const { colors, fonts } = useUIContext();
  const fontSet = language ? (language === 'uk' ? systemFonts : googleSansFonts) : fonts;
  const resolvedWeight = weight ?? typographyVariantWeights[variant];

  return (
    <Text
      {...textProps}
      style={[
        variantStyles[variant],
        fontSet[resolvedWeight],
        {
          color: color ?? colors.textPrimary,
          textAlign: align,
        },
        style,
      ]}
    >
      {children}
    </Text>
  );
}

export { typographyVariantWeights } from './config';
export type { IProps, TypographyVariant, TypographyWeight } from './types';
