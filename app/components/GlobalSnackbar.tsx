import { useState, useCallback } from "react";
import { Snackbar, Alert } from "@mui/material";

let anchor: ((v: { open: boolean; message: string; severity: "success" | "error" | "info" | "warning" }) => void) | null = null;

export const globalSnack = {
  show(message: string, severity?: "success" | "error" | "info" | "warning", _title?: string) {
    if (anchor) anchor({ open: true, message, severity: severity || "info" });
  },
};

export default function GlobalSnackbar() {
  const [open, setOpen] = useState({ open: false, message: "", severity: "info" as "success" | "error" | "info" | "warning" });

  anchor = useCallback((v: typeof open) => setOpen(v), []);

  return (
    <Snackbar
      open={open.open}
      autoHideDuration={3000}
      onClose={() => setOpen((s) => ({ ...s, open: false }))}
      anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
    >
      <Alert severity={open.severity} onClose={() => setOpen((s) => ({ ...s, open: false }))} sx={{ width: "100%" }}>
        {open.message}
      </Alert>
    </Snackbar>
  );
}
