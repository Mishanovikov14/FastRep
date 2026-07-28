export const reportsQueryKeys = {
  all: ['reports'] as const,
  detail: (id: string) => ['reports', 'detail', id] as const,
  details: () => ['reports', 'detail'] as const,
  list: (limit: number) => ['reports', 'list', { limit }] as const,
  lists: () => ['reports', 'list'] as const,
};
