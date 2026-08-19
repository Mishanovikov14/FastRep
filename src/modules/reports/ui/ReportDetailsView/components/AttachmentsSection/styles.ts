import { StyleSheet } from 'react-native';

import type { Colors, Radius, Spacing } from '@/UIProvider/theme/types';
import { scaleHorizontal, scaleVertical } from '@/utils/scaling';

export const getStyles = (colors: Colors, radius: Radius, spacing: Spacing) => {
  return StyleSheet.create({
    addAction: {
      flexBasis: '48%',
      flexGrow: 1,
    },
    addActions: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: scaleHorizontal(spacing.sm),
    },
    assetCard: {
      alignItems: 'center',
      borderColor: colors.border,
      borderRadius: scaleHorizontal(radius.md),
      borderWidth: StyleSheet.hairlineWidth,
      flexDirection: 'row',
      gap: scaleHorizontal(spacing.sm),
      padding: scaleHorizontal(spacing.sm),
    },
    assetInfo: { alignItems: 'center', flex: 1, flexDirection: 'row', gap: scaleHorizontal(spacing.sm) },
    assetText: { flex: 1, gap: scaleVertical(spacing.xs) },
    failedAssetCard: {
      backgroundColor: `${colors.error}0D`,
      borderColor: colors.error,
    },
    headingRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
    iconButton: {
      alignItems: 'center',
      borderRadius: scaleHorizontal(radius.sm),
      justifyContent: 'center',
      minHeight: scaleHorizontal(38),
      minWidth: scaleHorizontal(38),
    },
    itemActions: { gap: scaleVertical(spacing.xs) },
    progressFill: { backgroundColor: colors.primary, borderRadius: 2, height: 4 },
    progressTrack: { backgroundColor: colors.primaryLight, borderRadius: 2, height: 4, overflow: 'hidden' },
    recordingRow: {
      alignItems: 'center',
      backgroundColor: colors.primaryLight,
      borderRadius: scaleHorizontal(radius.md),
      flexDirection: 'row',
      justifyContent: 'space-between',
      padding: scaleHorizontal(spacing.sm),
    },
    section: { gap: scaleVertical(spacing.md) },
    thumbnail: { borderRadius: scaleHorizontal(radius.sm), height: scaleVertical(48), width: scaleHorizontal(48) },
    typeIcon: {
      alignItems: 'center',
      backgroundColor: colors.primaryLight,
      borderRadius: scaleHorizontal(radius.sm),
      height: scaleHorizontal(44),
      justifyContent: 'center',
      width: scaleHorizontal(44),
    },
  });
};
