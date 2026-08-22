import { Card, CardContent, Typography, Box } from "@mui/material";

interface Props {
  title: string;
  value: string | number;
  subtitle?: string;
  color?: string;
  icon?: React.ReactNode;
  trend?: { value: number; label?: string };
  onClick?: () => void;
}

export const CompactStatCard = ({ title, value, subtitle, color = "#1976d2", icon, trend, onClick }: Props) => (
  <Card
    onClick={onClick}
    sx={{
      height: "100%",
      borderRadius: 1.5,
      border: "1px solid",
      borderColor: "divider",
      bgcolor: "background.paper",
      transition: "transform 0.15s ease, box-shadow 0.15s ease",
      cursor: onClick ? "pointer" : "default",
      "&:hover": onClick ? { transform: "translateY(-2px)", boxShadow: 2 } : {},
    }}
  >
    <CardContent sx={{ p: { xs: 1.25, sm: 1.5 }, "&:last-child": { pb: { xs: 1.25, sm: 1.5 } } }}>
      <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", mb: 0.75 }}>
        <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.3, fontSize: "0.65rem" }}>
          {title}
        </Typography>
        {icon && <Box sx={{ color, opacity: 0.8, display: "flex", alignItems: "center" }}>{icon}</Box>}
      </Box>
      <Typography variant="h6" sx={{ fontSize: { xs: "1.1rem", sm: "1.25rem" }, fontWeight: 700, lineHeight: 1.2, mb: 0.25 }}>
        {value}
      </Typography>
      {subtitle && (
        <Typography variant="caption" sx={{ color: "text.secondary", fontSize: "0.7rem" }}>
          {subtitle}
        </Typography>
      )}
      {trend && (
        <Box sx={{ mt: 0.5, display: "flex", alignItems: "center", gap: 0.5 }}>
          <Typography variant="caption" sx={{ color: trend.value >= 0 ? "success.main" : "error.main", fontWeight: 600, fontSize: "0.7rem" }}>
            {trend.value >= 0 ? "+" : ""}{trend.value}%
          </Typography>
          {trend.label && (
            <Typography variant="caption" sx={{ color: "text.secondary", fontSize: "0.65rem" }}>
              {trend.label}
            </Typography>
          )}
        </Box>
      )}
    </CardContent>
  </Card>
);
