import { useState } from "react";

export function useExportCsv(fileName: string, headers: string[], rows: () => any[]) {
  const [exporting, setExporting] = useState(false);
  const download = () => {
    try {
      setExporting(true);
      const data = rows();
      const csv = [headers.join(","), ...data.map((r) => headers.map((h) => JSON.stringify(r[h] ?? "")).join(","))].join("\n");
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${fileName}-${new Date().toISOString().slice(0,10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  };
  return { exporting, download };
}
