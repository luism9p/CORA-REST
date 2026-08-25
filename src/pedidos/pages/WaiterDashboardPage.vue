<script setup>
// src/pedidos/pages/WaiterDashboardPage.vue
// Vista recortada del panel admin para el mesero: mismos componentes de
// mesas/pedidos que AdminDashboardPage.vue, pero sin Carta, Reportes ni
// ShiftStats (ingresos) — nada de precios/menú/estadísticas, solo lo que el
// mesero necesita para atender: ver mesas, ver pedidos, avanzar su estado y
// atender llamadas de "mesero"/"cuenta".
//
// Es la misma cuenta de admin (useAuth), no un rol nuevo: esto oculta la UI
// que un mesero no debería tocar, no la bloquea a nivel de base de datos —
// si el restaurante necesita que un mesero de verdad no pueda leer/escribir
// esas tablas aunque inspeccione la red, hace falta un sistema de roles con
// políticas RLS propias, que es un cambio aparte.
import { ref, computed, watch, onMounted } from "vue";
import { useAuth } from "@/pedidos/composables/useAuth";
import { useTables } from "@/pedidos/composables/useTables";
import { useOrdersRealtime } from "@/pedidos/composables/useOrdersRealtime";
import { useTableRequestsRealtime } from "@/pedidos/composables/useTableRequestsRealtime";
import { useOrderItems } from "@/pedidos/composables/useOrderItems";
import { supabase } from "@/pedidos/lib/supabaseClient";

import LoadingSpinner from "@/pedidos/components/common/LoadingSpinner.vue";
import PendingRequestsBanner from "@/pedidos/components/admin/PendingRequestsBanner.vue";
import FilterTabs from "@/pedidos/components/admin/FilterTabs.vue";
import TableCard from "@/pedidos/components/admin/TableCard.vue";
import OrderDetailPanel from "@/pedidos/components/admin/OrderDetailPanel.vue";
import ManualOrderPanel from "@/pedidos/components/admin/ManualOrderPanel.vue";

const { session, loading: authLoading, signOut } = useAuth();
const { tables, loading: tablesLoading } = useTables();
const { orders } = useOrdersRealtime();
const { requests, markAttended } = useTableRequestsRealtime();
const { setItemStatus } = useOrderItems();

const filter = ref("todas");
const selectedTableId = ref(null);

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

async function advanceStatus(orderId, status) {
  await supabase.from("orders").update({ estado: status }).eq("id", orderId);
  // Al marcar "entregado" el pedido deja de contar como activo y la mesa
  // queda libre en la grilla — es justo el "liberar la mesa" que pide el
  // flujo del mesero, no hace falta un botón aparte para eso.
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
    <LoadingSpinner v-if="authLoading || tablesLoading" label="Cargando..." />

    <template v-else-if="session">
      <header class="admin-dashboard__header">
        <h1>Mesero</h1>
        <button type="button" class="admin-dashboard__signout" @click="handleSignOut">Salir</button>
      </header>

      <PendingRequestsBanner :requests="requests" @attend="markAttended" />

      <FilterTabs v-model="filter" />

      <TransitionGroup
        tag="div"
        name="admin-grid"
        class="admin-dashboard__grid"
        aria-live="polite"
      >
        <TableCard
          v-for="entry in filteredTables"
          :key="entry.table.id"
          :table="entry.table"
          :order="entry.order"
          interactive
          @select="selectTable"
        />
      </TransitionGroup>

      <Transition name="admin-overlay">
        <div v-if="selectedEntry" class="admin-dashboard__overlay" @click.self="selectedTableId = null">
          <OrderDetailPanel
            v-if="selectedEntry.order"
            :order="selectedEntry.order"
            :table-numero="selectedEntry.table.numero"
            @close="selectedTableId = null"
            @advance-status="advanceStatus"
            @set-item-status="setItemStatus"
          />
          <ManualOrderPanel
            v-else
            :table="selectedEntry.table"
            @close="selectedTableId = null"
            @submitted="selectedTableId = null"
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
.admin-overlay-enter-active :deep(.admin-detail),
.admin-overlay-enter-active :deep(.manual-order) {
  transition: transform 400ms var(--ease-spring), opacity 300ms var(--ease-out);
}
.admin-overlay-enter-from :deep(.admin-detail),
.admin-overlay-enter-from :deep(.manual-order) {
  transform: scale(0.9) translateY(1rem);
  opacity: 0;
}
</style>
