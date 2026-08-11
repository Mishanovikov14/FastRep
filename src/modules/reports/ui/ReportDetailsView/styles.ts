import { StyleSheet } from 'react-native';

import type { Colors, Radius, Spacing } from '@/UIProvider/theme/types';
import { scaleHorizontal, scaleVertical } from '@/utils/scaling';

export const getStyles = (colors: Colors, radius: Radius, spacing: Spacing) => {
  const styles = StyleSheet.create({
    action: {
      flex: 1,
    },
    actions: {
      flexDirection: 'row',
      gap: scaleHorizontal(spacing.sm),
    },
    card: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderRadius: scaleHorizontal(radius.lg),
      borderWidth: StyleSheet.hairlineWidth,
      gap: scaleVertical(spacing.lg),
      padding: scaleHorizontal(spacing.lg),
    },
    centered: {
      alignItems: 'center',
      flex: 1,
      gap: scaleVertical(spacing.md),
      justifyContent: 'center',
      paddingHorizontal: scaleHorizontal(spacing.xl),
    },
    content: {
      gap: scaleVertical(spacing.lg),
      paddingBottom: scaleVertical(spacing.xl),
      paddingHorizontal: scaleHorizontal(spacing.lg),
      paddingTop: scaleVertical(spacing.md),
    },
    dateRow: {
      flex: 1,
      gap: scaleVertical(spacing.xs),
    },
    metadataRow: {
      flexDirection: 'row',
      gap: scaleHorizontal(spacing.lg),
    },
    notes: {
      lineHeight: scaleVertical(24),
    },
    notesCard: {
      backgroundColor: colors.background,
      borderRadius: scaleHorizontal(radius.md),
      gap: scaleVertical(spacing.sm),
      padding: scaleHorizontal(spacing.md),
    },
    reportTitle: {
      flex: 1,
    },
    titleRow: {
      alignItems: 'flex-start',
      flexDirection: 'row',
      gap: scaleHorizontal(spacing.sm),
      justifyContent: 'space-between',
    },
  });

  return styles;
};
