// src/pedidos/composables/useKitchenQueue.js
// "Cola de salida": aplana los platos en preparación de todas las mesas
// activas en un solo arreglo cronológico, para el mini-KDS de salón.
//
// Nota de mapeo: el pedido original habla de un campo `itemStatus` en el
// carrito; en este código ese campo vive en la base de datos como
// order_items.estado (ver el commit de "despachos parciales"), así que la
// condición real es item.estado === 'preparando'. Tampoco existe un
// timestamp por ítem — todos los platos de un pedido se crean juntos al
// confirmarlo — así que "cuándo se pidió" es order.created_at, que ya es
// exacto para cada ítem de ese pedido (no una aproximación).
import { computed } from "vue";

export function useKitchenQueue(tablesWithOrders) {
  const kitchenQueue = computed(() => {
    const items = [];
    for (const { table, order } of tablesWithOrders.value) {
      if (!order) continue;
      for (const item of order.order_items || []) {
        if (item.estado !== "preparando") continue;
        items.push({
          nombrePlato: item.menu_item?.nombre || "?",
          cantidad: item.cantidad,
          numeroMesa: table.numero,
          timestamp: order.created_at,
        });
      }
    }
    return items.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  });

  return { kitchenQueue };
}
