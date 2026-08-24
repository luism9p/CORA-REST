<script setup>
import { ref, computed, watch, onMounted } from "vue";
import { useAuth } from "@/pedidos/composables/useAuth";
import { useTables } from "@/pedidos/composables/useTables";
import { useOrdersRealtime } from "@/pedidos/composables/useOrdersRealtime";
import { useTableRequestsRealtime } from "@/pedidos/composables/useTableRequestsRealtime";
import { useOrderItems } from "@/pedidos/composables/useOrderItems";
import { useShiftStats } from "@/pedidos/composables/useShiftStats";
import { supabase } from "@/pedidos/lib/supabaseClient";
import { formatCurrency } from "@/pedidos/utils/format";

import LoadingSpinner from "@/pedidos/components/common/LoadingSpinner.vue";
import PendingRequestsBanner from "@/pedidos/components/admin/PendingRequestsBanner.vue";
import ShiftStats from "@/pedidos/components/admin/ShiftStats.vue";
import FilterTabs from "@/pedidos/components/admin/FilterTabs.vue";
import TableCard from "@/pedidos/components/admin/TableCard.vue";
import OrderDetailPanel from "@/pedidos/components/admin/OrderDetailPanel.vue";
import MenuAvailability from "@/pedidos/components/admin/MenuAvailability.vue";

const { session, loading: authLoading, signOut } = useAuth();
const { tables, loading: tablesLoading } = useTables();
const { orders } = useOrdersRealtime();
const { requests, markAttended } = useTableRequestsRealtime();
const { setItemStatus } = useOrderItems();
const { totalRevenue, bestSeller } = useShiftStats(orders);

const filter = ref("todas");
const selectedTableId = ref(null);
const view = ref("mesas"); // 'mesas' | 'carta'

// Si no hay sesión, al login. Es guard client-side porque el proyecto es
// output:'static' (no hay verificación posible en el servidor). Se registra
// dentro de onMounted a propósito: Astro sigue renderizando este componente
// en el servidor aunque use client:load, y ahí `window` no existe.
onMounted(() => {
  watch(
    authLoading,
    (isLoading) => {
      if (!isLoading && !session.value) {
        window.location.href = "/admin/login";
      }
    },
    { immediate: true }
  );
});

function activeOrderFor(tableId) {
  return orders.value.find((o) => o.table_id === tableId && o.estado !== "entregado") || null;
}

const tablesWithOrders = computed(() =>
  tables.value.map((table) => ({ table, order: activeOrderFor(table.id) }))
);

const filteredTables = computed(() => {
  if (filter.value === "activas") return tablesWithOrders.value.filter((t) => t.order);
  if (filter.value === "libres") return tablesWithOrders.value.filter((t) => !t.order);
  return tablesWithOrders.value;
});

const selectedEntry = computed(
  () => tablesWithOrders.value.find((t) => t.table.id === selectedTableId.value) || null
);

const deliveredToday = computed(() => orders.value.filter((o) => o.estado === "entregado"));

function tableNumero(tableId) {
  return tables.value.find((t) => t.id === tableId)?.numero;
}

async function advanceStatus(orderId, status) {
  await supabase.from("orders").update({ estado: status }).eq("id", orderId);
  // Al entregar, el pedido deja de contar como "activo" (activeOrderFor lo
  // excluye) y el panel se quedaría mostrando un order=null. Se cierra solo,
  // que además es el comportamiento esperado: ya no hay nada más que hacer
  // con ese pedido desde el detalle.
  if (status === "entregado" && selectedEntry.value?.order?.id === orderId) {
    selectedTableId.value = null;
  }
}

function selectTable(table) {
  selectedTableId.value = table.id;
}

async function handleSignOut() {
  await signOut();
  window.location.href = "/admin/login";
}
</script>

<template>
  <div class="admin-root admin-dashboard">
    <LoadingSpinner v-if="authLoading || tablesLoading" label="Cargando panel..." />

    <template v-else-if="session">
      <header class="admin-dashboard__header">
        <h1>Panel CORA</h1>
        <button type="button" class="admin-dashboard__signout" @click="handleSignOut">Salir</button>
      </header>

      <PendingRequestsBanner :requests="requests" @attend="markAttended" />

      <div class="admin-dashboard__view-tabs">
        <button
          type="button"
          class="admin-dashboard__view-tab"
          :class="{ 'admin-dashboard__view-tab--active': view === 'mesas' }"
          @click="view = 'mesas'"
        >
          Mesas
        </button>
        <button
          type="button"
          class="admin-dashboard__view-tab"
          :class="{ 'admin-dashboard__view-tab--active': view === 'carta' }"
          @click="view = 'carta'"
        >
          Carta
        </button>
      </div>

      <template v-if="view === 'mesas'">
        <ShiftStats :total-revenue="totalRevenue" :best-seller="bestSeller" />
        <FilterTabs v-model="filter" />

        <TransitionGroup tag="div" name="admin-grid" class="admin-dashboard__grid">
          <TableCard
            v-for="entry in filteredTables"
            :key="entry.table.id"
            :table="entry.table"
            :order="entry.order"
            @select="selectTable"
          />
        </TransitionGroup>

        <section v-if="deliveredToday.length" class="admin-dashboard__history">
          <h2>Entregados hoy</h2>
          <ul>
            <li v-for="o in deliveredToday" :key="o.id">
              <span>Mesa {{ tableNumero(o.table_id) }}</span>
              <span>{{ formatCurrency(o.total) }}</span>
            </li>
          </ul>
        </section>
      </template>

      <MenuAvailability v-else />

      <Transition name="admin-overlay">
        <div v-if="selectedEntry?.order" class="admin-dashboard__overlay" @click.self="selectedTableId = null">
          <OrderDetailPanel
            :order="selectedEntry.order"
            :table-numero="selectedEntry.table.numero"
            @close="selectedTableId = null"
            @advance-status="advanceStatus"
            @set-item-status="setItemStatus"
          />
        </div>
      </Transition>
    </template>
  </div>
</template>

<style>
@import "../styles/pedidos.css";
</style>

<style scoped>
.admin-dashboard {
  max-width: 64rem;
  margin: 0 auto;
  padding: 1.5rem;
}

.admin-dashboard__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.5rem;
}

.admin-dashboard__header h1 {
  font-size: 1.5rem;
  font-weight: 800;
}

.admin-dashboard__signout {
  min-height: 2.5rem;
  padding: 0 1rem;
  border-radius: 9999px;
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  font-weight: 700;
  font-size: 0.85rem;
}

.admin-dashboard__view-tabs {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1.25rem;
  border-bottom: 1px solid var(--color-border);
}

.admin-dashboard__view-tab {
  min-height: 2.75rem;
  padding: 0 0.25rem;
  font-weight: 700;
  font-size: 0.95rem;
  color: var(--color-muted);
  border-bottom: 2px solid transparent;
  margin-bottom: -1px;
}

.admin-dashboard__view-tab--active {
  color: var(--color-primary);
  border-bottom-color: var(--color-primary);
}

.admin-dashboard__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(6.5rem, 1fr));
  gap: 0.85rem;
  margin-bottom: 2rem;
}

.admin-grid-move,
.admin-grid-enter-active,
.admin-grid-leave-active {
  transition: all 400ms var(--ease-spring);
}
.admin-grid-enter-from,
.admin-grid-leave-to {
  opacity: 0;
  transform: scale(0.9);
}
.admin-grid-leave-active {
  position: absolute;
}

.admin-dashboard__history {
  border-top: 1px solid var(--color-border);
  padding-top: 1.25rem;
}

.admin-dashboard__history h2 {
  font-size: 1rem;
  font-weight: 800;
  margin-bottom: 0.75rem;
}

.admin-dashboard__history ul {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.admin-dashboard__history li {
  display: flex;
  justify-content: space-between;
  font-size: 0.9rem;
  color: var(--color-muted);
}

.admin-dashboard__overlay {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(3px);
  -webkit-backdrop-filter: blur(3px);
  padding: 1rem;
}

.admin-overlay-enter-active {
  transition: opacity 300ms var(--ease-out);
}
.admin-overlay-leave-active {
  transition: opacity 200ms var(--ease-out);
}
.admin-overlay-enter-from,
.admin-overlay-leave-to {
  opacity: 0;
}
.admin-overlay-enter-active :deep(.admin-detail) {
  transition: transform 400ms var(--ease-spring), opacity 300ms var(--ease-out);
}
.admin-overlay-enter-from :deep(.admin-detail) {
  transform: scale(0.9) translateY(1rem);
  opacity: 0;
}
</style>
