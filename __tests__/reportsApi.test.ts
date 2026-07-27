import {
  createReport,
  deleteReport,
  getReports,
  updateReport,
} from '@/entities/report/API/reportsApi';
import { requester } from '@/libs/requester/requester';

jest.mock('@/libs/requester/requester', () => ({
  requester: {
    request: jest.fn(),
  },
}));

describe('reports API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(requester.request).mockResolvedValue({
      isError: false,
      message: '',
    });
  });

  it('sends list pagination params through the authenticated requester', async () => {
    await getReports({ limit: 20, page: 3 });

    expect(requester.request).toHaveBeenCalledWith({
      method: 'GET',
      params: { limit: 20, page: 3 },
      url: '/reports',
    });
  });

  it('sends the create payload unchanged', async () => {
    const request = { notes: 'Useful notes', title: 'Weekly report' };

    await createReport(request);

    expect(requester.request).toHaveBeenCalledWith({
      data: request,
      method: 'POST',
      url: '/reports',
    });
  });

  it('never includes status in an update payload', async () => {
    await updateReport(
      'report-1',
      {
        notes: 'Updated notes',
        status: 'READY',
        title: 'Updated title',
      } as never,
    );

    expect(requester.request).toHaveBeenCalledWith({
      data: {
        notes: 'Updated notes',
        title: 'Updated title',
      },
      method: 'PATCH',
      url: '/reports/report-1',
    });
  });

  it('sends the delete request to the report resource', async () => {
    await deleteReport('report-1');

    expect(requester.request).toHaveBeenCalledWith({
      method: 'DELETE',
      url: '/reports/report-1',
    });
  });
});
