import type { InfiniteData } from '@tanstack/react-query';

import { duplicateReport } from '@/entities/report/API/reportsApi';
import { reportsQueryKeys } from '@/entities/report/model/reportQueryKeys';
import type { IPaginatedReports, IReport } from '@/entities/report/types/report';
import { queryClient } from '@/libs/query/QueryClient';
import { useDuplicateReportMutation } from '@/modules/reports/presenters/reportQueries';

jest.mock('@tanstack/react-query', () => ({
  useInfiniteQuery: jest.fn(),
  useMutation: jest.fn((options: unknown) => options),
  useQuery: jest.fn(),
}));
jest.mock('@/entities/report/API/reportsApi', () => ({
  createReport: jest.fn(),
  deleteReport: jest.fn(),
  duplicateReport: jest.fn(),
  getReportById: jest.fn(),
  getReports: jest.fn(),
  updateReport: jest.fn(),
}));
jest.mock('@/libs/query/QueryClient', () => ({
  queryClient: {
    invalidateQueries: jest.fn(() => Promise.resolve()),
    removeQueries: jest.fn(),
    setQueriesData: jest.fn(),
    setQueryData: jest.fn(),
  },
}));

const original: IReport = {
  createdAt: '2026-08-12T10:00:00.000Z',
  id: 'report-ready',
  notes: 'Original source',
  status: 'READY',
  title: 'Roof inspection',
  updatedAt: '2026-08-12T10:00:00.000Z',
};
const duplicate: IReport = {
  ...original,
  id: 'report-copy',
  status: 'DRAFT',
  title: 'Roof inspection — Copy',
};

interface IDuplicateMutationOptions {
  mutationFn(): ReturnType<typeof duplicateReport>;
  onSuccess(response: Awaited<ReturnType<typeof duplicateReport>>): void;
}

describe('duplicate report mutation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(duplicateReport).mockResolvedValue({ data: duplicate, isError: false, message: '' });
  });

  it('calls the endpoint, caches the new draft, invalidates lists, and preserves the original list item', async () => {
    const mutation = useDuplicateReportMutation(original.id) as unknown as IDuplicateMutationOptions;
    const response = await mutation.mutationFn();
    mutation.onSuccess(response);

    expect(duplicateReport).toHaveBeenCalledWith(original.id);
    expect(queryClient.setQueryData).toHaveBeenCalledWith(reportsQueryKeys.detail(duplicate.id), duplicate);
    expect(queryClient.setQueryData).not.toHaveBeenCalledWith(reportsQueryKeys.detail(original.id), expect.anything());
    expect(queryClient.invalidateQueries).toHaveBeenCalledWith({ queryKey: reportsQueryKeys.lists() });

    const setListsCall = jest.mocked(queryClient.setQueriesData).mock.calls[0];
    const updater = setListsCall?.[1] as (data: InfiniteData<IPaginatedReports>) => InfiniteData<IPaginatedReports>;
    const list = {
      pageParams: [1],
      pages: [{ data: [original], limit: 20, page: 1, total: 1, totalPages: 1 }],
    };

    expect(updater(list).pages[0]?.data).toEqual([duplicate, original]);
    expect(list.pages[0]?.data).toEqual([original]);
  });
});
