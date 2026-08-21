<script setup>
defineProps({
  requests: { type: Array, required: true },
});
defineEmits(["attend"]);

function describe(req) {
  const label = req.tipo === "mesero" ? "llama al mesero" : "pide la cuenta";
  const icon = req.tipo === "mesero" ? "🙋" : "🧾";
  return `${icon} Mesa ${req.table?.numero} ${label}`;
}
</script>

<template>
  <TransitionGroup v-if="requests.length" tag="div" name="admin-requests" class="admin-requests-banner">
    <div v-for="req in requests" :key="req.id" class="admin-requests-banner__item">
      <span>{{ describe(req) }}</span>
      <button type="button" @click="$emit('attend', req.id)">Atender</button>
    </div>
  </TransitionGroup>
</template>

<style scoped>
.admin-requests-banner {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
}

.admin-requests-banner__item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  background: #fff7ed;
  border: 1px solid #fdba74;
  border-radius: 0.75rem;
  padding: 0.75rem 1rem;
  font-weight: 700;
  color: #9a3412;
}

.admin-requests-banner__item button {
  min-height: 2.25rem;
  padding: 0 1rem;
  border-radius: 9999px;
  background: #9a3412;
  color: #fff;
  font-size: 0.85rem;
  font-weight: 700;
  flex-shrink: 0;
}

.admin-requests-enter-active,
.admin-requests-leave-active {
  transition: opacity 250ms ease, transform 250ms ease;
}
.admin-requests-enter-from,
.admin-requests-leave-to {
  opacity: 0;
  transform: scale(0.96);
}
</style>
