<script setup>
import { useLanguage } from "@/pedidos/composables/useLanguage";

defineProps({
  theme: { type: String, required: true },
});
defineEmits(["toggle"]);

const { t } = useLanguage();
</script>

<template>
  <button
    type="button"
    class="pedidos-theme-toggle"
    :aria-label="theme === 'dark' ? t('themeToLight') : t('themeToDark')"
    @click="$emit('toggle')"
  >
    {{ theme === "dark" ? "☀️" : "🌙" }}
  </button>
</template>

<style scoped>
.pedidos-theme-toggle {
  position: fixed;
  top: 1rem;
  right: 1rem;
  z-index: 40;
  width: 2.75rem;
  height: 2.75rem;
  border-radius: 9999px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.12);
  font-size: 1.1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 400ms var(--ease-spring);
}

.pedidos-theme-toggle:active {
  transform: scale(0.9);
}
</style>
