import { StyleSheet } from 'react-native';

import type { Colors, Radius, Spacing } from '@/UIProvider/theme/types';
import { scaleHorizontal, scaleVertical } from '@/utils/scaling';

export const getStyles = (colors: Colors, radius: Radius, spacing: Spacing) => {
  return StyleSheet.create({
    action: { flexGrow: 1 },
    actions: { flexDirection: 'row', flexWrap: 'wrap', gap: scaleHorizontal(spacing.sm) },
    headingRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
    lockCard: {
      backgroundColor: colors.primaryLight,
      borderRadius: scaleHorizontal(radius.md),
      gap: scaleVertical(spacing.xs),
      padding: scaleHorizontal(spacing.md),
    },
    progressFill: { backgroundColor: colors.primary, borderRadius: 3, height: 6 },
    progressTrack: { backgroundColor: colors.primaryLight, borderRadius: 3, height: 6, overflow: 'hidden' },
    section: { gap: scaleVertical(spacing.md) },
    statusCard: {
      borderColor: colors.border,
      borderRadius: scaleHorizontal(radius.md),
      borderWidth: 1,
      gap: scaleVertical(spacing.sm),
      padding: scaleHorizontal(spacing.md),
    },
  });
};
