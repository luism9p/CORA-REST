<script setup>
defineProps({
  modelValue: { type: String, required: true },
});
defineEmits(["update:modelValue"]);

const OPTIONS = [
  { value: "todas", label: "Todas" },
  { value: "activas", label: "Pedidos activos" },
  { value: "libres", label: "Mesas libres" },
];
</script>

<template>
  <div class="admin-filter-tabs">
    <button
      v-for="opt in OPTIONS"
      :key="opt.value"
      type="button"
      class="admin-filter-tabs__btn"
      :class="{ 'admin-filter-tabs__btn--active': modelValue === opt.value }"
      @click="$emit('update:modelValue', opt.value)"
    >
      {{ opt.label }}
    </button>
  </div>
</template>

<style scoped>
.admin-filter-tabs {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1.25rem;
}

.admin-filter-tabs__btn {
  min-height: 2.75rem;
  padding: 0 1.1rem;
  border-radius: 9999px;
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  color: var(--color-text);
  font-weight: 700;
  font-size: 0.9rem;
  transition: background-color 150ms, color 150ms, border-color 150ms;
}

.admin-filter-tabs__btn--active {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: #fff;
}
</style>
