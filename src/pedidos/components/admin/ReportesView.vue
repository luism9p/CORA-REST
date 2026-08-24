<script setup>
import { computed } from "vue";
import { useShiftReport, PAYMENT_METHOD_LABEL } from "@/pedidos/composables/useShiftReport";
import { formatCurrency } from "@/pedidos/utils/format";
import { downloadCsv } from "@/pedidos/utils/csv";

const props = defineProps({
  orders: { type: Array, required: true },
  tableNumero: { type: Function, required: true },
});

// Identidad → color fijo (nunca por posición/monto): así el color de
// "Efectivo" no cambia según qué método haya facturado más ese día.
const PAYMENT_METHOD_COLOR = {
  efectivo: "#cc0000",
  tarjeta: "#2a78d6",
  plin: "#1baf7a",
};
const FALLBACK_COLOR = "#898781";

const ordersRef = computed(() => props.orders);
const { completedOrders, totalIngresos, totalPropinas, ticketPromedio, byPaymentMethod } =
  useShiftReport(ordersRef);

const donutGradient = computed(() => {
  if (totalIngresos.value === 0) return null;
  let cumulative = 0;
  const stops = byPaymentMethod.value.map((entry) => {
    const start = cumulative;
    cumulative += entry.percent;
    const color = PAYMENT_METHOD_COLOR[entry.method] || FALLBACK_COLOR;
    return `${color} ${start}% ${cumulative}%`;
  });
  return `conic-gradient(${stops.join(", ")})`;
});

function methodColor(method) {
  return PAYMENT_METHOD_COLOR[method] || FALLBACK_COLOR;
}

function formatTime(iso) {
  return new Intl.DateTimeFormat("es-PE", {
    timeZone: "America/Lima",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

function orderDetail(order) {
  return (order.order_items || [])
    .map((i) => `${i.cantidad}x ${i.menu_item?.nombre || "?"}`)
    .join("; ");
}

function exportCsv() {
  const headers = ["Hora", "Mesa", "Detalle del Pedido", "Método de Pago", "Propina", "Total"];
  const rows = completedOrders.value.map((o) => [
    formatTime(o.created_at),
    props.tableNumero(o.table_id) ?? "",
    orderDetail(o),
    PAYMENT_METHOD_LABEL[o.metodo_pago] || o.metodo_pago || "",
    Number(o.propina || 0).toFixed(2),
    Number(o.total || 0).toFixed(2),
  ]);
  const today = new Date().toISOString().slice(0, 10);
  downloadCsv(`cierre-caja-${today}.csv`, headers, rows);
}
</script>

<template>
  <div class="admin-reportes">
    <div class="admin-reportes__cards">
      <div class="admin-reportes__card">
        <span class="admin-reportes__card-label">Ingresos brutos</span>
        <span class="admin-reportes__card-value">{{ formatCurrency(totalIngresos) }}</span>
      </div>
      <div class="admin-reportes__card">
        <span class="admin-reportes__card-label">Propinas</span>
        <span class="admin-reportes__card-value">{{ formatCurrency(totalPropinas) }}</span>
      </div>
      <div class="admin-reportes__card">
        <span class="admin-reportes__card-label">Ticket promedio</span>
        <span class="admin-reportes__card-value">{{ formatCurrency(ticketPromedio) }}</span>
      </div>
    </div>

    <section class="admin-reportes__breakdown">
      <h2 class="admin-reportes__section-title">Desglose por método de pago</h2>

      <p v-if="completedOrders.length === 0" class="admin-reportes__empty">
        Todavía no hay pedidos entregados hoy.
      </p>
      <div v-else class="admin-reportes__breakdown-body">
        <div class="admin-reportes__donut" :style="{ background: donutGradient }">
          <div class="admin-reportes__donut-hole">
            <span class="admin-reportes__donut-total">{{ formatCurrency(totalIngresos) }}</span>
            <span class="admin-reportes__donut-caption">Total</span>
          </div>
        </div>

        <ul class="admin-reportes__legend">
          <li v-for="entry in byPaymentMethod" :key="entry.method" class="admin-reportes__legend-row">
            <span class="admin-reportes__legend-dot" :style="{ background: methodColor(entry.method) }"></span>
            <span class="admin-reportes__legend-label">{{ entry.label }}</span>
            <span class="admin-reportes__legend-value">{{ formatCurrency(entry.total) }}</span>
            <span class="admin-reportes__legend-percent">{{ entry.percent.toFixed(0) }}%</span>
          </li>
        </ul>
      </div>
    </section>

    <button
      type="button"
      class="admin-reportes__export"
      :disabled="completedOrders.length === 0"
      @click="exportCsv"
    >
      ⬇ Exportar CSV
    </button>
  </div>
</template>

<style scoped>
.admin-reportes__cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.75rem;
  margin-bottom: 1.5rem;
}

.admin-reportes__card {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  padding: 1rem;
  border-radius: 1rem;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
}

.admin-reportes__card-label {
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-muted);
}

.admin-reportes__card-value {
  font-size: 1.15rem;
  font-weight: 800;
  color: var(--color-text);
}

.admin-reportes__section-title {
  font-size: 1rem;
  font-weight: 800;
  margin-bottom: 1rem;
}

.admin-reportes__breakdown {
  padding: 1.25rem;
  border-radius: 1rem;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  margin-bottom: 1.5rem;
}

.admin-reportes__empty {
  color: var(--color-muted);
  font-size: 0.9rem;
}

.admin-reportes__breakdown-body {
  display: flex;
  align-items: center;
  gap: 1.75rem;
  flex-wrap: wrap;
}

.admin-reportes__donut {
  width: 9rem;
  height: 9rem;
  border-radius: 50%;
  position: relative;
  flex-shrink: 0;
}

.admin-reportes__donut-hole {
  position: absolute;
  inset: 22%;
  border-radius: 50%;
  background: var(--color-surface);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
}

.admin-reportes__donut-total {
  font-size: 0.85rem;
  font-weight: 800;
  color: var(--color-text);
}

.admin-reportes__donut-caption {
  font-size: 0.65rem;
  color: var(--color-muted);
}

.admin-reportes__legend {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  flex: 1;
  min-width: 12rem;
}

.admin-reportes__legend-row {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  font-size: 0.9rem;
}

.admin-reportes__legend-dot {
  width: 0.7rem;
  height: 0.7rem;
  border-radius: 9999px;
  flex-shrink: 0;
}

.admin-reportes__legend-label {
  font-weight: 700;
  color: var(--color-text);
}

.admin-reportes__legend-value {
  margin-left: auto;
  color: var(--color-text);
  font-weight: 600;
}

.admin-reportes__legend-percent {
  color: var(--color-muted);
  font-size: 0.8rem;
  min-width: 2.5rem;
  text-align: right;
}

.admin-reportes__export {
  width: 100%;
  min-height: 3rem;
  border-radius: 9999px;
  background: var(--color-primary);
  color: #fff;
  font-weight: 700;
  font-size: 0.95rem;
  transition: transform 400ms var(--ease-spring), background-color 150ms var(--ease-out), opacity 150ms;
}

.admin-reportes__export:disabled {
  opacity: 0.5;
}

.admin-reportes__export:not(:disabled):active {
  background: var(--color-primary-dark);
  transform: scale(0.97);
}
</style>
