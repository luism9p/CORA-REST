<script setup>
defineProps({
  categories: { type: Array, required: true },
  activeCategory: { type: String, default: "" },
});
defineEmits(["select"]);
</script>

<template>
  <div class="pedidos-tabs">
    <button
      v-for="cat in categories"
      :key="cat"
      type="button"
      class="pedidos-tab"
      :class="{ 'pedidos-tab--active': cat === activeCategory }"
      @click="$emit('select', cat)"
    >
      {{ cat }}
    </button>
  </div>
</template>

<style scoped>
.pedidos-tabs {
  display: flex;
  flex-wrap: nowrap;
  gap: 0.5rem;
  overflow-x: auto;
  padding: 0.25rem 0;
  scrollbar-width: none;
}
.pedidos-tabs::-webkit-scrollbar {
  display: none;
}

.pedidos-tab {
  flex-shrink: 0;
  min-height: 2.5rem;
  padding: 0 1rem;
  border-radius: 9999px;
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  color: var(--color-text);
  font-size: 0.85rem;
  font-weight: 600;
  white-space: nowrap;
  transition: background-color 150ms, color 150ms, border-color 150ms;
}

.pedidos-tab--active {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: #fff;
}

.pedidos-tab:active {
  transform: scale(0.97);
}
</style>
