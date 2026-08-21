// src/pedidos/utils/format.js

const currencyFormatter = new Intl.NumberFormat("es-PE", {
  style: "currency",
  currency: "PEN",
});

export function formatCurrency(amount) {
  return currencyFormatter.format(Number(amount) || 0);
}
