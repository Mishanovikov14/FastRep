import { useMemo } from 'react';
import { Pressable, TextInput, View } from 'react-native';

import { Typography } from '@/UIKit/Typography';
import { useUIContext } from '@/UIProvider/useUIContext';

import { useVerificationCodeInput } from './presenters/useVerificationCodeInput';
import { getStyles } from './styles';

interface IProps {
  accessibilityLabel: string;
  disabled?: boolean;
  error?: string;
  onChangeText(value: string): void;
  value: string;
}

const SLOT_INDICES = [0, 1, 2, 3, 4, 5] as const;

export const VerificationCodeInput = ({
  accessibilityLabel,
  disabled = false,
  error,
  onChangeText,
  value,
}: IProps) => {
  const { colors, fonts, radius, spacing } = useUIContext();
  const styles = useMemo(
    () => getStyles(colors, fonts, radius, spacing),
    [colors, fonts, radius, spacing],
  );
  const { inputRef, onChange, onPress } = useVerificationCodeInput({ onChangeText });

  return (
    <View style={styles.container}>
      <Pressable
        accessible={false}
        disabled={disabled}
        onPress={onPress}
        style={styles.slots}
      >
        {SLOT_INDICES.map((index) => (
          <View
            key={index}
            style={[
              styles.slot,
              index === value.length && !disabled && styles.activeSlot,
              error && styles.errorSlot,
              disabled && styles.disabledSlot,
            ]}
          >
            <Typography align="center" variant="title">
              {value[index] ?? ''}
            </Typography>
          </View>
        ))}
        <TextInput
          ref={inputRef}
          accessibilityLabel={accessibilityLabel}
          autoComplete="one-time-code"
          autoFocus
          caretHidden
          editable={!disabled}
          keyboardType="number-pad"
          maxLength={6}
          onChangeText={onChange}
          style={styles.hiddenInput}
          textContentType="oneTimeCode"
          value={value}
        />
      </Pressable>
      {error ? (
        <Typography align="center" color={colors.error} variant="caption">
          {error}
        </Typography>
      ) : null}
    </View>
  );
};
