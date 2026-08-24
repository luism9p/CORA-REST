<script setup>
import { computed } from "vue";
import StatusBadge from "./StatusBadge.vue";
import { PAYMENT_METHOD_LABEL } from "@/pedidos/composables/useShiftReport";
import { useDragSheet } from "@/pedidos/composables/useDragSheet";
import { formatCurrency } from "@/pedidos/utils/format";

const props = defineProps({
  open: { type: Boolean, default: false },
  order: { type: Object, default: null },
  tableNumero: { type: Number, default: null },
});
const emit = defineEmits(["close"]);

const { onPointerDown, onPointerMove, onPointerUp, dragStyle } = useDragSheet({
  onDismiss: () => emit("close"),
});

const hora = computed(() => {
  if (!props.order) return "";
  return new Intl.DateTimeFormat("es-PE", {
    timeZone: "America/Lima",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(props.order.created_at));
});
</script>

<template>
  <div
    class="report-order-modal"
    :class="{ 'report-order-modal--open': open }"
    role="dialog"
    aria-modal="true"
    aria-label="Detalle del pedido"
    @click.self="$emit('close')"
  >
    <div v-if="order" class="report-order-modal__box" :style="dragStyle">
      <div
        class="report-order-modal__handle-hitbox"
        @pointerdown="onPointerDown"
        @pointermove="onPointerMove"
        @pointerup="onPointerUp"
        @pointercancel="onPointerUp"
      >
        <div class="report-order-modal__handle"></div>
      </div>

      <div class="report-order-modal__header">
        <div class="report-order-modal__title">
          <h2>Mesa {{ tableNumero }} · {{ hora }}</h2>
          <StatusBadge :status="order.estado" />
        </div>
        <button type="button" class="report-order-modal__close" aria-label="Cerrar" @click="$emit('close')">✕</button>
      </div>

      <ul class="report-order-modal__items">
        <li v-for="item in order.order_items" :key="item.id" class="report-order-modal__item">
          <span class="report-order-modal__item-name">{{ item.cantidad }}× {{ item.menu_item?.nombre }}</span>
          <span v-if="item.modifiers?.length" class="report-order-modal__meta">
            {{ item.modifiers.map((m) => m.nombre).join(", ") }}
          </span>
          <span v-if="item.nota" class="report-order-modal__meta report-order-modal__meta--note">
            "{{ item.nota }}"
          </span>
        </li>
      </ul>

      <p v-if="order.notas" class="report-order-modal__general-note">Nota del pedido: {{ order.notas }}</p>

      <div class="report-order-modal__summary">
        <div class="report-order-modal__row">
          <span>Método de pago</span>
          <span>{{ PAYMENT_METHOD_LABEL[order.metodo_pago] || order.metodo_pago || "—" }}</span>
        </div>
        <div v-if="order.propina > 0" class="report-order-modal__row">
          <span>Propina</span>
          <span>{{ formatCurrency(order.propina) }}</span>
        </div>
        <div class="report-order-modal__row report-order-modal__row--total">
          <span>Total</span>
          <span>{{ formatCurrency(order.total) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.report-order-modal {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(3px);
  -webkit-backdrop-filter: blur(3px);
  opacity: 0;
  pointer-events: none;
  transition: opacity 250ms var(--ease-out);
}

.report-order-modal--open {
  opacity: 1;
  pointer-events: auto;
}

.report-order-modal__box {
  width: 100%;
  max-width: 32rem;
  max-height: 85vh;
  overflow-y: auto;
  background: var(--color-surface);
  color: var(--color-text);
  border-radius: 1.25rem 1.25rem 0 0;
  padding: 0.75rem 1.25rem 1.5rem;
  transform: translateY(100%);
  transition: transform 400ms var(--ease-sheet);
}

.report-order-modal--open .report-order-modal__box {
  transform: translateY(0);
}

.report-order-modal__handle-hitbox {
  display: flex;
  justify-content: center;
  padding: 0.6rem 0 0.85rem;
  touch-action: none;
  cursor: grab;
}

.report-order-modal__handle-hitbox:active {
  cursor: grabbing;
}

.report-order-modal__handle {
  width: 2.5rem;
  height: 0.35rem;
  border-radius: 9999px;
  background: var(--color-border);
}

.report-order-modal__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 1rem;
}

.report-order-modal__title {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.report-order-modal__title h2 {
  font-size: 1.1rem;
  font-weight: 800;
  letter-spacing: -0.01em;
}

.report-order-modal__close {
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 9999px;
  background: var(--color-bg);
  flex-shrink: 0;
  transition: transform 400ms var(--ease-spring);
}

.report-order-modal__close:active {
  transform: scale(0.9);
}

.report-order-modal__items {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  margin-bottom: 1rem;
}

.report-order-modal__item {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  padding-bottom: 0.6rem;
  border-bottom: 1px solid var(--color-border);
  font-weight: 700;
}

.report-order-modal__meta {
  font-size: 0.85rem;
  font-weight: 400;
  color: var(--color-muted);
}

.report-order-modal__meta--note {
  font-style: italic;
}

.report-order-modal__general-note {
  font-size: 0.9rem;
  color: var(--color-muted);
  margin-bottom: 1rem;
}

.report-order-modal__summary {
  border-top: 1px solid var(--color-border);
  padding-top: 0.5rem;
}

.report-order-modal__row {
  display: flex;
  justify-content: space-between;
  padding: 0.35rem 0;
  color: var(--color-muted);
  font-weight: 600;
}

.report-order-modal__row--total {
  color: var(--color-text);
  font-weight: 800;
  font-size: 1.1rem;
  margin-top: 0.25rem;
  padding-top: 0.5rem;
  border-top: 1px solid var(--color-border);
}
</style>
