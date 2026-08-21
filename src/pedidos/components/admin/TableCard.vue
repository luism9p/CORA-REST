<script setup>
import { computed } from "vue";
import StatusBadge from "./StatusBadge.vue";
import { STATUS_COLOR } from "@/pedidos/utils/orderStatus";

const props = defineProps({
  table: { type: Object, required: true },
  order: { type: Object, default: null },
});
defineEmits(["select"]);

const borderColor = computed(() =>
  props.order ? STATUS_COLOR[props.order.estado] : "var(--color-border)"
);
</script>

<template>
  <button
    type="button"
    class="admin-table-card"
    :class="{ 'admin-table-card--active': !!order }"
    :style="{ borderColor }"
    @click="order && $emit('select', table)"
  >
    <span class="admin-table-card__number">Mesa {{ table.numero }}</span>
    <StatusBadge v-if="order" :status="order.estado" />
    <span v-else class="admin-table-card__free">Libre</span>
  </button>
</template>

<style scoped>
.admin-table-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  aspect-ratio: 1;
  border-radius: 1rem;
  border: 3px solid var(--color-border);
  background: var(--color-surface);
  transition: border-color 300ms ease, transform 150ms ease, box-shadow 300ms ease;
}

.admin-table-card--active {
  cursor: pointer;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.08);
}

.admin-table-card--active:active {
  transform: scale(0.96);
}

.admin-table-card__number {
  font-size: 1.15rem;
  font-weight: 800;
  color: var(--color-text);
}

.admin-table-card__free {
  font-size: 0.8rem;
  color: var(--color-muted);
  font-weight: 600;
}
</style>
