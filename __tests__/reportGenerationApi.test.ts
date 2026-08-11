import {
  cancelReportGeneration,
  createReportOutputDownloadUrl,
  getEntitlements,
  getLatestReportGeneration,
  getReportGeneration,
  getReportOutput,
  startReportGeneration,
} from '@/entities/report/API/reportGenerationsApi';
import { requester } from '@/libs/requester/requester';

jest.mock('@/libs/requester/requester', () => ({ requester: { request: jest.fn() } }));

describe('report generation API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(requester.request).mockResolvedValue({ isError: false, message: '' });
  });

  it('uses the supplied idempotency key when starting a generation', async () => {
    await startReportGeneration('report-1', 'operation-key');
    expect(requester.request).toHaveBeenCalledWith({
      headers: { 'Idempotency-Key': 'operation-key' },
      method: 'POST',
      url: '/reports/report-1/generations',
    });
  });

  it('uses generation status, cancel, entitlement and output endpoints', async () => {
    await getEntitlements();
    await getLatestReportGeneration('report-1');
    await getReportGeneration('report-1', 'generation-1');
    await cancelReportGeneration('report-1', 'generation-1');
    await getReportOutput('report-1');
    await createReportOutputDownloadUrl('report-1');

    expect(jest.mocked(requester.request).mock.calls.map(([request]) => request.url)).toEqual([
      '/me/entitlements',
      '/reports/report-1/generations/latest',
      '/reports/report-1/generations/generation-1',
      '/reports/report-1/generations/generation-1/cancel',
      '/reports/report-1/output',
      '/reports/report-1/output/download-url',
    ]);
  });
});
