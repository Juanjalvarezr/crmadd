import { Box, Button, IconButton, TextField, InputAdornment, Typography } from "@mui/material";
import { FiPlus, FiSearch, FiRefreshCw, FiDownload } from "react-icons/fi";
import type { ReactNode } from "react";

type Props = {
  title: string;
  onCreate?: () => void;
  onRefresh?: () => void;
  onSearch?: (term: string) => void;
  onExport?: () => void;
  searchPlaceholder?: string;
  extra?: ReactNode;
};

export function ListToolbar({ title, onCreate, onRefresh, onSearch, onExport, searchPlaceholder = "Buscar...", extra }: Props) {
  return (
    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: { xs: 1, sm: 1.5 }, flexWrap: "wrap", gap: 1 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
        <Typography variant="h6" sx={{ fontSize: { xs: '1.1rem', sm: '1.25rem' } }}>{title}</Typography>
        {onSearch && (
          <TextField
            size="small"
            placeholder={searchPlaceholder}
            onChange={(e) => onSearch(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <FiSearch size={16} />
                </InputAdornment>
              ),
            }}
          />
        )}
      </Box>
      <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
        {onRefresh && (
          <IconButton size="small" onClick={onRefresh} title="Recargar"><FiRefreshCw size={16} /></IconButton>
        )}
        {onExport && (
          <Button size="small" variant="text" startIcon={<FiDownload size={14} />} onClick={onExport}>CSV</Button>
        )}
        {extra}
        {onCreate && (
          <Button size="small" variant="contained" startIcon={<FiPlus size={14} />} onClick={onCreate}>Nuevo</Button>
        )}
      </Box>
    </Box>
  );
}
