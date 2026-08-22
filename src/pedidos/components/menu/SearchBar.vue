<script setup>
import { useLanguage } from "@/pedidos/composables/useLanguage";

defineProps({
  modelValue: { type: String, default: "" },
});
defineEmits(["update:modelValue"]);

const { t } = useLanguage();
</script>

<template>
  <div class="pedidos-search">
    <svg class="pedidos-search__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
    <input
      type="search"
      class="pedidos-search__input"
      :placeholder="t('searchPlaceholder')"
      :value="modelValue"
      @input="$emit('update:modelValue', $event.target.value)"
    />
  </div>
</template>

<style scoped>
.pedidos-search {
  position: relative;
  display: flex;
  align-items: center;
}

.pedidos-search__icon {
  position: absolute;
  left: 0.75rem;
  width: 1.1rem;
  height: 1.1rem;
  color: var(--color-muted);
  pointer-events: none;
}

.pedidos-search__input {
  width: 100%;
  min-height: 2.75rem;
  padding: 0 0.75rem 0 2.25rem;
  border-radius: 9999px;
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  color: var(--color-text);
  font-size: 16px; /* evita el zoom automático de iOS al enfocar */
}

.pedidos-search__input:focus {
  outline: 2px solid var(--color-primary);
  outline-offset: 1px;
}

.pedidos-search__input::-webkit-search-cancel-button {
  cursor: pointer;
}
</style>
