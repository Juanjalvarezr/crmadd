import { Chip as MuiChip, ChipProps } from '@mui/material';

const SAFE_SX: Record<string, ChipProps['sx']> = {
  success: { bgcolor: '#4caf50', color: '#ffffff', '&:hover': { bgcolor: '#43a047' } },
  error: { bgcolor: '#f44336', color: '#ffffff', '&:hover': { bgcolor: '#d32f2f' } },
  warning: { bgcolor: '#ff9800', color: '#ffffff', '&:hover': { bgcolor: '#f57c00' } },
  info: { bgcolor: '#2196f3', color: '#ffffff', '&:hover': { bgcolor: '#1976d2' } },
};

export const SafeChip = (props: ChipProps) => {
  const { color, sx, ...rest } = props;

  if (color && SAFE_SX[color]) {
    return <MuiChip {...rest} sx={{ ...SAFE_SX[color], ...sx }} />;
  }

  return <MuiChip color={color} sx={sx} {...rest} />;
};
