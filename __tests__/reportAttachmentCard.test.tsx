import React from 'react';
import { StyleSheet } from 'react-native';
import ReactTestRenderer from 'react-test-renderer';

import type { IReportAsset } from '@/entities/report/types/reportAsset';
import { AttachmentCard } from '@/modules/reports/ui/ReportDetailsView/components/AttachmentCard';
import { Typography } from '@/UIKit/Typography';
import { UIProvider } from '@/UIProvider/UIProvider';

const createAsset = (overrides: Partial<IReportAsset>): IReportAsset => ({
  createdAt: '2026-08-11T10:00:00.000Z',
  declaredMimeType: 'image/jpeg',
  declaredSize: 850 * 1024,
  id: 'asset-1',
  originalFileName: 'technical.jpg',
  position: 0,
  rejectionReason: null,
  reportId: 'report-1',
  status: 'READY',
  type: 'IMAGE',
  updatedAt: '2026-08-11T10:00:00.000Z',
  ...overrides,
});

const renderCard = async (overrides: Partial<React.ComponentProps<typeof AttachmentCard>> = {}) => {
  const props: React.ComponentProps<typeof AttachmentCard> = {
    asset: createAsset({}),
    canEdit: true,
    deleting: false,
    displayName: 'Photo 1',
    isAccessing: false,
    isPlaying: false,
    onDelete: jest.fn(),
    onOpen: jest.fn(),
    onRetry: jest.fn(),
    onToggleAudio: jest.fn(),
    playbackDurationSeconds: 0,
    playbackPositionSeconds: 0,
    ...overrides,
  };
  let renderer: ReactTestRenderer.ReactTestRenderer | undefined;

  await ReactTestRenderer.act(async () => {
    renderer = ReactTestRenderer.create(
      <UIProvider>
        <AttachmentCard {...props} />
      </UIProvider>,
    );
  });

  return { props, renderer: renderer as ReactTestRenderer.ReactTestRenderer };
};

describe('AttachmentCard', () => {
  it('visibly marks a rejected asset and exposes retry and trash actions', async () => {
    const { props, renderer } = await renderCard({
      asset: createAsset({ rejectionReason: 'UNSUPPORTED_ASSET_TYPE', status: 'REJECTED' }),
      rejectionDescription: 'This file type is not supported.',
    });
    const card = renderer.root.find((node) => node.props.accessibilityLabel === 'Photo 1');
    const cardStyle = StyleSheet.flatten(card.props.style({ pressed: false }));
    const retry = renderer.root.find((node) => node.props.accessibilityLabel === 'Retry Photo 1');
    const remove = renderer.root.find((node) => node.props.accessibilityLabel === 'Delete Photo 1');

    expect(cardStyle.borderColor).toBeTruthy();
    expect(renderer.root.findAllByType(Typography).some((node) => node.props.children === 'This file type is not supported.')).toBe(true);
    expect(retry.props.accessibilityRole).toBe('button');
    expect(remove.props.accessibilityRole).toBe('button');
    ReactTestRenderer.act(() => {
      retry.props.onPress();
      remove.props.onPress();
    });
    expect(props.onRetry).toHaveBeenCalledTimes(1);
    expect(props.onDelete).toHaveBeenCalledTimes(1);
    ReactTestRenderer.act(() => renderer.unmount());
  });

  it('keeps long names truncated while the trash action remains visible', async () => {
    const name = 'building-inspection-august-final-version-with-many-details.pdf';
    const { renderer } = await renderCard({
      asset: createAsset({ declaredMimeType: 'application/pdf', originalFileName: name, type: 'DOCUMENT' }),
      displayName: name,
    });
    const title = renderer.root.findAllByType(Typography).find((node) => node.props.children === name);

    expect(title?.props.numberOfLines).toBe(1);
    expect(title?.props.ellipsizeMode).toBe('middle');
    expect(renderer.root.find((node) => node.props.accessibilityLabel === `Delete ${name}`)).toBeTruthy();
    ReactTestRenderer.act(() => renderer.unmount());
  });

  it('preserves card dimensions while attachment access is loading', async () => {
    const idle = await renderCard();
    const loading = await renderCard({ isAccessing: true });
    const getCardStyle = (renderer: ReactTestRenderer.ReactTestRenderer) => {
      const card = renderer.root.find((node) => node.props.accessibilityLabel === 'Photo 1');
      return StyleSheet.flatten(card.props.style({ pressed: false }));
    };

    expect(getCardStyle(loading.renderer).minHeight).toBe(getCardStyle(idle.renderer).minHeight);
    ReactTestRenderer.act(() => {
      idle.renderer.unmount();
      loading.renderer.unmount();
    });
  });
});
