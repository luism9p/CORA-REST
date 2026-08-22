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
        <span>
          {{ item.cantidad }}× {{ localizedName(item.menu_item, language) }}
          <span v-if="item.modifiers?.length" class="pedidos-tracking__modifiers">
            ({{ item.modifiers.map((m) => m.nombre).join(", ") }})
          </span>
        </span>
        <span>{{ formatCurrency(((item.menu_item?.precio || 0) + modifiersExtra(item.modifiers)) * item.cantidad) }}</span>
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
  display: flex;
  justify-content: space-between;
  font-size: 0.9rem;
  padding: 0.35rem 0;
  color: var(--color-text);
}

.pedidos-tracking__modifiers {
  font-size: 0.8rem;
  color: var(--color-muted);
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
