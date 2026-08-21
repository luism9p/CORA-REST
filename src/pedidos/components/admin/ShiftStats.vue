<script setup>
import { formatCurrency } from "@/pedidos/utils/format";

defineProps({
  totalRevenue: { type: Number, required: true },
  bestSeller: { type: Object, default: null },
});
</script>

<template>
  <div class="admin-shift-stats">
    <div class="admin-shift-stats__card">
      <span class="admin-shift-stats__label">Ingresos de hoy</span>
      <span class="admin-shift-stats__value">{{ formatCurrency(totalRevenue) }}</span>
    </div>
    <div class="admin-shift-stats__card">
      <span class="admin-shift-stats__label">Más vendido</span>
      <span class="admin-shift-stats__value">
        {{ bestSeller ? `${bestSeller.nombre} · ${bestSeller.cantidad}` : "—" }}
      </span>
    </div>
  </div>
</template>

<style scoped>
.admin-shift-stats {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.admin-shift-stats__card {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  padding: 1rem 1.25rem;
  border-radius: 1rem;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
}

.admin-shift-stats__label {
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-muted);
}

.admin-shift-stats__value {
  font-size: 1.4rem;
  font-weight: 800;
  color: var(--color-text);
}
</style>
