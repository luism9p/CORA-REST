// src/pedidos/utils/orderStatus.js

export const STATUS_FLOW = ["nuevo", "preparando", "listo", "entregado"];

export const STATUS_LABEL = {
  nuevo: "Nuevo",
  preparando: "Preparando",
  listo: "Listo",
  entregado: "Entregado",
};

// Coinciden con las variables --color-nuevo/--color-preparando/... de pedidos.css
export const STATUS_COLOR = {
  nuevo: "var(--color-nuevo)",
  preparando: "var(--color-preparando)",
  listo: "var(--color-listo)",
  entregado: "var(--color-entregado)",
};

export function nextStatus(current) {
  const idx = STATUS_FLOW.indexOf(current);
  if (idx === -1 || idx === STATUS_FLOW.length - 1) return null;
  return STATUS_FLOW[idx + 1];
}

// Estado de cada plato dentro de un pedido (despachos parciales): permite
// que en mesas grandes el cliente vea qué platos ya están en su mesa aunque
// el pedido completo todavía no se haya marcado como "Entregado".
export const ITEM_STATUS_FLOW = ["preparando", "listo_para_servir", "en_mesa"];

export const ITEM_STATUS_LABEL = {
  preparando: "Preparando",
  listo_para_servir: "Listo para servir",
  en_mesa: "En la mesa",
};
