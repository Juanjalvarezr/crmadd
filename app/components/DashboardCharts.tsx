import {
  LineChart, Line, BarChart, Bar, PieChart, Pie,
  XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
} from "recharts";

type ChartProps = { data: any[]; height?: number; color?: string };

export function FacturacionChart({ data, height = 260, color = "#E91E63" }: ChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="mes" />
        <YAxis />
        <RechartsTooltip />
        <Legend />
        <Line type="monotone" dataKey="monto" stroke={color} strokeWidth={2} />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function PipelineChart({ data, height = 220, color = "#9C27B0" }: ChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="etapa" />
        <YAxis />
        <RechartsTooltip />
        <Bar dataKey="valor" fill={color} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function ProyectosPie({ data, height = 220 }: ChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart data={data}>
        <RechartsTooltip />
        <Legend />
        <Pie dataKey="value" />
      </PieChart>
    </ResponsiveContainer>
  );
}
