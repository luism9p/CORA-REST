// src/pedidos/composables/useShiftStats.js
// Deriva las estadísticas del turno a partir del mismo array reactivo de
// pedidos que ya trae useOrdersRealtime — sin otro fetch aparte.
import { computed } from "vue";

export function useShiftStats(orders) {
  const totalRevenue = computed(() =>
    orders.value.reduce((sum, o) => sum + Number(o.total || 0), 0)
  );

  const bestSeller = computed(() => {
    const counts = {};
    for (const order of orders.value) {
      for (const item of order.order_items || []) {
        const nombre = item.menu_item?.nombre;
        if (!nombre) continue;
        counts[nombre] = (counts[nombre] || 0) + item.cantidad;
      }
    }
    let best = null;
    for (const [nombre, cantidad] of Object.entries(counts)) {
      if (!best || cantidad > best.cantidad) best = { nombre, cantidad };
    }
    return best;
  });

  return { totalRevenue, bestSeller };
}
