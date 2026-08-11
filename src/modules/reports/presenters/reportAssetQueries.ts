import { useMutation, useQuery } from '@tanstack/react-query';

import { deleteReportAsset, getReportAssets } from '@/entities/report/API/reportAssetsApi';
import { reportsQueryKeys } from '@/entities/report/model/reportQueryKeys';
import { ReportRequestError } from '@/entities/report/model/ReportRequestError';
import { queryClient } from '@/libs/query/QueryClient';

export const useReportAssetsQuery = (reportId: string) => {
  return useQuery({
    queryFn: async () => {
      const response = await getReportAssets(reportId);

      if (response.isError || !response.data) {
        throw new ReportRequestError(response);
      }

      return response.data;
    },
    queryKey: reportsQueryKeys.assets(reportId),
  });
};

export const useDeleteReportAssetMutation = (reportId: string) => {
  return useMutation({
    mutationFn: (assetId: string) => deleteReportAsset(reportId, assetId),
    onSuccess: (response) => {
      if (!response.isError || response.status === 404) {
        queryClient.invalidateQueries({ queryKey: reportsQueryKeys.assets(reportId) }).catch(() => undefined);
      }
    },
  });
};
