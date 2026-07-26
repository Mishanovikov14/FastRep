import { useMemo } from 'react';
import { TextInput, View } from 'react-native';

import { Typography } from '@/UIKit/Typography';
import { useUIContext } from '@/UIProvider/useUIContext';

import { getStyles } from './styles';
import type { IProps } from './types';

export const Input = ({
  accessibilityLabel,
  disabled = false,
  error,
  label,
  onChangeText,
  style,
  value,
  ...textInputProps
}: IProps) => {
  const { colors, fonts, radius, spacing } = useUIContext();
  const styles = useMemo(
    () => getStyles(colors, fonts, radius, spacing),
    [colors, fonts, radius, spacing],
  );

  return (
    <View style={styles.field}>
      <Typography variant="bodyMedium">{label}</Typography>
      <TextInput
        {...textInputProps}
        accessibilityLabel={accessibilityLabel ?? label}
        editable={!disabled}
        onChangeText={onChangeText}
        placeholderTextColor={colors.textSecondary}
        style={[styles.input, disabled && styles.disabled, error && styles.error, style]}
        value={value}
      />
      {error ? (
        <Typography color={colors.error} variant="caption">
          {error}
        </Typography>
      ) : null}
    </View>
  );
};
