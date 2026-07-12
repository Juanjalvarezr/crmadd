import { useTheme as useMuiTheme } from '@mui/material';

export const useCompactStyles = () => {
  const muiTheme = useMuiTheme();
  const isMobile = muiTheme.breakpoints.down('sm');
  return {
    cardPadding: { xs: 1.5, sm: 2 },
    paperPadding: { xs: 1.5, sm: 2 },
    containerPadding: { xs: 1, sm: 1.5 },
    gap: { xs: 1, sm: 1.5 },
    fontSize: { xs: '0.8rem', sm: '0.875rem' },
    chipHeight: { xs: 20, sm: 22 },
    chipFontSize: { xs: '0.65rem', sm: '0.7rem' },
  };
};
