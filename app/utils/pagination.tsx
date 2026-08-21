import { useState, useMemo, useCallback } from "react";
import { Pagination, PaginationItem, Box, Typography } from "@mui/material";

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

export function PaginationBar({ page, totalPages, onChange }: { page: number; totalPages: number; onChange: (p: number) => void }) {
  if (totalPages <= 1) return null;
  return (
    <Box sx={{ display: "flex", justifyContent: "center", mt: 2, mb: 1 }}>
      <Pagination
        count={totalPages}
        page={page}
        onChange={(_, p) => onChange(p)}
        siblingCount={1}
        boundaryCount={1}
        size="small"
        renderItem={(item) => <PaginationItem {...item} />}
      />
    </Box>
  );
}
