<script setup>
defineProps({
  modelValue: { type: String, default: "" },
});
defineEmits(["update:modelValue"]);

const METHODS = [
  { value: "efectivo", label: "Efectivo" },
  { value: "plin", label: "Plin" },
  { value: "tarjeta", label: "Tarjeta" },
];
</script>

<template>
  <div class="pedidos-payment">
    <p class="pedidos-payment__label">Método de pago</p>
    <div class="pedidos-payment__options">
      <button
        v-for="method in METHODS"
        :key="method.value"
        type="button"
        class="pedidos-payment__option"
        :class="{ 'pedidos-payment__option--active': modelValue === method.value }"
        @click="$emit('update:modelValue', method.value)"
      >
        {{ method.label }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.pedidos-payment__label {
  font-size: 0.8rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-muted);
  margin-bottom: 0.5rem;
}

.pedidos-payment__options {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.5rem;
}

.pedidos-payment__option {
  min-height: 2.75rem;
  border-radius: 0.5rem;
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  color: var(--color-text);
  font-weight: 600;
  font-size: 0.9rem;
  transition: background-color 150ms, color 150ms, border-color 150ms;
}

.pedidos-payment__option--active {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: #fff;
}
</style>
