export interface PaginatedResponse<T> {
  items: T[];
  nextCursor: string | null;
  hasMore: boolean;
  total?: number;
}

export interface CursorPaginationParams {
  cursor?: string;
  limit: number;
}

export interface OffsetPaginationParams {
  page: number;
  limit: number;
}

export function getOffsetPagination(searchParams: URLSearchParams): OffsetPaginationParams {
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") ?? 20)));
  return { page, limit };
}

export function getCursorPagination(searchParams: URLSearchParams): CursorPaginationParams {
  const cursor = searchParams.get("cursor") ?? undefined;
  const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") ?? 20)));
  return { cursor, limit };
}

export async function cursorPage<T extends { id: string }>(
  findMany: (args: {
    take: number;
    skip?: number;
    cursor?: { id: string };
    orderBy: Record<string, "asc" | "desc">;
  }) => Promise<T[]>,
  params: CursorPaginationParams,
  orderBy: Record<string, "asc" | "desc"> = { id: "desc" }
): Promise<PaginatedResponse<T>> {
  const take = params.limit + 1;
  const items = await findMany({
    take,
    ...(params.cursor ? { cursor: { id: params.cursor }, skip: 1 } : {}),
    orderBy,
  });

  const hasMore = items.length > params.limit;
  const result = hasMore ? items.slice(0, params.limit) : items;
  const nextCursor = hasMore ? result[result.length - 1]?.id ?? null : null;

  return { items: result, nextCursor, hasMore };
}

export function buildPrismaPagination<T extends { id: string }>(
  pagination: OffsetPaginationParams
): { skip: number; take: number } {
  return {
    skip: (pagination.page - 1) * pagination.limit,
    take: pagination.limit,
  };
}

export type { PaginatedResponse as PaginatedResponseClient } from "./pagination";
