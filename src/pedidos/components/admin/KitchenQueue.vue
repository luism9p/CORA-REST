<script setup>
defineProps({
  items: { type: Array, required: true },
});
</script>

<template>
  <section v-if="items.length > 0" class="admin-kitchen-queue">
    <h2 class="admin-kitchen-queue__title">🔥 En Cocina (Próximos a salir)</h2>

    <div class="admin-kitchen-queue__scroll">
      <div
        v-for="(item, index) in items"
        :key="`${item.numeroMesa}-${item.nombrePlato}-${item.timestamp}-${index}`"
        class="admin-kitchen-queue__card"
      >
        <span class="admin-kitchen-queue__dish">{{ item.cantidad }}x {{ item.nombrePlato }}</span>
        <div class="admin-kitchen-queue__meta">
          <span class="admin-kitchen-queue__table-badge">Mesa {{ item.numeroMesa }}</span>
          <span class="admin-kitchen-queue__clock" aria-hidden="true">🕒</span>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.admin-kitchen-queue {
  border-top: 1px solid var(--color-border);
  padding-top: 1.25rem;
}

.admin-kitchen-queue__title {
  font-size: 1rem;
  font-weight: 800;
  margin-bottom: 0.85rem;
}

.admin-kitchen-queue__scroll {
  display: flex;
  gap: 0.75rem;
  overflow-x: auto;
  padding-bottom: 0.35rem; /* aire para no chocar con el scrollbar */
}

.admin-kitchen-queue__card {
  flex: 0 0 auto;
  min-width: 10rem;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  padding: 0.75rem 0.9rem;
  border-radius: 0.75rem;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
}

.admin-kitchen-queue__dish {
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--color-text);
}

.admin-kitchen-queue__meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}

.admin-kitchen-queue__table-badge {
  font-size: 0.7rem;
  font-weight: 800;
  color: #fff;
  background: var(--color-primary);
  border-radius: 9999px;
  padding: 0.2rem 0.6rem;
  white-space: nowrap;
}

.admin-kitchen-queue__clock {
  display: inline-block;
  font-size: 0.9rem;
  animation: admin-kitchen-clock-tick 1.4s var(--ease-out) infinite;
}

@keyframes admin-kitchen-clock-tick {
  0%,
  100% {
    transform: rotate(0deg);
  }
  50% {
    transform: rotate(-14deg);
  }
}
</style>
