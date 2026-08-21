<script setup>
defineProps({
  label: { type: String, default: "Cargando..." },
});
</script>

<template>
  <div class="pedidos-spinner">
    <span class="pedidos-spinner__circle" aria-hidden="true"></span>
    <span>{{ label }}</span>
  </div>
</template>

<style scoped>
.pedidos-spinner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  padding: 2rem;
  color: var(--color-muted);
  font-size: 0.9rem;
}

.pedidos-spinner__circle {
  width: 2rem;
  height: 2rem;
  border-radius: 9999px;
  border: 3px solid var(--color-border);
  border-top-color: var(--color-primary);
  animation: pedidos-spin 0.7s linear infinite;
}

@keyframes pedidos-spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
