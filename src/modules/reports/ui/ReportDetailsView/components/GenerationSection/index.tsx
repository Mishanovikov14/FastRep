import { useMemo } from 'react';
import { View } from 'react-native';

import { PdfIcon } from '@/assets/icons/PdfIcon';
import type { IReportGeneration } from '@/entities/report/types/reportGeneration';
import { Button } from '@/UIKit/Button';
import { Typography } from '@/UIKit/Typography';
import { useUIContext } from '@/UIProvider/useUIContext';

import { getStyles } from './styles';

interface IProps {
  canCancel: boolean;
  canGenerate: boolean;
  creditsAvailable?: number;
  generation?: IReportGeneration | null;
  hasOutput: boolean;
  isCancelling: boolean;
  isGenerating: boolean;
  isOpeningOutput: boolean;
  isSharingOutput: boolean;
  lockRemainingSeconds: number;
  onCancelGeneration(): void;
  onOpenOutput(): void;
  onShareOutput(): void;
  onStartGeneration(): void;
  stageKey: string;
}

export const GenerationSection = ({
  canCancel,
  canGenerate,
  creditsAvailable,
  generation,
  hasOutput,
  isCancelling,
  isGenerating,
  isOpeningOutput,
  isSharingOutput,
  lockRemainingSeconds,
  onCancelGeneration,
  onOpenOutput,
  onShareOutput,
  onStartGeneration,
  stageKey,
}: IProps) => {
  const { colors, radius, spacing, t } = useUIContext();
  const styles = useMemo(() => getStyles(colors, radius, spacing), [colors, radius, spacing]);
  const progress = Math.max(0, Math.min(100, generation?.progress ?? 0));
  const isActive = generation?.status === 'QUEUED' || generation?.status === 'PROCESSING';

  return (
    <View style={styles.section}>
      <View style={styles.headingRow}>
        <Typography variant="heading">{t('reports.generation.title')}</Typography>
        {creditsAvailable !== undefined ? (
          <Typography color={colors.textSecondary} variant="caption">
            {t('reports.generation.credits', { count: creditsAvailable })}
          </Typography>
        ) : null}
      </View>
      {lockRemainingSeconds > 0 ? (
        <View style={styles.lockCard}>
          <Typography variant="heading">{t('reports.generation.lock.title')}</Typography>
          <Typography color={colors.textSecondary}>
            {t('reports.generation.lock.message', { minutes: Math.ceil(lockRemainingSeconds / 60) })}
          </Typography>
        </View>
      ) : null}
      {isActive || (isGenerating && !generation) ? (
        <View style={styles.statusCard}>
          <View style={styles.statusHeading}>
            <View style={styles.processingDot} />
            <Typography>{t(`reports.generation.stages.${stageKey}`)}</Typography>
          </View>
          {progress > 0 ? (
            <>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${progress}%` }]} />
              </View>
              <Typography color={colors.textSecondary} variant="caption">{progress}%</Typography>
            </>
          ) : null}
        </View>
      ) : null}
      {generation?.status === 'FAILED' ? (
        <View style={styles.failureCard}>
          <Typography color={colors.error}>{t('reports.generation.failedDescription')}</Typography>
        </View>
      ) : null}
      {hasOutput ? (
        <View style={styles.outputCard}>
          <View style={styles.outputHeading}>
            <View style={styles.outputIcon}>
              <PdfIcon color={colors.primary} />
            </View>
            <View style={styles.outputText}>
              <Typography variant="heading">{t('reports.generation.outputReady')}</Typography>
              <Typography color={colors.textSecondary} variant="caption">
                PDF
              </Typography>
            </View>
          </View>
          <View style={styles.outputActions}>
            <Button
              loading={isOpeningOutput}
              onPress={onOpenOutput}
              style={styles.outputAction}
              title={String(t('reports.output.open'))}
            />
            <Button
              loading={isSharingOutput}
              onPress={onShareOutput}
              style={styles.outputAction}
              title={String(t('reports.output.share'))}
              variant="secondary"
            />
          </View>
        </View>
      ) : !isGenerating && generation?.status !== 'FAILED' ? (
        <Typography color={colors.textSecondary}>{t('reports.generation.description')}</Typography>
      ) : null}
      {canCancel ? (
        <Button
          fullWidth
          loading={isCancelling}
          onPress={onCancelGeneration}
          title={String(t('reports.generation.cancel'))}
          variant="secondary"
        />
      ) : null}
      {!isGenerating ? (
        <Button
          disabled={!canGenerate}
          fullWidth
          onPress={onStartGeneration}
          title={String(
            t(
              generation?.status === 'FAILED'
                ? 'reports.generation.retry'
                : hasOutput
                  ? 'reports.generation.regenerate'
                  : 'reports.generation.generate',
            ),
          )}
          variant={hasOutput ? 'secondary' : 'primary'}
        />
      ) : null}
    </View>
  );
};
