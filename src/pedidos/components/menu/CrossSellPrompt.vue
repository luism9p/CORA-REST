<script setup>
import { useCrossSell } from "@/pedidos/composables/useCrossSell";
import { useCart } from "@/pedidos/composables/useCart";
import { useLanguage } from "@/pedidos/composables/useLanguage";
import { localizedName } from "@/pedidos/utils/localizedMenuField";
import { formatCurrency } from "@/pedidos/utils/format";

const crossSell = useCrossSell();
const cart = useCart();
const { language, t } = useLanguage();

function addAndClose(drink) {
  cart.addItem(drink, 1);
  crossSell.dismiss();
}
</script>

<template>
  <div class="pedidos-cross-sell" :class="{ 'pedidos-cross-sell--open': crossSell.visible.value }">
    <div class="pedidos-cross-sell__box">
      <div class="pedidos-cross-sell__header">
        <span>{{ t("crossSellTitle") }}</span>
        <button type="button" class="pedidos-cross-sell__close" aria-label="Cerrar" @click="crossSell.dismiss()">✕</button>
      </div>
      <div class="pedidos-cross-sell__list">
        <button
          v-for="drink in crossSell.suggestions.value"
          :key="drink.id"
          type="button"
          class="pedidos-cross-sell__chip"
          @click="addAndClose(drink)"
        >
          <span>{{ localizedName(drink, language) }}</span>
          <span class="pedidos-cross-sell__chip-price">{{ formatCurrency(drink.precio) }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.pedidos-cross-sell {
  position: fixed;
  left: 1rem;
  right: 1rem;
  bottom: 5.5rem;
  z-index: 40;
  display: flex;
  justify-content: center;
  pointer-events: none;
  opacity: 0;
  transform: translateY(0.5rem);
  transition: opacity 200ms ease-out, transform 200ms ease-out;
}

.pedidos-cross-sell--open {
  opacity: 1;
  transform: translateY(0);
  pointer-events: auto;
}

.pedidos-cross-sell__box {
  width: 100%;
  max-width: 26rem;
  background: var(--color-surface);
  color: var(--color-text);
  border: 1px solid var(--color-border);
  border-radius: 1rem;
  padding: 0.85rem 1rem;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
}

.pedidos-cross-sell__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--color-muted);
  margin-bottom: 0.6rem;
}

.pedidos-cross-sell__close {
  width: 1.5rem;
  height: 1.5rem;
  flex-shrink: 0;
  color: var(--color-muted);
}

.pedidos-cross-sell__list {
  display: flex;
  gap: 0.5rem;
  overflow-x: auto;
}

.pedidos-cross-sell__chip {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  padding: 0.5rem 0.85rem;
  border-radius: 0.65rem;
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  font-size: 0.8rem;
  font-weight: 700;
  text-align: left;
  white-space: nowrap;
}

.pedidos-cross-sell__chip:active {
  background: var(--color-primary);
  color: #fff;
  border-color: var(--color-primary);
}

.pedidos-cross-sell__chip-price {
  font-weight: 600;
  color: var(--color-muted);
}

.pedidos-cross-sell__chip:active .pedidos-cross-sell__chip-price {
  color: rgba(255, 255, 255, 0.85);
}
</style>
