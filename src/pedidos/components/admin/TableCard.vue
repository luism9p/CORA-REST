<script setup>
import { ref, computed, onMounted, onUnmounted } from "vue";
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

// Cronómetro SLA: cuánto lleva la mesa esperando desde que entró el pedido
// (order.created_at, capturado el momento en que nace como "nuevo"). Se
// recalcula cada 60s en vez de con requestAnimationFrame/timers más finos —
// es un contador en minutos, no necesita más precisión que esa.
const now = ref(Date.now());
let intervalId = null;

onMounted(() => {
  intervalId = setInterval(() => {
    now.value = Date.now();
  }, 60000);
});

onUnmounted(() => {
  clearInterval(intervalId);
});

const elapsedMinutes = computed(() => {
  if (!props.order) return null;
  const createdAt = new Date(props.order.created_at).getTime();
  return Math.max(0, Math.floor((now.value - createdAt) / 60000));
});

const slaLevel = computed(() => {
  if (elapsedMinutes.value === null) return null;
  if (elapsedMinutes.value > 25) return "critical";
  if (elapsedMinutes.value > 15) return "warning";
  return null;
});
</script>

<template>
  <button
    type="button"
    class="admin-table-card"
    :class="{
      'admin-table-card--active': !!order,
      'admin-table-card--warning': slaLevel === 'warning',
      'admin-table-card--critical': slaLevel === 'critical',
    }"
    :style="{ borderColor }"
    @click="order && $emit('select', table)"
  >
    <span class="admin-table-card__number">Mesa {{ table.numero }}</span>
    <StatusBadge v-if="order" :status="order.estado" />
    <span v-if="elapsedMinutes !== null" class="admin-table-card__timer">⏱️ {{ elapsedMinutes }} min</span>
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
  transition: border-color 300ms ease, background-color 300ms ease, transform 150ms ease, box-shadow 300ms ease;
}

/* SLA: más de 15 min sin avanzar es una alerta suave; más de 25, urgente.
   El color de estado sigue viviendo en el borde (StatusBadge/borderColor);
   el fondo es una señal independiente, para no pisar ese significado. */
.admin-table-card--warning {
  background: #fff4e0;
}

.admin-table-card--critical {
  background: #fde5e3;
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

.admin-table-card__timer {
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--color-muted);
}
</style>
