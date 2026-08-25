<script setup>
import { ref, computed, onMounted, onUnmounted } from "vue";
import { useTables } from "@/pedidos/composables/useTables";
import { useOrdersRealtime } from "@/pedidos/composables/useOrdersRealtime";
import { useKitchenQueue } from "@/pedidos/composables/useKitchenQueue";
import { supabase } from "@/pedidos/lib/supabaseClient";
import LoadingSpinner from "@/pedidos/components/common/LoadingSpinner.vue";

const { tables, loading: tablesLoading } = useTables();
const { orders, loading: ordersLoading } = useOrdersRealtime();

const tablesWithOrders = computed(() =>
  tables.value.map((table) => ({
    table,
    order: orders.value.find((o) => o.table_id === table.id && o.estado !== "entregado") || null,
  }))
);

const { kitchenQueue } = useKitchenQueue(tablesWithOrders);

// Un ticket por mesa, no por plato: la cocina despacha la mesa entera de
// una vez, no plato por plato. Todos los ítems de una misma mesa comparten
// en la práctica el mismo pedido activo, así que el timestamp del ticket
// es el más antiguo del grupo (por si alguna vez conviven dos timestamps
// distintos, ver la nota de useKitchenQueue.js sobre adiciones al pedido).
const tableGroups = computed(() => {
  const byMesa = new Map();
  for (const item of kitchenQueue.value) {
    let group = byMesa.get(item.numeroMesa);
    if (!group) {
      group = { numeroMesa: item.numeroMesa, timestamp: item.timestamp, items: [] };
      byMesa.set(item.numeroMesa, group);
    } else if (new Date(item.timestamp) < new Date(group.timestamp)) {
      group.timestamp = item.timestamp;
    }
    group.items.push(item);
  }
  return Array.from(byMesa.values()).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
});

// Cronómetro en vivo: se recalcula cada segundo, no cada minuto (a
// diferencia del SLA del panel admin) — acá es el elemento central de la
// cabecera de cada ticket, así que tiene que sentirse corriendo de verdad.
const now = ref(Date.now());
let intervalId = null;

onMounted(() => {
  intervalId = setInterval(() => {
    now.value = Date.now();
  }, 1000);
});

onUnmounted(() => clearInterval(intervalId));

function elapsedLabel(timestamp) {
  const totalSeconds = Math.max(0, Math.floor((now.value - new Date(timestamp).getTime()) / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

// Feedback optimista: el botón se apaga apenas se toca, sin esperar a que la
// suscripción realtime baje el cambio y la tarjeta desaparezca de
// tableGroups. En una pantalla de cocina, un doble toque accidental no debe
// reenviar el update dos veces. El try/finally libera el botón si algo
// falla a mitad de camino, en vez de dejarlo bloqueado para siempre.
const dispatchingTables = ref(new Set());

async function dispatchTable(group) {
  if (dispatchingTables.value.has(group.numeroMesa)) return;
  dispatchingTables.value.add(group.numeroMesa);
  try {
    // /cocina corre sin login (anon) a propósito, y order_items no tiene
    // policy de UPDATE para ese rol — solo para `authenticated` (ver
    // OrderDetailPanel.vue, que sí puede hacer el update directo porque
    // corre logueado). Por eso esto pasa por un RPC angosto en vez de
    // supabase.from("order_items").update(...): dispatch_order_items()
    // solo permite la transición preparando -> listo_para_servir, nada más.
    await supabase.rpc("dispatch_order_items", {
      p_item_ids: group.items.map((item) => item.id),
    });
  } finally {
    dispatchingTables.value.delete(group.numeroMesa);
  }
}
</script>

<template>
  <div class="kds-root">
    <LoadingSpinner v-if="tablesLoading || ordersLoading" label="Cargando cocina..." />

    <template v-else>
      <header class="kds-header">
        <h1>🔥 Cocina</h1>
        <span class="kds-header__count">{{ kitchenQueue.length }} platos en preparación</span>
      </header>

      <p v-if="tableGroups.length === 0" class="kds-empty">No hay pedidos en preparación.</p>

      <div v-else class="kds-grid">
        <article
          v-for="group in tableGroups"
          :key="group.numeroMesa"
          class="kds-card"
          :class="{ 'kds-card--dispatching': dispatchingTables.has(group.numeroMesa) }"
        >
          <div class="kds-card__header">
            <span class="kds-card__mesa">Mesa {{ group.numeroMesa }}</span>
            <span class="kds-card__timer">⏱ {{ elapsedLabel(group.timestamp) }}</span>
          </div>

          <ul class="kds-card__items">
            <li v-for="item in group.items" :key="item.id" class="kds-item">
              <div class="kds-item__row">
                <span class="kds-item__qty">[ {{ item.cantidad }}x ]</span>
                <span class="kds-item__name">{{ item.nombrePlato }}</span>
              </div>
              <p v-if="item.nota" class="kds-item__nota">📝 {{ item.nota }}</p>
            </li>
          </ul>

          <button
            type="button"
            class="kds-card__dispatch"
            :disabled="dispatchingTables.has(group.numeroMesa)"
            @click="dispatchTable(group)"
          >
            {{ dispatchingTables.has(group.numeroMesa) ? "Enviando..." : "Despachar Mesa" }}
          </button>
        </article>
      </div>
    </template>
  </div>
</template>

<style>
@import "../styles/pedidos.css";
</style>

<style scoped>
/* Panel siempre oscuro: no depende del toggle claro/oscuro del cliente ni
   del panel admin (ambos usan .mesa-theme-root / .admin-root, que son
   claros por defecto) — esta es una pantalla fija de cocina, pensada para
   quedar prendida todo el turno junto a la plancha. Paleta zinc/emerald
   (no la marca roja de CORA): un KDS necesita leerse a distancia y sin
   fatiga visual en un turno largo, no reforzar identidad de marca. */
.kds-root {
  --color-bg: #18181b;
  --color-surface: #27272a;
  --color-border: #3f3f46;
  --color-text: #f4f4f5;
  --color-muted: #a1a1aa;

  min-height: 100vh;
  background: var(--color-bg);
  color: var(--color-text);
  font-family: system-ui, -apple-system, sans-serif;
  padding: 1.5rem;
  box-sizing: border-box;
}

.kds-root * {
  box-sizing: border-box;
}

.kds-header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 1.5rem;
}

.kds-header h1 {
  font-size: 1.75rem;
  font-weight: 800;
  margin: 0;
}

.kds-header__count {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--color-muted);
}

.kds-empty {
  text-align: center;
  font-size: 1.25rem;
  color: var(--color-muted);
  padding: 4rem 1rem;
}

.kds-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(20rem, 1fr));
  gap: 1.25rem;
}

.kds-card {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 0.75rem;
  padding: 1.25rem;
  transition: opacity 200ms ease-out;
}

.kds-card--dispatching {
  opacity: 0.5;
}

.kds-card__header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.75rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid var(--color-border);
}

.kds-card__mesa {
  font-size: 1.6rem;
  font-weight: 800;
  line-height: 1;
}

.kds-card__timer {
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--color-muted);
  font-variant-numeric: tabular-nums; /* los dígitos no deben "bailar" de ancho cada segundo */
  white-space: nowrap;
}

.kds-card__items {
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
}

.kds-item__row {
  display: flex;
  align-items: baseline;
  gap: 0.6rem;
}

.kds-item__qty {
  flex-shrink: 0;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
  color: var(--color-text);
}

.kds-item__name {
  font-size: 1.1rem;
  font-weight: 600;
  line-height: 1.25;
}

.kds-item__nota {
  margin: 0.2rem 0 0;
  font-size: 0.85rem;
  font-style: italic;
  /* Amarillo tenue: opacidad reducida en vez de un amarillo neón — es una
     acotación del pedido, no una alerta que deba competir con el nombre
     del plato. */
  color: rgb(234 179 8 / 75%);
}

.kds-card__dispatch {
  margin-top: 0.25rem;
  min-height: 3.5rem;
  border: none;
  border-radius: 0.75rem;
  background: #059669;
  color: #fff;
  font-size: 1.1rem;
  font-weight: 700;
  cursor: pointer;
  transition: background-color 150ms ease-out, opacity 150ms ease-out;
}

.kds-card__dispatch:hover:not(:disabled) {
  background: #047857;
}

.kds-card__dispatch:disabled {
  cursor: default;
  opacity: 0.6;
}

.kds-card__dispatch:focus-visible {
  outline: 3px solid #34d399;
  outline-offset: 2px;
}
</style>
