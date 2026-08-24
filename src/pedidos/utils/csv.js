// src/pedidos/utils/csv.js
// Separador ";" (no ",") porque Excel en español usa la coma como separador
// decimal, así que interpreta "," como parte del número/texto en vez de como
// límite de columna — con eso, un CSV separado por comas se abre entero en
// la primera columna. Con ";" como delimitador, Excel-ES sí reconoce las
// columnas al abrir el archivo directamente (doble clic), no solo al
// importarlo manualmente eligiendo el delimitador.

function escapeCsvCell(value, forceQuote = false) {
  const text = String(value ?? "");
  // Comillas dobles si el valor trae el delimitador, una comilla o un salto
  // de línea — regla estándar de CSV (RFC 4180), adaptada al nuevo
  // delimitador. `forceQuote` envuelve el valor igual aunque no las
  // necesite, para columnas de texto libre (ej. "Detalle del Pedido") que
  // conviene dejar siempre entre comillas.
  const needsQuote = forceQuote || /[";\n]/.test(text);
  if (needsQuote) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

export function toCsv(headers, rows, { quoteColumns = [] } = {}) {
  const quoted = new Set(quoteColumns);
  const formatRow = (row) => row.map((cell, i) => escapeCsvCell(cell, quoted.has(i))).join(";");
  const lines = [headers, ...rows].map(formatRow);
  // BOM al inicio: sin esto, Excel-ES puede no detectar UTF-8 y muestra las
  // tildes/"Método de Pago" como caracteres raros.
  return "\uFEFF" + lines.join("\r\n");
}

export function downloadCsv(filename, headers, rows, options) {
  const blob = new Blob([toCsv(headers, rows, options)], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
