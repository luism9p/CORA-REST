<script setup>
import { computed } from "vue";
import { STATUS_FLOW } from "@/pedidos/utils/orderStatus";
import { formatCurrency } from "@/pedidos/utils/format";
import { modifiersExtra } from "@/pedidos/composables/useCart";
import { useLanguage } from "@/pedidos/composables/useLanguage";
import { localizedName } from "@/pedidos/utils/localizedMenuField";

const props = defineProps({
  order: { type: Object, required: true },
  orderItems: { type: Array, default: () => [] },
});

const { language, t } = useLanguage();
const currentIndex = computed(() => STATUS_FLOW.indexOf(props.order.estado));

const STATUS_LABEL_KEY = {
  nuevo: "statusNuevo",
  preparando: "statusPreparando",
  listo: "statusListo",
  entregado: "statusEntregado",
};

// Estado de cada plato (despachos parciales): en mesas con pedidos grandes,
// esto le muestra al cliente qué platos ya le llevaron aunque el pedido
// completo todavía no se haya marcado como "Entregado".
const ITEM_STATUS_LABEL_KEY = {
  preparando: "itemPreparando",
  listo_para_servir: "itemListoParaServir",
  en_mesa: "itemEnMesa",
};
</script>

<template>
  <div class="pedidos-tracking">
    <h2 class="pedidos-tracking__title">{{ t("trackingTitle") }}</h2>

    <ol class="pedidos-tracking__steps">
      <li
        v-for="(status, index) in STATUS_FLOW"
        :key="status"
        class="pedidos-tracking__step"
        :class="{
          'pedidos-tracking__step--done': index < currentIndex,
          'pedidos-tracking__step--current': index === currentIndex,
        }"
      >
        <span class="pedidos-tracking__dot"></span>
        <span>{{ t(STATUS_LABEL_KEY[status]) }}</span>
      </li>
    </ol>

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

.pedidos-tracking__steps {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  margin-bottom: 2rem;
}

.pedidos-tracking__step {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  color: var(--color-muted);
  font-weight: 600;
}

.pedidos-tracking__dot {
  width: 1.25rem;
  height: 1.25rem;
  border-radius: 9999px;
  border: 2px solid var(--color-border);
  flex-shrink: 0;
}

.pedidos-tracking__step--done {
  color: var(--color-text);
}
.pedidos-tracking__step--done .pedidos-tracking__dot {
  background: var(--color-listo);
  border-color: var(--color-listo);
}

.pedidos-tracking__step--current {
  color: var(--color-primary);
}
.pedidos-tracking__step--current .pedidos-tracking__dot {
  background: var(--color-primary);
  border-color: var(--color-primary);
  box-shadow: 0 0 0 4px color-mix(in srgb, var(--color-primary) 25%, transparent);
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
</style>
