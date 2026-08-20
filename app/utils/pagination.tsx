import { useState, useMemo } from "react";
import { Box, Pagination, PaginationItem } from "@mui/material";

export function usePagination<T>(items: T[], pageSize = 10) {
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const paginated = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return items.slice(start, start + pageSize);
  }, [items, safePage, pageSize]);

  const reset = () => setPage(1);

  return { page: safePage, setPage, totalPages, paginated, reset, pageSize };
}

export function PaginationBar({ page, totalPages, onChange }: { page: number; totalPages: number; onChange: (p: number) => void }) {
  if (totalPages <= 1) return null;
  return (
    <Box sx={{ display: "flex", justifyContent: "center", mt: 1.5, mb: 0.5 }}>
      <Pagination
        count={totalPages}
        page={page}
        onChange={(_, p) => onChange(p)}
        size="small"
        siblingCount={1}
        boundaryCount={1}
        renderItem={(item) => <PaginationItem {...item} />}
      />
    </Box>
  );
}
