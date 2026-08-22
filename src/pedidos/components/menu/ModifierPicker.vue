<script setup>
import { ref, computed, watch } from "vue";
import { useCart } from "@/pedidos/composables/useCart";
import { formatCurrency } from "@/pedidos/utils/format";

const props = defineProps({
  open: { type: Boolean, default: false },
  item: { type: Object, default: null },
});
const emit = defineEmits(["close"]);

const cart = useCart();
const selected = ref(new Set());
const quantity = ref(1);

// Cada vez que se abre para un plato nuevo, arranca en blanco.
watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      selected.value = new Set();
      quantity.value = 1;
    }
  }
);

function toggle(modifierId) {
  const next = new Set(selected.value);
  if (next.has(modifierId)) next.delete(modifierId);
  else next.add(modifierId);
  selected.value = next;
}

const chosenModifiers = computed(() =>
  (props.item?.modifiers || []).filter((m) => selected.value.has(m.id))
);

const unitPrice = computed(() => {
  if (!props.item) return 0;
  const extra = chosenModifiers.value.reduce((sum, m) => sum + Number(m.precio_extra || 0), 0);
  return props.item.precio + extra;
});

function confirm() {
  cart.addItem(props.item, quantity.value, "", chosenModifiers.value);
  emit("close");
}
</script>

<template>
  <div
    class="pedidos-modifier-modal"
    :class="{ 'pedidos-modifier-modal--open': open }"
    role="dialog"
    aria-modal="true"
    :aria-label="item ? `Personalizar ${item.nombre}` : 'Personalizar plato'"
    @click.self="$emit('close')"
  >
    <div v-if="item" class="pedidos-modifier-modal__box">
      <div class="pedidos-modifier-modal__handle"></div>

      <div class="pedidos-modifier-modal__header">
        <h2>{{ item.nombre }}</h2>
        <button type="button" class="pedidos-modifier-modal__close" aria-label="Cerrar" @click="$emit('close')">✕</button>
      </div>

      <ul class="pedidos-modifier-modal__list">
        <li v-for="mod in item.modifiers" :key="mod.id">
          <label class="pedidos-modifier-modal__option">
            <span class="pedidos-modifier-modal__option-label">
              <input
                type="checkbox"
                :checked="selected.has(mod.id)"
                @change="toggle(mod.id)"
              />
              {{ mod.nombre }}
            </span>
            <span v-if="Number(mod.precio_extra) > 0" class="pedidos-modifier-modal__option-price">
              + {{ formatCurrency(mod.precio_extra) }}
            </span>
          </label>
        </li>
      </ul>

      <div class="pedidos-modifier-modal__stepper">
        <span>Cantidad</span>
        <div class="pedidos-stepper">
          <button type="button" class="pedidos-stepper__btn" aria-label="Quitar uno" @click="quantity = Math.max(1, quantity - 1)">−</button>
          <span class="pedidos-stepper__count">{{ quantity }}</span>
          <button type="button" class="pedidos-stepper__btn" aria-label="Agregar uno" @click="quantity++">+</button>
        </div>
      </div>

      <button type="button" class="pedidos-modifier-modal__confirm" @click="confirm">
        Agregar · {{ formatCurrency(unitPrice * quantity) }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.pedidos-modifier-modal {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  background: rgba(0, 0, 0, 0.5);
  opacity: 0;
  pointer-events: none;
  transition: opacity 250ms ease-out;
}

.pedidos-modifier-modal--open {
  opacity: 1;
  pointer-events: auto;
}

.pedidos-modifier-modal__box {
  width: 100%;
  max-width: 32rem;
  max-height: 85vh;
  overflow-y: auto;
  background: var(--color-surface);
  color: var(--color-text);
  border-radius: 1.25rem 1.25rem 0 0;
  padding: 0.75rem 1.25rem 1.5rem;
  transform: translateY(100%);
  transition: transform 300ms cubic-bezier(0.32, 0.72, 0, 1);
}

.pedidos-modifier-modal--open .pedidos-modifier-modal__box {
  transform: translateY(0);
}

.pedidos-modifier-modal__handle {
  width: 2.5rem;
  height: 0.35rem;
  border-radius: 9999px;
  background: var(--color-border);
  margin: 0.5rem auto 0.75rem;
}

.pedidos-modifier-modal__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.75rem;
}

.pedidos-modifier-modal__header h2 {
  font-size: 1.15rem;
  font-weight: 800;
}

.pedidos-modifier-modal__close {
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 9999px;
  background: var(--color-bg);
  flex-shrink: 0;
}

.pedidos-modifier-modal__list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.pedidos-modifier-modal__option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.75rem 0.5rem;
  border-radius: 0.6rem;
  border: 1px solid var(--color-border);
}

.pedidos-modifier-modal__option-label {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  font-weight: 600;
}

.pedidos-modifier-modal__option-label input {
  width: 1.25rem;
  height: 1.25rem;
}

.pedidos-modifier-modal__option-price {
  font-size: 0.85rem;
  color: var(--color-muted);
  white-space: nowrap;
}

.pedidos-modifier-modal__stepper {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 0;
  border-top: 1px solid var(--color-border);
  font-weight: 700;
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

.pedidos-modifier-modal__confirm {
  width: 100%;
  min-height: 3rem;
  border-radius: 9999px;
  background: var(--color-primary);
  color: #fff;
  font-weight: 700;
  font-size: 1rem;
  margin-top: 0.5rem;
}

.pedidos-modifier-modal__confirm:active {
  background: var(--color-primary-dark);
}
</style>
