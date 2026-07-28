import type { ReactNode } from 'react';
import { useMemo } from 'react';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ArrowBackIcon } from '@/assets/icons/ArrowBackIcon';
import { Typography } from '@/UIKit/Typography';
import { useUIContext } from '@/UIProvider/useUIContext';

import { useHeader } from './presenters/useHeader';
import { getStyles } from './styles';

interface IProps {
  onBackPress?(): void;
  rightComponent?: ReactNode;
  showBackButton?: boolean;
  title: string;
}

export const Header = ({ onBackPress, rightComponent, showBackButton = false, title }: IProps) => {
  const { colors, spacing, t } = useUIContext();
  const { top } = useSafeAreaInsets();
  const styles = useMemo(() => getStyles(colors, spacing, top), [colors, spacing, top]);
  const { getBackButtonStyle, onPressBack } = useHeader({
    backButtonPressedStyle: styles.backButtonPressed,
    backButtonStyle: styles.backButton,
    onBackPress,
  });

  return (
    <View style={styles.header}>
      <View style={styles.content}>
        <View style={styles.sideSlot}>
          {showBackButton ? (
            <Pressable
              accessibilityLabel={String(t('common.back'))}
              accessibilityRole="button"
              hitSlop={8}
              onPress={onPressBack}
              style={getBackButtonStyle}
            >
              <ArrowBackIcon color={colors.textPrimary} />
            </Pressable>
          ) : null}
        </View>
        <View pointerEvents="none" style={styles.titleContainer}>
          <Typography align="center" numberOfLines={1} variant="heading">
            {title}
          </Typography>
        </View>
        <View style={[styles.sideSlot, styles.sideSlotRight]}>{rightComponent}</View>
      </View>
    </View>
  );
};
