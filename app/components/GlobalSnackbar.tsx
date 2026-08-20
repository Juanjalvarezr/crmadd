import { useState } from "react";
import { Snackbar, Alert } from "@mui/material";

let anchor: any = null;
export const globalSnack = {
  show(message: string, severity: "success" | "error" | "info" | "warning" = "success") {
    if (anchor) anchor({ message, severity });
  }
};

export default function GlobalSnackbar() {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [severity, setSeverity] = useState<"success" | "error" | "info" | "warning">("success");

  anchor = ({ message, severity }: any) => {
    setMessage(message);
    setSeverity(severity);
    setOpen(true);
  };

  return (
    <Snackbar open={open} autoHideDuration={3000} onClose={() => setOpen(false)} anchorOrigin={{ vertical: "bottom", horizontal: "right" }}>
      <Alert onClose={() => setOpen(false)} severity={severity} sx={{ width: "100%" }}>{message}</Alert>
    </Snackbar>
  );
}
