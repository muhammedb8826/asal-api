export type ListQuery = {
  page: number;
  limit: number;
  sortBy?: string;
  search?: string;
  filters: Record<string, unknown>;
};

const RESERVED_KEYS = new Set([
  'page',
  'limit',
  'sortBy',
  'sort',
  'q',
  'search',
]);

export function parseListQuery(query?: Record<string, unknown>): ListQuery {
  const pageRaw = query?.page;
  const limitRaw = query?.limit;
  const toNumber = (value: unknown, fallback: number): number => {
    if (typeof value === 'string') {
      const n = Number.parseInt(value, 10);
      return Number.isFinite(n) ? n : fallback;
    }
    if (typeof value === 'number') return value;
    return fallback;
  };
  const page = toNumber(pageRaw, 1);
  const limit = toNumber(limitRaw, 10);

  const sortBy =
    (typeof query?.sortBy === 'string' && query?.sortBy) ||
    (typeof query?.sort === 'string' && query?.sort) ||
    undefined;
  const search =
    (typeof query?.q === 'string' && query?.q) ||
    (typeof query?.search === 'string' && query?.search) ||
    undefined;

  const filters: Record<string, unknown> = {};
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (!RESERVED_KEYS.has(key)) {
        filters[key] = value;
      }
    }
  }

  return { page, limit, sortBy, search, filters };
}
