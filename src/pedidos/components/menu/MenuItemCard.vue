<script setup>
import { computed } from "vue";
import { useCart } from "@/pedidos/composables/useCart";
import { formatCurrency } from "@/pedidos/utils/format";

const props = defineProps({
  item: { type: Object, required: true },
});

const cart = useCart();

const lineIndex = computed(() =>
  cart.items.findIndex((i) => i.menuItem.id === props.item.id && i.nota === "")
);
const quantity = computed(() =>
  lineIndex.value === -1 ? 0 : cart.items[lineIndex.value].cantidad
);

function add() {
  cart.addItem(props.item, 1);
}

function increment() {
  if (lineIndex.value === -1) {
    add();
  } else {
    cart.updateQuantity(lineIndex.value, quantity.value + 1);
  }
}

function decrement() {
  if (lineIndex.value === -1) return;
  cart.updateQuantity(lineIndex.value, quantity.value - 1);
}
</script>

<template>
  <div class="pedidos-item-card" :class="{ 'pedidos-item-card--unavailable': !item.disponible }">
    <img
      v-if="item.imagen_url"
      :src="item.imagen_url"
      :alt="item.nombre"
      loading="lazy"
      decoding="async"
      class="pedidos-item-card__image"
    />
    <div class="pedidos-item-card__body">
      <h3 class="pedidos-item-card__name">{{ item.nombre }}</h3>
      <p v-if="item.descripcion" class="pedidos-item-card__desc">{{ item.descripcion }}</p>
      <div class="pedidos-item-card__footer">
        <span class="pedidos-item-card__price">{{ formatCurrency(item.precio) }}</span>

        <span v-if="!item.disponible" class="pedidos-item-card__sold-out">Agotado</span>
        <button v-else-if="quantity === 0" type="button" class="pedidos-item-card__add" @click="add">
          Agregar
        </button>
        <div v-else class="pedidos-stepper">
          <button type="button" class="pedidos-stepper__btn" aria-label="Quitar uno" @click="decrement">−</button>
          <span class="pedidos-stepper__count">{{ quantity }}</span>
          <button type="button" class="pedidos-stepper__btn" aria-label="Agregar uno" @click="increment">+</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.pedidos-item-card {
  display: flex;
  gap: 0.75rem;
  padding: 0.75rem;
  border-radius: 0.75rem;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
}

.pedidos-item-card--unavailable {
  opacity: 0.5;
  pointer-events: none;
}

.pedidos-item-card__image {
  width: 4.5rem;
  height: 4.5rem;
  border-radius: 0.5rem;
  object-fit: cover;
  flex-shrink: 0;
}

.pedidos-item-card__body {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  min-width: 0;
  flex: 1;
}

.pedidos-item-card__name {
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--color-text);
}

.pedidos-item-card__desc {
  font-size: 0.8rem;
  color: var(--color-muted);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.pedidos-item-card__footer {
  margin-top: auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}

.pedidos-item-card__price {
  font-weight: 700;
  color: var(--color-text);
}

.pedidos-item-card__add {
  min-height: 2.5rem;
  padding: 0 0.9rem;
  border-radius: 9999px;
  background: var(--color-primary);
  color: #fff;
  font-size: 0.8rem;
  font-weight: 700;
}

.pedidos-item-card__add:active {
  background: var(--color-primary-dark);
}

.pedidos-item-card__sold-out {
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--color-muted);
  border: 1px solid var(--color-border);
  border-radius: 9999px;
  padding: 0.35rem 0.75rem;
  white-space: nowrap;
}

.pedidos-stepper {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  border-radius: 9999px;
  background: var(--color-primary);
  color: #fff;
  padding: 0.15rem 0.5rem;
}

.pedidos-stepper__btn {
  width: 1.75rem;
  height: 1.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.1rem;
  font-weight: 700;
  line-height: 1;
}

.pedidos-stepper__count {
  min-width: 1.2rem;
  text-align: center;
  font-weight: 700;
  font-size: 0.85rem;
}
</style>
