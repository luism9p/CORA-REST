<script setup>
import { computed, ref, watch } from "vue";
import { formatCurrency } from "@/pedidos/utils/format";
import { modifiersExtra } from "@/pedidos/composables/useCart";
import { useLanguage } from "@/pedidos/composables/useLanguage";
import { localizedName } from "@/pedidos/utils/localizedMenuField";

const props = defineProps({
  order: { type: Object, required: true },
  orderItems: { type: Array, default: () => [] },
  justAdded: { type: Boolean, default: false },
});

const { language, t } = useLanguage();

// Otro celular de la misma mesa ya tenía un pedido activo, así que este
// envío se sumó a esa cuenta en vez de crear un pedido nuevo (ver
// submit_table_order() / CartDrawer.vue). Mismo patrón de toast que
// useTableRequest.js: aparece y se retira solo, no bloquea la pantalla.
const showAddedToast = ref(false);
let addedToastTimer = null;

watch(
  () => props.justAdded,
  (justAdded) => {
    if (!justAdded) return;
    showAddedToast.value = true;
    clearTimeout(addedToastTimer);
    addedToastTimer = setTimeout(() => {
      showAddedToast.value = false;
    }, 3000);
  },
  { immediate: true }
);

// Estado de cada plato (despachos parciales): en mesas con pedidos grandes,
// esto le muestra al cliente qué platos ya le llevaron aunque el pedido
// completo todavía no se haya marcado como "Entregado".
const ITEM_STATUS_LABEL_KEY = {
  preparando: "itemPreparando",
  listo_para_servir: "itemListoParaServir",
  en_mesa: "itemEnMesa",
};

// Reemplaza el viejo indicador de estado general del pedido (Nuevo →
// Preparando → Listo → Entregado): con despachos parciales ese estado ya no
// existe por plato, así que el progreso real se arma sumando cuántas
// unidades de comida (no líneas del pedido) ya llegaron a la mesa.
const totalProductos = computed(() => props.orderItems.reduce((sum, i) => sum + i.cantidad, 0));

const productosEntregados = computed(() =>
  props.orderItems
    .filter((i) => i.estado === "en_mesa")
    .reduce((sum, i) => sum + i.cantidad, 0)
);

const progressPercent = computed(() =>
  totalProductos.value === 0 ? 0 : (productosEntregados.value / totalProductos.value) * 100
);
</script>

<template>
  <div class="pedidos-tracking">
    <h2 class="pedidos-tracking__title">{{ t("trackingTitle") }}</h2>

    <div class="pedidos-tracking__progress">
      <p class="pedidos-tracking__progress-text">
        {{ t("progressSummary", productosEntregados, totalProductos) }}
      </p>
      <div
        class="pedidos-tracking__progress-track"
        role="progressbar"
        :aria-valuenow="productosEntregados"
        :aria-valuemin="0"
        :aria-valuemax="totalProductos"
      >
        <div class="pedidos-tracking__progress-fill" :style="{ width: `${progressPercent}%` }"></div>
      </div>
    </div>

    <div class="pedidos-tracking__summary">
      <div v-for="item in orderItems" :key="item.id" class="pedidos-tracking__item">
        <div class="pedidos-tracking__item-main">
          <span>{{ item.cantidad }}× {{ localizedName(item.menu_item, language) }}</span>
          <span>{{ formatCurrency(((item.menu_item?.precio || 0) + modifiersExtra(item.modifiers)) * item.cantidad) }}</span>
        </div>
        <div class="pedidos-tracking__item-meta">
          <span class="pedidos-tracking__badge" :class="`pedidos-tracking__badge--${item.estado}`">
            {{ t(ITEM_STATUS_LABEL_KEY[item.estado]) }}
          </span>
          <span v-if="item.modifiers?.length" class="pedidos-tracking__modifiers">
            ({{ item.modifiers.map((m) => m.nombre).join(", ") }})
          </span>
        </div>
      </div>
      <div class="pedidos-tracking__total">
        <span>{{ t("total") }}</span>
        <span>{{ formatCurrency(order.total) }}</span>
      </div>
    </div>

    <Transition name="pedidos-tracking-toast">
      <div v-if="showAddedToast" class="pedidos-tracking__added-toast">
        {{ t("orderAddedToTable") }}
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.pedidos-tracking {
  max-width: 28rem;
  margin: 0 auto;
  padding: 2rem 1.25rem;
}

.pedidos-tracking__title {
  font-size: 1.3rem;
  font-weight: 800;
  text-align: center;
  margin-bottom: 2rem;
}

.pedidos-tracking__progress {
  margin-bottom: 2rem;
}

.pedidos-tracking__progress-text {
  font-size: 14px;
  color: var(--color-muted);
  margin-bottom: 0.5rem;
}

.pedidos-tracking__progress-track {
  width: 100%;
  height: 0.6rem;
  background: var(--color-border);
  border-radius: 9999px;
  overflow: hidden;
}

.pedidos-tracking__progress-fill {
  height: 100%;
  background: var(--color-primary);
  border-radius: 9999px;
  transition: width 0.4s ease-in-out;
}

.pedidos-tracking__summary {
  border-top: 1px solid var(--color-border);
  padding-top: 1rem;
}

.pedidos-tracking__item {
  padding: 0.5rem 0;
  border-bottom: 1px solid var(--color-border);
}

.pedidos-tracking__item:last-child {
  border-bottom: none;
}

.pedidos-tracking__item-main {
  display: flex;
  justify-content: space-between;
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--color-text);
}

.pedidos-tracking__item-meta {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.3rem;
}

.pedidos-tracking__modifiers {
  font-size: 0.8rem;
  color: var(--color-muted);
}

.pedidos-tracking__badge {
  display: inline-flex;
  align-items: center;
  font-size: 0.75rem;
  font-weight: 700;
  padding: 0.2rem 0.6rem;
  border-radius: 9999px;
}

.pedidos-tracking__badge--preparando {
  color: #b45309;
  background: color-mix(in srgb, #b45309 12%, transparent);
}

.pedidos-tracking__badge--listo_para_servir {
  color: #fff;
  background: var(--color-primary);
  animation: pedidos-badge-pulse 1.4s var(--ease-out) infinite;
}

.pedidos-tracking__badge--en_mesa {
  color: var(--color-muted);
  background: color-mix(in srgb, var(--color-muted) 15%, transparent);
}

@keyframes pedidos-badge-pulse {
  0%,
  100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.06);
    opacity: 0.85;
  }
}

.pedidos-tracking__total {
  display: flex;
  justify-content: space-between;
  font-weight: 800;
  margin-top: 0.75rem;
  padding-top: 0.75rem;
  border-top: 1px solid var(--color-border);
}

.pedidos-tracking__added-toast {
  position: fixed;
  bottom: 1rem;
  left: 50%;
  transform: translateX(-50%);
  max-width: calc(100% - 2rem);
  background: var(--color-text);
  color: var(--color-bg);
  padding: 0.6rem 1.1rem;
  border-radius: 9999px;
  font-size: 0.85rem;
  font-weight: 600;
  text-align: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  z-index: 50;
}

.pedidos-tracking-toast-enter-active {
  transition: opacity 400ms var(--ease-spring), transform 400ms var(--ease-spring);
}
.pedidos-tracking-toast-leave-active {
  transition: opacity 200ms var(--ease-out), transform 200ms var(--ease-out);
}
.pedidos-tracking-toast-enter-from,
.pedidos-tracking-toast-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(0.5rem) scale(0.9);
}
</style>
