import React from "react";

interface Props {
  children: React.ReactNode;
}

export const ConfigTabWrapper: React.FC<Props> = ({ children }) => (
  <Paper sx={{ p: { xs: 2, sm: 3 }, borderRadius: 2 }}>{children}</Paper>
);
