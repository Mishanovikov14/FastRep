import { StyleSheet } from 'react-native';

import type { Colors, Radius, Spacing } from '@/UIProvider/theme/types';
import { scaleHorizontal, scaleVertical } from '@/utils/scaling';

export const getStyles = (colors: Colors, radius: Radius, spacing: Spacing) => {
  const styles = StyleSheet.create({
    failureCard: {
      backgroundColor: colors.background,
      borderColor: colors.error,
      borderRadius: scaleHorizontal(radius.md),
      borderWidth: StyleSheet.hairlineWidth,
      padding: scaleHorizontal(spacing.md),
    },
    headingRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
    lockCard: {
      backgroundColor: colors.primaryLight,
      borderRadius: scaleHorizontal(radius.md),
      gap: scaleVertical(spacing.xs),
      padding: scaleHorizontal(spacing.md),
    },
    outputAction: { flex: 1 },
    outputActions: { gap: scaleVertical(spacing.sm) },
    outputCard: {
      backgroundColor: colors.background,
      borderRadius: scaleHorizontal(radius.md),
      gap: scaleVertical(spacing.md),
      padding: scaleHorizontal(spacing.md),
    },
    outputHeading: { alignItems: 'center', flexDirection: 'row', gap: scaleHorizontal(spacing.sm) },
    outputIcon: {
      alignItems: 'center',
      backgroundColor: colors.primaryLight,
      borderRadius: scaleHorizontal(radius.md),
      height: scaleHorizontal(48),
      justifyContent: 'center',
      width: scaleHorizontal(48),
    },
    outputText: { flex: 1, gap: scaleVertical(spacing.xs) },
    outputSecondaryActions: {
      flexDirection: 'row',
      gap: scaleHorizontal(spacing.sm),
    },
    processingDot: {
      backgroundColor: colors.primary,
      borderRadius: scaleHorizontal(4),
      height: scaleHorizontal(8),
      width: scaleHorizontal(8),
    },
    progressFill: { backgroundColor: colors.primary, borderRadius: 3, height: 6 },
    progressTrack: { backgroundColor: colors.primaryLight, borderRadius: 3, height: 6, overflow: 'hidden' },
    section: { gap: scaleVertical(spacing.md) },
    statusCard: {
      backgroundColor: colors.background,
      borderRadius: scaleHorizontal(radius.md),
      gap: scaleVertical(spacing.sm),
      padding: scaleHorizontal(spacing.md),
    },
    statusHeading: { alignItems: 'center', flexDirection: 'row', gap: scaleHorizontal(spacing.sm) },
  });

  return styles;
};
