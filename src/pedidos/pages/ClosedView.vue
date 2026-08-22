<script setup>
import { useLanguage } from "@/pedidos/composables/useLanguage";

const { t } = useLanguage();
</script>

<template>
  <div class="pedidos-closed">
    <p class="pedidos-closed__emoji">🕐</p>
    <h2 class="pedidos-closed__title">{{ t("closedTitle") }}</h2>
    <p class="pedidos-closed__text">{{ t("closedText") }}</p>
    <p class="pedidos-closed__sub">{{ t("closedSub") }}</p>
  </div>
</template>

<style scoped>
.pedidos-closed {
  max-width: 22rem;
  margin: 0 auto;
  padding: 4rem 1.25rem;
  text-align: center;
}

.pedidos-closed__emoji {
  font-size: 2.5rem;
  margin-bottom: 0.5rem;
}

.pedidos-closed__title {
  font-size: 1.3rem;
  font-weight: 800;
  margin-bottom: 0.75rem;
}

.pedidos-closed__text {
  color: var(--color-text);
  line-height: 1.5;
  margin-bottom: 0.75rem;
}

.pedidos-closed__sub {
  color: var(--color-muted);
  font-size: 0.9rem;
}
</style>
