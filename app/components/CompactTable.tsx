import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  useTheme,
  TableProps,
} from "@mui/material";

interface CompactTableProps<T> extends TableProps {
  rows: readonly T[];
  columns: {
    key: string;
    label: string;
    width?: number | string;
    align?: "left" | "right" | "center";
    render?: (row: T) => React.ReactNode;
  }[];
  getRowId: (row: T) => string | number;
  loading?: boolean;
  emptyText?: string;
  maxHeight?: number | string;
}

export function CompactTable<T>({
  rows,
  columns,
  getRowId,
  loading,
  emptyText = "Sin datos",
  maxHeight,
  ...tableProps
}: CompactTableProps<T>) {
  const theme = useTheme();

  const content = loading ? (
    <TableRow>
      <TableCell colSpan={columns.length} align="center" sx={{ py: 2 }}>
        Cargando...
      </TableCell>
    </TableRow>
  ) : rows.length === 0 ? (
    <TableRow>
      <TableCell colSpan={columns.length} align="center" sx={{ py: 2, color: "text.secondary" }}>
        {emptyText}
      </TableCell>
    </TableRow>
  ) : (
    rows.map((row) => (
      <TableRow key={getRowId(row)} hover>
        {columns.map((column) => (
          <TableCell
            key={column.key}
            align={column.align || "left"}
            sx={{
              whiteSpace: "nowrap",
              fontSize: "0.8rem",
              py: 1,
              px: 1,
              maxWidth: column.width || undefined,
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {column.render ? column.render(row) : (row as any)[column.key]}
          </TableCell>
        ))}
      </TableRow>
    ))
  );

  return (
    <TableContainer component={Paper} sx={{ borderRadius: 2, overflowX: "auto", maxHeight }}>
      <Table stickyHeader {...tableProps}>
        <TableHead>
          <TableRow>
            {columns.map((column) => (
              <TableCell
                key={column.key}
                align={column.align || "left"}
                sx={{
                  whiteSpace: "nowrap",
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                  py: 1,
                  px: 1,
                  background: theme.palette.background.default,
                  zIndex: 2,
                }}
              >
                {column.label}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>{content}</TableBody>
      </Table>
    </TableContainer>
  );
}
