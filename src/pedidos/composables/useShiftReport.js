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

  return { completedOrders, totalIngresos, totalPropinas, ticketPromedio, byPaymentMethod };
}
