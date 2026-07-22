import { Suspense } from "react";
import { Box, CircularProgress, Typography, Button, Paper } from "@mui/material";

export function RouteSkeleton() {
  return (
    <Box sx={{ display: "grid", placeItems: "center", py: 10 }}>
      <Box sx={{ width: 28, height: 28, borderRadius: "50%", border: "3px solid", borderColor: "primary.main", borderTopColor: "transparent", animation: "spin 1s linear infinite" }} />
    </Box>
  );
}

export function RouteErrorBoundary({ error, resetErrorBoundary }: { error: Error; resetErrorBoundary: () => void }) {
  return (
    <Box sx={{ maxWidth: 600, mx: "auto", p: { xs: 2, md: 4 } }}>
      <Paper sx={{ p: 4, textAlign: "center" }}>
        <Typography variant="h5" sx={{ mb: 1 }}>Ocurrió un error</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          {error.message || "Error inesperado al cargar esta vista."}
        </Typography>
        <Button variant="contained" onClick={resetErrorBoundary}>Reintentar</Button>
      </Paper>
    </Box>
  );
}

export function withRouteGuard(ui: React.ReactNode, error?: Error | null, onRetry?: () => void) {
  if (error) {
    return <RouteErrorBoundary error={error} resetErrorBoundary={onRetry || (() => location.reload())} />;
  }
  return <Suspense fallback={<RouteSkeleton />}>{ui}</Suspense>;
}
