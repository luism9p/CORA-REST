<script setup>
import { computed } from "vue";
import StatusBadge from "./StatusBadge.vue";
import { nextStatus, STATUS_LABEL, ITEM_STATUS_FLOW, ITEM_STATUS_LABEL } from "@/pedidos/utils/orderStatus";
import { formatCurrency } from "@/pedidos/utils/format";

const props = defineProps({
  order: { type: Object, required: true },
  tableNumero: { type: Number, required: true },
});
const emit = defineEmits(["close", "advance-status", "set-item-status"]);

const ITEM_STATUS_ICON = {
  preparando: "🕒",
  listo_para_servir: "🔔",
  en_mesa: "✅",
};

// El atajo de "avanzar pedido a Listo" no exige que cada plato ya esté
// físicamente en la mesa (eso lo decide el mesero plato por plato) — solo
// que ninguno siga en cocina.
const allItemsReady = computed(
  () => props.order.order_items.length > 0 && props.order.order_items.every((i) => i.estado !== "preparando")
);

const next = computed(() => nextStatus(props.order.estado));

function advance(status) {
  emit("advance-status", props.order.id, status);
}

function setItemStatus(itemId, estado) {
  emit("set-item-status", itemId, estado);
}
</script>

<template>
  <div class="admin-detail" role="dialog" aria-modal="true" :aria-label="`Detalle mesa ${tableNumero}`">
    <div class="admin-detail__header">
      <div class="admin-detail__title">
        <h2>Mesa {{ tableNumero }}</h2>
        <StatusBadge :status="order.estado" />
      </div>
      <button type="button" class="admin-detail__close" aria-label="Cerrar" @click="$emit('close')">✕</button>
    </div>

    <ul class="admin-detail__items">
      <li v-for="item in order.order_items" :key="item.id" class="admin-detail__item">
        <div class="admin-detail__item-row">
          <span :class="{ 'admin-detail__item-text--done': item.estado === 'en_mesa' }">
            {{ item.cantidad }}× {{ item.menu_item?.nombre }}
          </span>
          <div class="admin-detail__status-group" role="group" :aria-label="`Estado de ${item.menu_item?.nombre}`">
            <button
              v-for="status in ITEM_STATUS_FLOW"
              :key="status"
              type="button"
              class="admin-detail__status-btn"
              :class="{ 'admin-detail__status-btn--active': item.estado === status }"
              :aria-label="ITEM_STATUS_LABEL[status]"
              :aria-pressed="item.estado === status"
              @click="setItemStatus(item.id, status)"
            >
              {{ ITEM_STATUS_ICON[status] }}
            </button>
          </div>
        </div>
        <span v-if="item.modifiers?.length" class="admin-detail__modifiers">
          {{ item.modifiers.map((m) => m.nombre).join(", ") }}
        </span>
        <span v-if="item.nota" class="admin-detail__note">"{{ item.nota }}"</span>
      </li>
    </ul>

    <p v-if="order.notas" class="admin-detail__general-note">Nota del pedido: {{ order.notas }}</p>

    <div class="admin-detail__footer">
      <span class="admin-detail__payment">{{ order.metodo_pago || "—" }}</span>
      <span class="admin-detail__total">{{ formatCurrency(order.total) }}</span>
    </div>

    <button
      v-if="allItemsReady && order.estado !== 'listo' && order.estado !== 'entregado'"
      type="button"
      class="admin-detail__shortcut"
      @click="advance('listo')"
    >
      ✓ Todos los ítems listos — marcar pedido como Listo
    </button>

    <button v-else-if="next" type="button" class="admin-detail__advance" @click="advance(next)">
      Avanzar a {{ STATUS_LABEL[next] }}
    </button>
  </div>
</template>

<style scoped>
.admin-detail {
  width: 100%;
  max-width: 28rem;
  max-height: 85vh;
  overflow-y: auto;
  background: var(--color-surface);
  color: var(--color-text);
  border-radius: 1.25rem;
  padding: 1.25rem;
}

.admin-detail__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 1rem;
}

.admin-detail__title {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.admin-detail__title h2 {
  font-size: 1.3rem;
  font-weight: 800;
}

.admin-detail__close {
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 9999px;
  background: var(--color-bg);
}

.admin-detail__items {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  margin-bottom: 1rem;
}

.admin-detail__item {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  padding-bottom: 0.6rem;
  border-bottom: 1px solid var(--color-border);
}

.admin-detail__item-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  font-weight: 700;
}

.admin-detail__item-text--done {
  text-decoration: line-through;
  color: var(--color-muted);
}

.admin-detail__status-group {
  display: flex;
  gap: 0.3rem;
  flex-shrink: 0;
}

.admin-detail__status-btn {
  width: 2.25rem;
  height: 2.25rem;
  border-radius: 9999px;
  border: 1px solid var(--color-border);
  background: var(--color-bg);
  font-size: 1rem;
  opacity: 0.45;
  transition: transform 400ms var(--ease-spring), opacity 150ms var(--ease-out), border-color 150ms var(--ease-out);
}

.admin-detail__status-btn--active {
  opacity: 1;
  border-color: var(--color-primary);
  background: color-mix(in srgb, var(--color-primary) 10%, transparent);
}

.admin-detail__status-btn:active {
  transform: scale(0.88);
}

.admin-detail__modifiers {
  font-size: 0.85rem;
  color: var(--color-muted);
}

.admin-detail__note {
  font-size: 0.85rem;
  font-style: italic;
  color: var(--color-muted);
}

.admin-detail__general-note {
  font-size: 0.9rem;
  color: var(--color-muted);
  margin-bottom: 1rem;
}

.admin-detail__footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 800;
  padding: 1rem 0;
  border-top: 1px solid var(--color-border);
}

.admin-detail__payment {
  text-transform: capitalize;
  font-weight: 600;
  color: var(--color-muted);
}

.admin-detail__total {
  font-size: 1.2rem;
}

.admin-detail__shortcut,
.admin-detail__advance {
  width: 100%;
  min-height: 3rem;
  border-radius: 9999px;
  font-weight: 700;
  color: #fff;
}

.admin-detail__shortcut {
  background: var(--color-listo);
}

.admin-detail__advance {
  background: var(--color-primary);
}
</style>
