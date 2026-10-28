import type { TFunction } from 'i18next';
import React from 'react';
import ReactTestRenderer from 'react-test-renderer';

import type { ILocalReportAsset, IReportAsset } from '@/entities/report/types/reportAsset';
import { AttachmentsSection } from '@/modules/reports/ui/ReportDetailsView/components/AttachmentsSection';
import { GenerationSection } from '@/modules/reports/ui/ReportDetailsView/components/GenerationSection';
import { Button } from '@/UIKit/Button';
import { Typography } from '@/UIKit/Typography';

jest.mock('@/UIKit/Button', () => {
  const ReactModule = require('react') as typeof React;

  return { Button: (props: object) => ReactModule.createElement('MockButton', props) };
});
jest.mock('@/UIKit/Typography', () => {
  const ReactModule = require('react') as typeof React;

  return {
    Typography: ({ children, ...props }: { children?: React.ReactNode }) =>
      ReactModule.createElement('MockTypography', props, children),
  };
});
jest.mock('@/UIKit/Loader', () => {
  const ReactModule = require('react') as typeof React;

  return { Loader: () => ReactModule.createElement('MockLoader') };
});
jest.mock('@/UIProvider/useUIContext', () => ({
  useUIContext: () => ({
    colors: {
      background: '#fff',
      border: '#ddd',
      error: '#f00',
      primary: '#00f',
      primaryLight: '#eef',
      textSecondary: '#777',
    },
    radius: { md: 12, sm: 8 },
    spacing: { md: 16, sm: 8, xs: 4 },
    t: ((key: string) => key) as unknown as TFunction,
  }),
}));

const noop = () => undefined;
const asyncNoop = async () => undefined;
const rejectedImage: IReportAsset = {
  createdAt: '2026-08-12T10:00:00.000Z',
  declaredMimeType: 'image/jpeg',
  declaredSize: 1024,
  id: 'rejected-image',
  originalFileName: 'roof.jpg',
  position: 0,
  reportId: 'report-1',
  status: 'REJECTED',
  type: 'IMAGE',
  updatedAt: '2026-08-12T10:00:00.000Z',
};
const failedLocalImage: ILocalReportAsset = {
  displayName: 'Photo 2',
  errorCode: 'IMAGE_HEIC_CONVERSION_FAILED',
  fileName: 'roof.heic',
  id: 'local-image',
  mimeType: 'image/heic',
  ownership: 'SYSTEM_OWNED',
  progress: 0,
  size: 1024,
  status: 'FAILED',
  type: 'IMAGE',
  uri: 'file:///cache/roof.heic',
};

const renderAttachments = async (canEdit: boolean) => {
  let renderer: ReactTestRenderer.ReactTestRenderer | undefined;

  await ReactTestRenderer.act(async () => {
    renderer = ReactTestRenderer.create(
      <AttachmentsSection
        assets={[rejectedImage]}
        canEdit={canEdit}
        imageUris={{}}
        isLoading={false}
        isRecording={false}
        localAssets={[failedLocalImage]}
        onAddDocument={noop}
        onAddPhoto={noop}
        onCancelRecording={noop}
        onOpenAsset={noop}
        onRemoveLocalAsset={noop}
        onRemoveServerAsset={noop}
        onRetryRejectedAsset={noop}
        onRetryUpload={noop}
        onStartRecording={noop}
        onStopRecording={noop}
        onTakePhoto={noop}
        onToggleAudio={noop}
        playback={{ durationSeconds: 0, isPlaying: false, positionSeconds: 0 }}
        recordingDuration={0}
      />,
    );
  });

  return renderer as ReactTestRenderer.ReactTestRenderer;
};

describe('report lifecycle UI', () => {
  it('shows Open PDF, Share, and Duplicate for READY without generation actions', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer | undefined;
    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(
        <GenerationSection
          canCancel={false}
          canGenerate={false}
          hasOutput
          isCancelling={false}
          isDuplicating={false}
          isGenerating={false}
          isOpeningOutput={false}
          isSharingOutput={false}
          lockRemainingSeconds={0}
          onCancelGeneration={noop}
          onDuplicate={noop}
          onOpenOutput={asyncNoop}
          onShareOutput={asyncNoop}
          onStartGeneration={asyncNoop}
          reportStatus="READY"
          stageKey="completed"
        />,
      );
    });
    const titles = renderer?.root.findAllByType(Button).map((node) => node.props.title);

    expect(titles).toEqual(['reports.output.open', 'reports.output.share', 'reports.duplicate.action']);
    expect(titles).not.toContain('reports.generation.generate');
    expect(titles).not.toContain('reports.generation.retry');

    const actions = renderer?.root.findByProps({ testID: 'report-output-actions' });
    const secondaryActions = renderer?.root.findByProps({ testID: 'report-output-secondary-actions' });
    const openButton = renderer?.root.findAllByType(Button).find((node) => node.props.title === 'reports.output.open');
    expect(openButton?.props.fullWidth).toBe(true);
    expect(actions?.findAllByType(Button).map((node) => node.props.title)).toEqual([
      'reports.output.open',
      'reports.output.share',
      'reports.duplicate.action',
    ]);
    expect(secondaryActions?.findAllByType(Button).map((node) => node.props.title)).toEqual([
      'reports.output.share',
      'reports.duplicate.action',
    ]);
  });

  it('updates visible generation progress without changing action layout', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer | undefined;
    const generation = {
      createdAt: '2026-08-12T10:00:00.000Z',
      id: 'generation-1',
      progress: 25,
      reportId: 'report-1',
      status: 'PROCESSING' as const,
      updatedAt: '2026-08-12T10:00:00.000Z',
    };
    const renderSection = (progress: number) => (
      <GenerationSection
        canCancel={false}
        canGenerate={false}
        generation={{ ...generation, progress }}
        hasOutput={false}
        isCancelling={false}
        isDuplicating={false}
        isGenerating
        isOpeningOutput={false}
        isSharingOutput={false}
        lockRemainingSeconds={0}
        onCancelGeneration={noop}
        onDuplicate={noop}
        onOpenOutput={asyncNoop}
        onShareOutput={asyncNoop}
        onStartGeneration={asyncNoop}
        reportStatus="PROCESSING"
        stageKey="generating"
      />
    );

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(renderSection(25));
    });
    const rendered = renderer as ReactTestRenderer.ReactTestRenderer;
    const visibleText = () =>
      rendered.root
        .findAllByType(Typography)
        .map((node) => React.Children.toArray(node.props.children).join(''));

    expect(visibleText()).toContain('25%');

    await ReactTestRenderer.act(async () => {
      rendered.update(renderSection(60));
    });
    expect(visibleText()).toContain('60%');
  });

  it('freezes READY attachment controls while keeping assets readable', async () => {
    const renderer = await renderAttachments(false);
    const buttonTitles = renderer.root.findAllByType(Button).map((node) => node.props.title);
    const actionLabels = renderer.root
      .findAll((node) => typeof node.props.accessibilityLabel === 'string')
      .map((node) => node.props.accessibilityLabel);

    expect(buttonTitles).toEqual([]);
    expect(actionLabels).not.toContain('reports.attachments.retryAccessibility');
    expect(actionLabels).not.toContain('reports.attachments.deleteAccessibility');
  });

  it('keeps FAILED editing controls and exposes Try again', async () => {
    let generationRenderer: ReactTestRenderer.ReactTestRenderer | undefined;
    await ReactTestRenderer.act(async () => {
      generationRenderer = ReactTestRenderer.create(
        <GenerationSection
          canCancel={false}
          canGenerate
          generation={{
            createdAt: '2026-08-12T10:00:00.000Z',
            id: 'generation-1',
            progress: 100,
            reportId: 'report-1',
            status: 'FAILED',
            updatedAt: '2026-08-12T10:00:00.000Z',
          }}
          hasOutput={false}
          isCancelling={false}
          isDuplicating={false}
          isGenerating={false}
          isOpeningOutput={false}
          isSharingOutput={false}
          lockRemainingSeconds={0}
          onCancelGeneration={noop}
          onDuplicate={noop}
          onOpenOutput={asyncNoop}
          onShareOutput={asyncNoop}
          onStartGeneration={asyncNoop}
          reportStatus="FAILED"
          stageKey="generating"
        />,
      );
    });
    const attachmentRenderer = await renderAttachments(true);
    const generationTitles = generationRenderer?.root.findAllByType(Button).map((node) => node.props.title);
    const attachmentTitles = attachmentRenderer.root.findAllByType(Button).map((node) => node.props.title);
    const actionLabels = attachmentRenderer.root
      .findAll((node) => typeof node.props.accessibilityLabel === 'string')
      .map((node) => node.props.accessibilityLabel);

    expect(generationTitles).toContain('reports.generation.retry');
    expect(attachmentTitles).toEqual([
      'reports.attachments.photo',
      'reports.attachments.camera',
      'reports.attachments.file',
      'reports.attachments.audio',
    ]);
    expect(actionLabels).toContain('reports.attachments.retryAccessibility');
    expect(actionLabels).toContain('reports.attachments.deleteAccessibility');
  });
});
