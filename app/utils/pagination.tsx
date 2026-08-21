import { useState, useMemo, useCallback } from "react";

export function usePagination<T>(items: T[], pageSize = 16) {
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil((items?.length || 0) / pageSize));
  const paginated = useMemo(() => {
    const start = (page - 1) * pageSize;
    return (items || []).slice(start, start + pageSize);
  }, [items, page]);
  const reset = useCallback(() => setPage(1), []);
  return { page, setPage, totalPages, paginated, reset };
}
