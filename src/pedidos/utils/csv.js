// src/pedidos/utils/csv.js

function escapeCsvCell(value) {
  const text = String(value ?? "");
  // Comillas dobles si el valor trae coma, comilla o salto de línea —
  // regla estándar de CSV (RFC 4180).
  if (/[",\n]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

export function toCsv(headers, rows) {
  const lines = [headers, ...rows].map((row) => row.map(escapeCsvCell).join(","));
  // BOM al inicio para que Excel detecte UTF-8 y no rompa los acentos/S/.
  return "﻿" + lines.join("\r\n");
}

export function downloadCsv(filename, headers, rows) {
  const blob = new Blob([toCsv(headers, rows)], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
