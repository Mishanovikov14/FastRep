export const reportsQueryKeys = {
  all: ['reports'] as const,
  assets: (id: string) => ['reports', id, 'assets'] as const,
  detail: (id: string) => ['reports', 'detail', id] as const,
  details: () => ['reports', 'detail'] as const,
  list: (limit: number) => ['reports', 'list', { limit }] as const,
  lists: () => ['reports', 'list'] as const,
  generation: (id: string, generationId: string) => ['reports', id, 'generation', generationId] as const,
  generationLatest: (id: string) => ['reports', id, 'generation', 'latest'] as const,
  output: (id: string) => ['reports', id, 'output'] as const,
};

export const entitlementsQueryKeys = {
  all: ['entitlements'] as const,
};
