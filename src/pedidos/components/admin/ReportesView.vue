<script setup>
import { ref, computed } from "vue";
import { useShiftReport, PAYMENT_METHOD_LABEL } from "@/pedidos/composables/useShiftReport";
import { formatCurrency } from "@/pedidos/utils/format";
import { downloadCsv } from "@/pedidos/utils/csv";
import ReportOrderModal from "./ReportOrderModal.vue";

const props = defineProps({
  orders: { type: Array, required: true },
  tableNumero: { type: Function, required: true },
});

const selectedOrder = ref(null);
const orderModalOpen = ref(false);

function openOrder(order) {
  selectedOrder.value = order;
  orderModalOpen.value = true;
}

// Identidad → color fijo (nunca por posición/monto): así el color de
// "Efectivo" no cambia según qué método haya facturado más ese día.
const PAYMENT_METHOD_COLOR = {
  efectivo: "#cc0000",
  tarjeta: "#2a78d6",
  plin: "#1baf7a", // pedidos históricos previos al cambio a "Yape/Plin"
  "Yape/Plin": "#eb6834", // validado junto a los otros 3 (dataviz skill)
};
const FALLBACK_COLOR = "#898781";

const ordersRef = computed(() => props.orders);
const {
  completedOrders,
  totalIngresos,
  totalPropinas,
  ticketPromedio,
  byPaymentMethod,
  efectivoVsDigital,
  topProducts,
} = useShiftReport(ordersRef);

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
  // " | " y no "; " — el CSV ahora usa ";" como delimitador de columnas,
  // así que un separador interno igual sería confuso de leer a simple
  // vista aunque las comillas lo mantengan técnicamente válido.
  return (order.order_items || [])
    .map((i) => `${i.cantidad}x ${i.menu_item?.nombre || "?"}`)
    .join(" | ");
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
  // Fila final de sumatoria: mismas columnas que el resto, con las primeras
  // vacías, "TOTAL" en Método de Pago, y las sumas ya calculadas arriba
  // (totalPropinas/totalIngresos) en vez de volver a recorrer los pedidos.
  rows.push(["", "", "", "TOTAL", totalPropinas.value.toFixed(2), totalIngresos.value.toFixed(2)]);

  const today = new Date().toISOString().slice(0, 10);
  // Columna 2 ("Detalle del Pedido") siempre entre comillas: es texto libre
  // que puede traer comas (nombres de platos, modificadores) — con ";" como
  // delimitador ya no rompería la fila, pero igual queda más a prueba de
  // balas dejarlo explícitamente entre comillas.
  downloadCsv(`cierre-caja-${today}.csv`, headers, rows, { quoteColumns: [2] });
}
</script>

<template>
  <div class="admin-reportes">
    <div class="admin-reportes__top">
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

      <button
        type="button"
        class="admin-reportes__export"
        :disabled="completedOrders.length === 0"
        @click="exportCsv"
      >
        ⬇️ Exportar CSV
      </button>
    </div>

    <div class="admin-reportes__columns">
      <section class="admin-reportes__breakdown">
        <h2 class="admin-reportes__section-title">Desglose por método de pago</h2>

        <p v-if="completedOrders.length === 0" class="admin-reportes__empty">
          Todavía no hay pedidos entregados hoy.
        </p>
        <template v-else>
          <div class="admin-reportes__breakdown-body">
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

          <p class="admin-reportes__cash-split">
            💵 {{ efectivoVsDigital.efectivoPercent.toFixed(0) }}% efectivo · 💳
            {{ efectivoVsDigital.digitalPercent.toFixed(0) }}% digital
          </p>
        </template>
      </section>

      <section class="admin-reportes__top-products">
        <h2 class="admin-reportes__section-title">Platos más vendidos</h2>

        <p v-if="topProducts.length === 0" class="admin-reportes__empty">
          Todavía no hay pedidos entregados hoy.
        </p>
        <ol v-else class="admin-reportes__top-products-list">
          <li v-for="(product, index) in topProducts" :key="product.nombre">
            <span class="admin-reportes__top-products-rank">{{ index + 1 }}</span>
            <span class="admin-reportes__top-products-name">{{ product.nombre }}</span>
            <span class="admin-reportes__top-products-qty">{{ product.cantidad }}</span>
          </li>
        </ol>
      </section>
    </div>

    <section v-if="completedOrders.length > 0" class="admin-reportes__history">
      <h2 class="admin-reportes__section-title">Historial del día</h2>
      <div class="admin-reportes__table-scroll">
        <table class="admin-reportes__table">
          <thead>
            <tr>
              <th>Hora</th>
              <th>Mesa</th>
              <th>Método</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="o in completedOrders"
              :key="o.id"
              class="admin-reportes__table-row"
              tabindex="0"
              @click="openOrder(o)"
              @keydown.enter="openOrder(o)"
            >
              <td>{{ formatTime(o.created_at) }}</td>
              <td>Mesa {{ tableNumero(o.table_id) }}</td>
              <td>{{ PAYMENT_METHOD_LABEL[o.metodo_pago] || o.metodo_pago }}</td>
              <td>{{ formatCurrency(o.total) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <ReportOrderModal
      :open="orderModalOpen"
      :order="selectedOrder"
      :table-numero="selectedOrder ? tableNumero(selectedOrder.table_id) : null"
      @close="orderModalOpen = false"
    />
  </div>
</template>

<style scoped>
.admin-reportes__top {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  flex-wrap: wrap;
  margin-bottom: 1.5rem;
}

.admin-reportes__cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.75rem;
  flex: 1;
  min-width: 16rem;
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

.admin-reportes__columns {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

@media (max-width: 640px) {
  .admin-reportes__columns {
    grid-template-columns: 1fr;
  }
}

.admin-reportes__breakdown,
.admin-reportes__top-products {
  padding: 1.25rem;
  border-radius: 1rem;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
}

.admin-reportes__top-products-list {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.admin-reportes__top-products-list li {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  font-size: 0.9rem;
}

.admin-reportes__top-products-rank {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.5rem;
  height: 1.5rem;
  border-radius: 9999px;
  background: var(--color-bg);
  color: var(--color-muted);
  font-size: 0.75rem;
  font-weight: 800;
  flex-shrink: 0;
}

.admin-reportes__top-products-name {
  font-weight: 700;
  color: var(--color-text);
}

.admin-reportes__top-products-qty {
  margin-left: auto;
  color: var(--color-muted);
  font-weight: 600;
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

.admin-reportes__cash-split {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid var(--color-border);
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--color-muted);
}

.admin-reportes__history {
  padding: 1.25rem;
  border-radius: 1rem;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  margin-bottom: 1.5rem;
}

.admin-reportes__table-scroll {
  overflow-x: auto;
}

.admin-reportes__table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9rem;
}

.admin-reportes__table thead {
  background: #f9fafb;
}

.admin-reportes__table th {
  text-align: left;
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-muted);
  padding: 0.6rem 0.5rem;
  white-space: nowrap;
}

.admin-reportes__table td {
  padding: 0.65rem 0.5rem;
  border-top: 1px solid var(--color-border);
  color: var(--color-text);
  white-space: nowrap;
}

.admin-reportes__table th:last-child,
.admin-reportes__table td:last-child {
  text-align: right;
}

.admin-reportes__table-row {
  cursor: pointer;
  transition: background-color 150ms var(--ease-out);
}

.admin-reportes__table-row:hover,
.admin-reportes__table-row:focus-visible {
  background: var(--color-bg);
}

.admin-reportes__table-row:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: -2px;
}

.admin-reportes__export {
  flex-shrink: 0;
  min-height: 2.75rem;
  padding: 0 1.1rem;
  border-radius: 9999px;
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  color: var(--color-text);
  font-weight: 700;
  font-size: 0.85rem;
  white-space: nowrap;
  transition: transform 400ms var(--ease-spring), border-color 150ms var(--ease-out), opacity 150ms;
}

.admin-reportes__export:disabled {
  opacity: 0.5;
}

.admin-reportes__export:not(:disabled):active {
  border-color: var(--color-primary);
  transform: scale(0.96);
}
</style>
