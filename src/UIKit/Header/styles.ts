import { StyleSheet } from 'react-native';

import type { Colors, Spacing } from '@/UIProvider/theme/types';
import { scaleHorizontal, scaleVertical } from '@/utils/scaling';

const HEADER_CONTENT_HEIGHT = 56;
const SIDE_SLOT_WIDTH = 64;

export const getStyles = (colors: Colors, spacing: Spacing, topInset: number) => {
  const styles = StyleSheet.create({
    backButton: {
      alignItems: 'center',
      height: scaleVertical(44),
      justifyContent: 'center',
      width: scaleHorizontal(44),
    },
    backButtonPressed: {
      opacity: 0.55,
    },
    content: {
      alignItems: 'center',
      flexDirection: 'row',
      height: scaleVertical(HEADER_CONTENT_HEIGHT),
      justifyContent: 'space-between',
      paddingHorizontal: scaleHorizontal(spacing.sm),
    },
    header: {
      backgroundColor: colors.background,
      borderBottomColor: colors.border,
      borderBottomWidth: StyleSheet.hairlineWidth,
      paddingTop: topInset,
      width: '100%',
    },
    sideSlot: {
      alignItems: 'flex-start',
      justifyContent: 'center',
      minWidth: scaleHorizontal(SIDE_SLOT_WIDTH),
      zIndex: 1,
    },
    sideSlotRight: {
      alignItems: 'flex-end',
    },
    titleContainer: {
      alignItems: 'center',
      bottom: 0,
      justifyContent: 'center',
      left: scaleHorizontal(SIDE_SLOT_WIDTH),
      position: 'absolute',
      right: scaleHorizontal(SIDE_SLOT_WIDTH),
      top: 0,
    },
  });

  return styles;
};
