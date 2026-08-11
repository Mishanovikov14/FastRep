import NetInfo from '@react-native-community/netinfo';
import type { TFunction } from 'i18next';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { v4 as uuidv4 } from 'uuid';

import { openReportOutput, shareReportOutput } from '@/entities/report/services/reportOutputService';
import type { IReport } from '@/entities/report/types/report';
import type { IReportGeneration } from '@/entities/report/types/reportGeneration';
import { logger } from '@/libs/logger/logger';
import type { IResponse } from '@/libs/requester/IResponse';
import { toastService } from '@/libs/toast/toastService';
import {
  refreshGenerationResources,
  useCancelReportGenerationMutation,
  useEntitlementsQuery,
  useLatestReportGenerationQuery,
  useReportOutputQuery,
  useStartReportGenerationMutation,
} from '@/modules/reports/presenters/reportGenerationQueries';

interface IInput {
  hasReadyAssets: boolean;
  hasUnresolvedAssets: boolean;
  report: IReport;
  t: TFunction;
}

const generationErrorCodes = [
  'REPORT_HAS_NO_CONTENT',
  'REPORT_HAS_PENDING_UPLOADS',
  'REPORT_HAS_REJECTED_ASSETS',
  'REPORT_NOT_EDITABLE',
  'GENERATION_ALREADY_ACTIVE',
  'REPORT_TEMPORARILY_LOCKED',
  'GENERATION_CREDITS_EXHAUSTED',
  'GENERATION_DAILY_LIMIT_REACHED',
  'GENERATION_RATE_LIMITED',
  'GENERATION_DISABLED',
  'GENERATION_CREDIT_RESERVATION_FAILED',
  'GENERATION_QUEUE_UNAVAILABLE',
] as const;

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null;

const getGenerationErrorCode = (response: IResponse<unknown>): string | undefined => {
  if (generationErrorCodes.includes(response.code as (typeof generationErrorCodes)[number])) {
    return response.code;
  }

  if (generationErrorCodes.includes(response.type as (typeof generationErrorCodes)[number])) {
    return response.type;
  }

  if (isRecord(response.errors)) {
    const code = response.errors.code ?? response.errors.type;
    return typeof code === 'string' ? code : undefined;
  }

  return undefined;
};

const getLockedUntil = (response: IResponse<unknown>): string | undefined => {
  if (!isRecord(response.errors)) {
    return undefined;
  }

  const value = response.errors.lockedUntil;
  return typeof value === 'string' ? value : undefined;
};

const isUncertainGenerationError = (error: unknown): boolean => {
  if (!isRecord(error)) {
    return false;
  }

  return error.type === 'network_error' || error.type === 'timeout_error';
};

export const useReportGenerationPresenter = ({ hasReadyAssets, hasUnresolvedAssets, report, t }: IInput) => {
  const latestQuery = useLatestReportGenerationQuery(report.id);
  const entitlementsQuery = useEntitlementsQuery();
  const startMutation = useStartReportGenerationMutation(report.id);
  const cancelMutation = useCancelReportGenerationMutation(report.id);
  const outputQuery = useReportOutputQuery(report.id, true);
  const pendingIdempotencyKeyRef = useRef<string | undefined>(undefined);
  const activeGenerationIdRef = useRef<string | undefined>(undefined);
  const isAppActiveRef = useRef(AppState.currentState === 'active');
  const previousGenerationRef = useRef<Pick<IReportGeneration, 'id' | 'status'> | undefined>(undefined);
  const [lockedUntil, setLockedUntil] = useState<string | undefined>(undefined);
  const [now, setNow] = useState(Date.now());
  const [isOpeningOutput, setIsOpeningOutput] = useState(false);
  const [isSharingOutput, setIsSharingOutput] = useState(false);

  useEffect(() => {
    if (!lockedUntil) {
      return;
    }

    const interval = setInterval(() => setNow(Date.now()), 1_000);
    return () => clearInterval(interval);
  }, [lockedUntil]);

  useEffect(() => {
    if (lockedUntil && new Date(lockedUntil).getTime() <= now) {
      setLockedUntil(undefined);
    }
  }, [lockedUntil, now]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      isAppActiveRef.current = nextState === 'active';
      if (!isAppActiveRef.current) {
        activeGenerationIdRef.current = undefined;
      }
    });

    return () => subscription.remove();
  }, []);

  useEffect(() => {
    const generation = latestQuery.data;

    if (!generation) {
      previousGenerationRef.current = undefined;
      return;
    }

    const previous = previousGenerationRef.current;
    previousGenerationRef.current = { id: generation.id, status: generation.status };

    if (
      (generation.status === 'QUEUED' || generation.status === 'PROCESSING') &&
      pendingIdempotencyKeyRef.current &&
      isAppActiveRef.current
    ) {
      activeGenerationIdRef.current = generation.id;
    }

    if (previous?.id !== generation.id || previous.status === generation.status) {
      return;
    }

    logger.info('report.generation_status_changed', {
      generationStatus: generation.status,
      stage: generation.stage ?? undefined,
    });

    const wasActive = previous.status === 'QUEUED' || previous.status === 'PROCESSING';
    const isTerminal = generation.status === 'COMPLETED' || generation.status === 'FAILED' || generation.status === 'CANCELLED';

    if (!wasActive || !isTerminal) {
      return;
    }

    refreshGenerationResources(report.id).catch(() => {
      logger.warn('report.generation_resources_refresh_failed', { generationStatus: generation.status });
    });

    const ownsActiveGeneration = isAppActiveRef.current && activeGenerationIdRef.current === generation.id;
    if (generation.status === 'COMPLETED' && ownsActiveGeneration) {
      toastService.showSuccess(String(t('reports.generation.generated')));
    } else if (generation.status === 'FAILED' && ownsActiveGeneration) {
      toastService.showError(
        String(t('reports.generation.startFailed')),
        String(t('reports.generation.failedDescription')),
      );
    }

    activeGenerationIdRef.current = undefined;
  }, [latestQuery.data, report.id, t]);

  const onStartGeneration = useCallback(async () => {
    if (lockedUntil && new Date(lockedUntil).getTime() > Date.now()) {
      return;
    }

    let network;

    try {
      network = await NetInfo.fetch();
    } catch {
      logger.error('report.generation_preflight_failed', { errorCode: 'network_state_unavailable' });
      toastService.showError(String(t('reports.generation.startFailed')), String(t('reports.errors.network')));
      return;
    }

    if (network.isConnected === false || network.isInternetReachable === false) {
      logger.warn('report.generation_start_blocked', { errorCode: 'offline' });
      toastService.showError(String(t('reports.generation.startFailed')), String(t('reports.errors.network')));
      return;
    }

    try {
      const isUncertainRetry = Boolean(pendingIdempotencyKeyRef.current);
      const idempotencyKey = pendingIdempotencyKeyRef.current ?? uuidv4();
      pendingIdempotencyKeyRef.current = idempotencyKey;
      logger.debug('report.generation_idempotency_classified', {
        operation: isUncertainRetry ? 'uncertain_retry' : 'new_generation',
      });
      const response = await startMutation.mutateAsync(idempotencyKey);

      if (response.isError || !response.data) {
        const code = getGenerationErrorCode(response);
        if (code === 'REPORT_TEMPORARILY_LOCKED') {
          setLockedUntil(getLockedUntil(response));
        }

        const isUncertainResult = response.type === 'network_error' || response.type === 'timeout_error';
        if (!isUncertainResult) {
          pendingIdempotencyKeyRef.current = undefined;
        }

        logger.warn('report.generation_start_failed', {
          errorCode: code ?? response.type ?? 'unknown',
          httpStatus: response.status,
        });

        const key = generationErrorCodes.includes(code as (typeof generationErrorCodes)[number])
          ? `reports.generation.errors.${code}`
          : 'reports.generation.errors.generic';
        toastService.showError(String(t('reports.generation.startFailed')), String(t(key)));
        return;
      }

      pendingIdempotencyKeyRef.current = undefined;
      activeGenerationIdRef.current = isAppActiveRef.current ? response.data.id : undefined;
      logger.info('report.generation_started', { generationStatus: response.data.status });
    } catch (error) {
      const isUncertainResult = isUncertainGenerationError(error);
      if (!isUncertainResult) {
        pendingIdempotencyKeyRef.current = undefined;
      }
      logger.error('report.generation_start_failed', {
        errorCode: isUncertainResult ? 'uncertain_request_result' : 'local_exception',
      });
      toastService.showError(String(t('reports.generation.startFailed')), String(t('reports.generation.errors.generic')));
    }
  }, [lockedUntil, startMutation, t]);

  const onCancelGeneration = useCallback(async () => {
    const generation = latestQuery.data;
    if (!generation || generation.status !== 'QUEUED') {
      return;
    }

    try {
      const response = await cancelMutation.mutateAsync(generation.id);
      if (response.isError) {
        logger.warn('report.generation_cancel_failed', { errorCode: response.type ?? 'request_failed' });
        toastService.showError(String(t('reports.generation.cancelFailed')));
        return;
      }

      logger.info('report.generation_cancelled', { generationStatus: response.data?.status ?? 'CANCELLED' });
      await Promise.all([latestQuery.refetch(), refreshGenerationResources(report.id)]);
    } catch {
      logger.error('report.generation_cancel_failed', { errorCode: 'local_exception' });
      toastService.showError(String(t('reports.generation.cancelFailed')));
    }
  }, [cancelMutation, latestQuery, report.id, t]);

  const onOpenOutput = useCallback(async () => {
    const output = outputQuery.data;
    if (!output || isOpeningOutput) {
      return;
    }

    setIsOpeningOutput(true);
    try {
      await openReportOutput(report.id, output.generationId);
      logger.info('report.output_opened', { operation: 'open_pdf' });
    } catch {
      logger.error('report.output_open_failed', { operation: 'open_pdf' });
      toastService.showError(String(t('reports.output.openFailed')), String(t('reports.output.tryAgain')));
    } finally {
      setIsOpeningOutput(false);
    }
  }, [isOpeningOutput, outputQuery.data, report.id, t]);

  const onShareOutput = useCallback(async () => {
    const output = outputQuery.data;
    if (!output || isSharingOutput) {
      return;
    }

    setIsSharingOutput(true);
    try {
      await shareReportOutput(report.id, output.generationId, report.title);
      logger.info('report.output_shared', { operation: 'share_pdf' });
    } catch {
      logger.error('report.output_share_failed', { operation: 'share_pdf' });
      toastService.showError(String(t('reports.output.shareFailed')), String(t('reports.output.tryAgain')));
    } finally {
      setIsSharingOutput(false);
    }
  }, [isSharingOutput, outputQuery.data, report.id, report.title, t]);

  const generation = latestQuery.data;
  const isActive = generation?.status === 'QUEUED' || generation?.status === 'PROCESSING';
  const canGenerateSource = Boolean(report.notes?.trim()) || hasReadyAssets;
  const lockRemainingSeconds = lockedUntil
    ? Math.max(0, Math.ceil((new Date(lockedUntil).getTime() - now) / 1_000))
    : 0;
  const stageKey = useMemo(() => {
    const normalizedStage = generation?.stage?.toUpperCase();
    const knownStages: Record<string, string> = {
      ANALYZING_ATTACHMENTS: 'analyzing',
      CREATING_PDF: 'creatingPdf',
      FINALIZING: 'finalizing',
      GENERATING_REPORT: 'generating',
      PREPARING: 'preparing',
      TRANSCRIBING_AUDIO: 'transcribing',
    };

    if (normalizedStage && knownStages[normalizedStage]) {
      return knownStages[normalizedStage];
    }

    if (generation?.status === 'QUEUED') {
      return 'preparing';
    }
    if (generation?.status === 'COMPLETED') {
      return 'completed';
    }

    return 'generating';
  }, [generation?.stage, generation?.status]);

  return {
    canCancel: generation?.status === 'QUEUED',
    canGenerate:
      canGenerateSource &&
      !hasUnresolvedAssets &&
      !isActive &&
      lockRemainingSeconds === 0 &&
      entitlementsQuery.data?.canGenerate !== false,
    creditsAvailable: entitlementsQuery.data?.generationCredits.available,
    generation,
    hasOutput: Boolean(outputQuery.data),
    isCancelling: cancelMutation.isPending,
    isGenerating: startMutation.isPending || isActive,
    isOpeningOutput,
    isSharingOutput,
    lockRemainingSeconds,
    onCancelGeneration,
    onOpenOutput,
    onShareOutput,
    onStartGeneration,
    stageKey,
  };
};
