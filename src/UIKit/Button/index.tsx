import { useMemo } from 'react';
import type { PressableStateCallbackType, StyleProp, ViewStyle } from 'react-native';
import { Pressable, View } from 'react-native';

import { Loader } from '@/UIKit/Loader';
import { Typography } from '@/UIKit/Typography';
import { useUIContext } from '@/UIProvider/useUIContext';

import { getStyles } from './styles';
import type { IProps } from './types';

export const Button = ({
  disabled = false,
  fullWidth = false,
  leftElement,
  loading = false,
  onPress,
  rightElement,
  size = 'medium',
  style,
  title,
  variant = 'primary',
}: IProps) => {
  const { colors, spacing, radius } = useUIContext();
  const styles = useMemo(() => getStyles(colors, spacing, radius), [colors, radius, spacing]);
  const isDisabled = disabled || loading;

  const getContainerStyle = ({ pressed }: PressableStateCallbackType): StyleProp<ViewStyle> => {
    const pressedStyle = pressed ? styles[`${variant}Pressed`] : undefined;

    return [
      styles.root,
      styles[size],
      styles[variant],
      pressedStyle,
      fullWidth && styles.fullWidth,
      isDisabled && styles.disabled,
      style,
    ];
  };

  const foregroundColor = variant === 'primary' || variant === 'danger' ? colors.textOnPrimary : colors.primary;

  return (
    <Pressable
      accessibilityLabel={title}
      accessibilityRole="button"
      accessibilityState={{ busy: loading, disabled: isDisabled }}
      disabled={isDisabled}
      onPress={onPress}
      style={getContainerStyle}
    >
      <View
        accessibilityElementsHidden={loading}
        importantForAccessibility={loading ? 'no-hide-descendants' : 'auto'}
        style={[styles.content, loading && styles.loadingContent]}
      >
        {leftElement}
        <Typography color={foregroundColor} variant="button">
          {title}
        </Typography>
        {rightElement}
      </View>
      {loading ? (
        <View pointerEvents="none" style={styles.loaderOverlay}>
          <Loader color={foregroundColor} />
        </View>
      ) : null}
    </Pressable>
  );
};
