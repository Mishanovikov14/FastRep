import { StyleSheet } from 'react-native';

import type { Colors, Radius, Spacing } from '@/UIProvider/theme/types';
import { scaleHorizontal, scaleVertical } from '@/utils/scaling';

export const getStyles = (colors: Colors, radius: Radius, spacing: Spacing) => {
  return StyleSheet.create({
    addActions: { flexDirection: 'row', flexWrap: 'wrap', gap: scaleHorizontal(spacing.sm) },
    assetCard: {
      alignItems: 'center',
      borderColor: colors.border,
      borderRadius: scaleHorizontal(radius.md),
      borderWidth: 1,
      flexDirection: 'row',
      gap: scaleHorizontal(spacing.sm),
      padding: scaleHorizontal(spacing.sm),
    },
    assetInfo: { alignItems: 'center', flex: 1, flexDirection: 'row', gap: scaleHorizontal(spacing.sm) },
    assetText: { flex: 1, gap: scaleVertical(spacing.xs) },
    itemActions: { gap: scaleVertical(spacing.xs) },
    progressFill: { backgroundColor: colors.primary, borderRadius: 2, height: 4 },
    progressTrack: { backgroundColor: colors.primaryLight, borderRadius: 2, height: 4, overflow: 'hidden' },
    recordingRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
    section: { gap: scaleVertical(spacing.md) },
    thumbnail: { borderRadius: scaleHorizontal(radius.sm), height: scaleVertical(48), width: scaleHorizontal(48) },
    typeBadge: {
      backgroundColor: colors.primaryLight,
      borderRadius: scaleHorizontal(radius.sm),
      paddingHorizontal: scaleHorizontal(spacing.sm),
      paddingVertical: scaleVertical(spacing.xs),
    },
  });
};
