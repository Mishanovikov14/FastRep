import { Text } from 'react-native';

import { resolveFonts } from '@/UIProvider/theme/resolveFonts';
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
  const fontSet = language ? resolveFonts(language) : fonts;
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
