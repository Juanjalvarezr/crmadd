import { Box, Card, Skeleton } from "@mui/material";

interface Props {
  rows?: number;
}

/**
 * Lista de carga con skeletons (espera sin spinner).
 * Móvil-first: tarjetas apiladas con avatar + líneas + acciones.
 * Respeta prefers-reduced-motion via animación desactivada.
 */
export const SkeletonList = ({ rows = 4 }: Props) => {
  const reducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }} aria-label="Cargando">
      {Array.from({ length: rows }).map((_, i) => (
        <Card key={i} sx={{ p: 2, borderRadius: 2, border: "1px solid divider", bgcolor: "background.paper" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Skeleton variant="circular" width={42} height={42} animation={reducedMotion ? false : "wave"} />
            <Box sx={{ flex: 1 }}>
              <Skeleton width="55%" height={22} animation={reducedMotion ? false : "wave"} sx={{ mb: 0.5 }} />
              <Skeleton width="35%" height={16} animation={reducedMotion ? false : "wave"} />
            </Box>
          </Box>
          <Box sx={{ mt: 1.5, display: "flex", gap: 1 }}>
            <Skeleton variant="rounded" width={80} height={20} animation={reducedMotion ? false : "wave"} />
            <Skeleton variant="rounded" width={100} height={20} animation={reducedMotion ? false : "wave"} />
          </Box>
        </Card>
      ))}
    </Box>
  );
};
