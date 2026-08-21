<script setup>
import { computed } from "vue";
import StatusBadge from "./StatusBadge.vue";
import { nextStatus, STATUS_LABEL } from "@/pedidos/utils/orderStatus";
import { formatCurrency } from "@/pedidos/utils/format";

const props = defineProps({
  order: { type: Object, required: true },
  tableNumero: { type: Number, required: true },
});
const emit = defineEmits(["close", "advance-status", "toggle-item"]);

const allItemsReady = computed(
  () => props.order.order_items.length > 0 && props.order.order_items.every((i) => i.listo)
);

const next = computed(() => nextStatus(props.order.estado));

function advance(status) {
  emit("advance-status", props.order.id, status);
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
        <label class="admin-detail__item-label">
          <input
            type="checkbox"
            :checked="item.listo"
            @change="$emit('toggle-item', item.id, $event.target.checked)"
          />
          <span :class="{ 'admin-detail__item-text--done': item.listo }">
            {{ item.cantidad }}× {{ item.menu_item?.nombre }}
          </span>
        </label>
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
  width: 2.25rem;
  height: 2.25rem;
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

.admin-detail__item-label {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  font-weight: 700;
}

.admin-detail__item-label input {
  width: 1.25rem;
  height: 1.25rem;
}

.admin-detail__item-text--done {
  text-decoration: line-through;
  color: var(--color-muted);
}

.admin-detail__note {
  margin-left: 1.85rem;
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
