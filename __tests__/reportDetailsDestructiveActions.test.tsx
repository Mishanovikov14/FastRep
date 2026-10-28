import type { TFunction } from 'i18next';
import React from 'react';
import ReactTestRenderer from 'react-test-renderer';

import { ReportDetailsView } from '@/modules/reports/ui/ReportDetailsView';
import { useReportDetailsViewPresenter } from '@/modules/reports/ui/ReportDetailsView/presenters/useReportDetailsViewPresenter';
import { Button } from '@/UIKit/Button';
import { CustomAlert } from '@/UIKit/CustomAlert';

jest.mock('@react-navigation/native', () => ({
  useRoute: () => ({ params: { reportId: 'report-1' } }),
}));
jest.mock('@/modules/reports/ui/ReportDetailsView/presenters/useReportDetailsViewPresenter', () => ({
  useReportDetailsViewPresenter: jest.fn(),
}));
jest.mock('@/modules/reports/ui/ReportDetailsView/components/AttachmentsSection', () => ({
  AttachmentsSection: () => null,
}));
jest.mock('@/modules/reports/ui/ReportDetailsView/components/GenerationSection', () => ({
  GenerationSection: () => null,
}));
jest.mock('@/modules/reports/ui/ReportDetailsView/components/ImagePreviewModal', () => ({
  ImagePreviewModal: () => null,
}));
jest.mock('@/modules/reports/ui/components/ReportStatusBadge', () => ({
  ReportStatusBadge: () => null,
}));
jest.mock('@/UIKit/Button', () => ({
  Button: (props: object) => {
    const ReactModule = require('react') as typeof React;
    return ReactModule.createElement('MockButton', props);
  },
}));
jest.mock('@/UIKit/CustomAlert', () => ({
  CustomAlert: (props: object) => {
    const ReactModule = require('react') as typeof React;
    return ReactModule.createElement('MockAlert', props);
  },
}));
jest.mock('@/UIKit/Header', () => ({ Header: () => null }));
jest.mock('@/UIKit/Loader', () => ({ Loader: () => null }));
jest.mock('@/UIKit/ScreenContainer', () => ({
  ScreenContainer: ({ children }: { children?: React.ReactNode }) => {
    const ReactModule = require('react') as typeof React;
    return ReactModule.createElement('MockScreenContainer', null, children);
  },
}));
jest.mock('@/UIKit/Typography', () => ({
  Typography: ({ children }: { children?: React.ReactNode }) => {
    const ReactModule = require('react') as typeof React;
    return ReactModule.createElement('MockTypography', null, children);
  },
}));
jest.mock('@/UIProvider/useUIContext', () => ({
  useUIContext: () => ({
    colors: {
      background: '#fff',
      border: '#ddd',
      primary: '#00f',
      surface: '#fff',
      textSecondary: '#777',
    },
    language: 'en',
    radius: { lg: 16, md: 12 },
    spacing: { lg: 24, md: 16, sm: 8, xl: 32, xs: 4 },
    t: ((key: string) => key) as unknown as TFunction,
  }),
}));

const noop = () => undefined;

const presenterResult = (status: 'DRAFT' | 'READY') => ({
  attachmentAccess: {
    deleteActions: [],
    deleteConfirmation: '',
    deleteTitle: '',
    imageUris: {},
    isDeleteConfirmationVisible: false,
    onClosePreview: noop,
    onDismissDeleteConfirmation: noop,
    onRequestDelete: noop,
    previewImages: [],
  },
  attachments: { assets: [], canEdit: false, localAssets: [] },
  canEditSources: status === 'DRAFT',
  deleteActions: [
    { key: 'cancel', onPress: noop, title: 'common.cancel', variant: 'secondary' as const },
    { key: 'delete', onPress: noop, title: 'reports.delete.action', variant: 'danger' as const },
  ],
  generation: {},
  isDeleteConfirmationVisible: false,
  isDuplicating: false,
  isError: false,
  isLoading: false,
  isNotFound: false,
  isRefreshing: false,
  onAttachmentsLayout: noop,
  onBack: noop,
  onEdit: noop,
  onDuplicate: noop,
  onHideDeleteConfirmation: noop,
  onRefresh: noop,
  onRetry: noop,
  onShowDeleteConfirmation: noop,
  report: {
    createdAt: '2026-08-19T10:00:00.000Z',
    id: 'report-1',
    notes: '',
    status,
    title: 'Report',
    updatedAt: '2026-08-19T10:00:00.000Z',
  },
  reportStatus: status,
  reportTitle: 'Report',
  scrollRef: { current: null },
});

describe('report destructive actions', () => {
  it.each(['DRAFT', 'READY'] as const)('uses danger styling for deleting a %s report', async (status) => {
    jest.mocked(useReportDetailsViewPresenter).mockReturnValue(presenterResult(status) as never);
    let renderer: ReactTestRenderer.ReactTestRenderer | undefined;

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(<ReportDetailsView />);
    });

    const rendered = renderer as ReactTestRenderer.ReactTestRenderer;
    const deleteButton = rendered.root
      .findAllByType(Button)
      .find((node) => node.props.title === 'reports.delete.action');
    const reportDeleteAlert = rendered.root.findAllByType(CustomAlert)[0];

    expect(deleteButton?.props.variant).toBe('danger');
    expect(reportDeleteAlert.props.actions.find((action: { key: string }) => action.key === 'delete').variant).toBe(
      'danger',
    );
  });
});
