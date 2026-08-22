<script setup>
import { useLanguage } from "@/pedidos/composables/useLanguage";

const { language, toggleLanguage, t } = useLanguage();
</script>

<template>
  <button
    type="button"
    class="pedidos-language-toggle"
    :aria-label="t('languageToggle')"
    @click="toggleLanguage"
  >
    {{ language === "es" ? "ES" : "EN" }}
  </button>
</template>

<style scoped>
.pedidos-language-toggle {
  position: fixed;
  top: 1rem;
  right: 4.25rem;
  z-index: 40;
  width: 2.75rem;
  height: 2.75rem;
  border-radius: 9999px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.12);
  font-size: 0.8rem;
  font-weight: 800;
  color: var(--color-text);
  display: flex;
  align-items: center;
  justify-content: center;
}

.pedidos-language-toggle:active {
  transform: scale(0.95);
}
</style>
