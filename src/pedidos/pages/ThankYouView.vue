<script setup>
import { useLanguage } from "@/pedidos/composables/useLanguage";

const reviewUrl = import.meta.env.PUBLIC_GOOGLE_REVIEW_URL;
const { t } = useLanguage();
defineEmits(["new-order"]);
</script>

<template>
  <div class="pedidos-thankyou">
    <p class="pedidos-thankyou__emoji">🎉</p>
    <h2 class="pedidos-thankyou__title">{{ t("thankYouTitle") }}</h2>
    <p class="pedidos-thankyou__text">{{ t("thankYouText") }}</p>

    <a
      v-if="reviewUrl"
      :href="reviewUrl"
      target="_blank"
      rel="noopener noreferrer"
      class="pedidos-thankyou__review"
    >
      {{ t("leaveReview") }}
    </a>

    <button type="button" class="pedidos-thankyou__again" @click="$emit('new-order')">
      {{ t("newOrder") }}
    </button>
  </div>
</template>

<style scoped>
.pedidos-thankyou {
  max-width: 24rem;
  margin: 0 auto;
  padding: 3rem 1.25rem;
  text-align: center;
}

.pedidos-thankyou__emoji {
  font-size: 3rem;
  margin-bottom: 0.5rem;
}

.pedidos-thankyou__title {
  font-size: 1.3rem;
  font-weight: 800;
  margin-bottom: 0.5rem;
}

.pedidos-thankyou__text {
  color: var(--color-muted);
  margin-bottom: 2rem;
}

.pedidos-thankyou__review {
  display: block;
  min-height: 3rem;
  line-height: 3rem;
  border-radius: 9999px;
  background: var(--color-primary);
  color: #fff;
  font-weight: 700;
  margin-bottom: 0.75rem;
}

.pedidos-thankyou__again {
  display: block;
  width: 100%;
  min-height: 3rem;
  border-radius: 9999px;
  background: transparent;
  border: 1px solid var(--color-border);
  color: var(--color-text);
  font-weight: 700;
}
</style>
