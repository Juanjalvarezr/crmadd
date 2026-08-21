import React from "react";
import { Typography, Paper } from "@mui/material";

interface Props {
  title: string;
  children: React.ReactNode;
}

export const ConfigTabPanel: React.FC<Props> = ({ title, children }) => (
  <Paper sx={{ p: { xs: 2, sm: 3 }, borderRadius: 2 }}>
    <Typography variant="h6" sx={{ mb: 3, fontWeight: "bold" }}>{title}</Typography>
    {children}
  </Paper>
);
