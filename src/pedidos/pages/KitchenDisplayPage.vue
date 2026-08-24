<script setup>
import { ref, computed } from "vue";
import { useTables } from "@/pedidos/composables/useTables";
import { useOrdersRealtime } from "@/pedidos/composables/useOrdersRealtime";
import { useOrderItems } from "@/pedidos/composables/useOrderItems";
import { useKitchenQueue } from "@/pedidos/composables/useKitchenQueue";
import LoadingSpinner from "@/pedidos/components/common/LoadingSpinner.vue";

const { tables, loading: tablesLoading } = useTables();
const { orders, loading: ordersLoading } = useOrdersRealtime();
const { setItemStatus } = useOrderItems();

const tablesWithOrders = computed(() =>
  tables.value.map((table) => ({
    table,
    order: orders.value.find((o) => o.table_id === table.id && o.estado !== "entregado") || null,
  }))
);

const { kitchenQueue } = useKitchenQueue(tablesWithOrders);

// Feedback optimista: el botón se apaga apenas se toca, sin esperar a que la
// suscripción realtime baje el cambio y el ítem desaparezca de kitchenQueue.
// En una pantalla de cocina, un doble toque accidental no debe reenviar el
// update dos veces.
const dispatching = ref(new Set());

async function dispatch(item) {
  if (dispatching.value.has(item.id)) return;
  dispatching.value.add(item.id);
  await setItemStatus(item.id, "listo_para_servir");
}
</script>

<template>
  <div class="kds-root">
    <LoadingSpinner v-if="tablesLoading || ordersLoading" label="Cargando cocina..." />

    <template v-else>
      <header class="kds-header">
        <h1>🔥 Cocina</h1>
        <span class="kds-header__count">{{ kitchenQueue.length }} en preparación</span>
      </header>

      <p v-if="kitchenQueue.length === 0" class="kds-empty">No hay platos en preparación.</p>

      <div v-else class="kds-grid">
        <article
          v-for="item in kitchenQueue"
          :key="item.id"
          class="kds-card"
          :class="{ 'kds-card--dispatching': dispatching.has(item.id) }"
        >
          <span class="kds-card__mesa">Mesa {{ item.numeroMesa }}</span>
          <h2 class="kds-card__plato">{{ item.nombrePlato }}</h2>
          <span class="kds-card__cantidad">x{{ item.cantidad }}</span>
          <p v-if="item.nota" class="kds-card__nota">📝 {{ item.nota }}</p>

          <button
            type="button"
            class="kds-card__dispatch"
            :disabled="dispatching.has(item.id)"
            @click="dispatch(item)"
          >
            {{ dispatching.has(item.id) ? "Enviando..." : "✅ Despachar" }}
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
   quedar prendida todo el turno junto a la plancha. */
.kds-root {
  --color-bg: #121212;
  --color-surface: #1e1e1e;
  --color-primary: #cc0000;
  --color-text: #f5f5f5;
  --color-muted: #9a9a9a;
  --color-border: #333333;

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
  grid-template-columns: repeat(auto-fill, minmax(17rem, 1fr));
  gap: 1.25rem;
}

.kds-card {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 1rem;
  padding: 1.5rem;
  transition: opacity 200ms ease-out;
}

.kds-card--dispatching {
  opacity: 0.5;
}

.kds-card__mesa {
  align-self: flex-start;
  background: var(--color-primary);
  color: #fff;
  font-size: 1.1rem;
  font-weight: 800;
  padding: 0.3rem 0.9rem;
  border-radius: 9999px;
}

.kds-card__plato {
  font-size: 1.75rem;
  font-weight: 800;
  line-height: 1.15;
  margin: 0.25rem 0 0;
}

.kds-card__cantidad {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-muted);
}

.kds-card__nota {
  font-size: 1.15rem;
  font-weight: 600;
  color: #ffd166;
  background: rgba(255, 209, 102, 0.1);
  border-radius: 0.5rem;
  padding: 0.5rem 0.75rem;
  margin: 0;
}

.kds-card__dispatch {
  margin-top: 0.75rem;
  min-height: 4rem;
  border: none;
  border-radius: 0.75rem;
  background: #2e7d32;
  color: #fff;
  font-size: 1.35rem;
  font-weight: 800;
  cursor: pointer;
  transition: background-color 150ms ease-out, opacity 150ms ease-out;
}

.kds-card__dispatch:hover:not(:disabled) {
  background: #35914a;
}

.kds-card__dispatch:disabled {
  cursor: default;
  opacity: 0.6;
}

.kds-card__dispatch:focus-visible {
  outline: 3px solid #ffd166;
  outline-offset: 2px;
}
</style>
