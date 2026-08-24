// src/pedidos/composables/useShiftReport.js
// Cierre de caja diario: se calcula solo sobre pedidos ya entregados (dinero
// realmente cobrado), a partir del mismo array reactivo de useOrdersRealtime
// — sin otro fetch aparte.
import { computed } from "vue";

export const PAYMENT_METHOD_LABEL = {
  efectivo: "Efectivo",
  plin: "Plin",
  tarjeta: "Tarjeta",
};

export function useShiftReport(orders) {
  const completedOrders = computed(() => orders.value.filter((o) => o.estado === "entregado"));

  const totalIngresos = computed(() =>
    completedOrders.value.reduce((sum, o) => sum + Number(o.total || 0), 0)
  );

  const totalPropinas = computed(() =>
    completedOrders.value.reduce((sum, o) => sum + Number(o.propina || 0), 0)
  );

  const ticketPromedio = computed(() =>
    completedOrders.value.length === 0 ? 0 : totalIngresos.value / completedOrders.value.length
  );

  const byPaymentMethod = computed(() => {
    const totals = new Map();
    for (const o of completedOrders.value) {
      const method = o.metodo_pago || "otro";
      totals.set(method, (totals.get(method) || 0) + Number(o.total || 0));
    }
    return Array.from(totals.entries())
      .map(([method, total]) => ({
        method,
        label: PAYMENT_METHOD_LABEL[method] || method,
        total,
        percent: totalIngresos.value === 0 ? 0 : (total / totalIngresos.value) * 100,
      }))
      .sort((a, b) => b.total - a.total);
  });

  // Efectivo vs. todo lo demás (Plin, Tarjeta) — vista rápida de cuánto del
  // día hay que cuadrar en caja física vs. lo que ya liquidó la pasarela.
  const efectivoVsDigital = computed(() => {
    let efectivo = 0;
    let digital = 0;
    for (const entry of byPaymentMethod.value) {
      if (entry.method === "efectivo") efectivo += entry.total;
      else digital += entry.total;
    }
    const total = efectivo + digital;
    return {
      efectivo,
      digital,
      efectivoPercent: total === 0 ? 0 : (efectivo / total) * 100,
      digitalPercent: total === 0 ? 0 : (digital / total) * 100,
    };
  });

  const topProducts = computed(() => {
    const counts = new Map();
    for (const o of completedOrders.value) {
      for (const item of o.order_items || []) {
        const nombre = item.menu_item?.nombre;
        if (!nombre) continue;
        counts.set(nombre, (counts.get(nombre) || 0) + item.cantidad);
      }
    }
    return Array.from(counts.entries())
      .map(([nombre, cantidad]) => ({ nombre, cantidad }))
      .sort((a, b) => b.cantidad - a.cantidad)
      .slice(0, 5);
  });

  return {
    completedOrders,
    totalIngresos,
    totalPropinas,
    ticketPromedio,
    byPaymentMethod,
    efectivoVsDigital,
    topProducts,
  };
}
