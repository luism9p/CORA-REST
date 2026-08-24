<script setup>
import { computed } from "vue";
import { useLanguage } from "@/pedidos/composables/useLanguage";

defineProps({
  modelValue: { type: String, default: "" },
});
defineEmits(["update:modelValue"]);

const { t } = useLanguage();

const METHODS = computed(() => [
  { value: "efectivo", label: t("payCash") },
  // Valor guardado en BD: "Yape/Plin" (no "plin") — la dueña pidió que la
  // billetera digital cubra ambas apps. Los pedidos históricos con
  // metodo_pago="plin" se quedan como están (ver migración); esto solo
  // cambia lo que se guarda de ahora en adelante.
  { value: "Yape/Plin", label: t("payPlin") },
  { value: "tarjeta", label: t("payCard") },
]);
</script>

<template>
  <div class="pedidos-payment">
    <p class="pedidos-payment__label">{{ t("paymentMethod") }}</p>
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
  /* minmax(0, 1fr) y no un "1fr" a secas: un track 1fr no se encoge más
     allá del ancho de su contenido, así que "Yape / Plin" podía forzar la
     columna a desbordar el grid en pantallas angostas. Con minmax(0, 1fr)
     las 3 columnas quedan realmente fluidas y el texto envuelve en vez de
     romper el layout. */
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.5rem;
}

.pedidos-payment__option {
  min-height: 2.75rem;
  padding: 0.4rem 0.3rem;
  border-radius: 0.5rem;
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  color: var(--color-text);
  font-weight: 600;
  font-size: 0.82rem;
  line-height: 1.15;
  text-align: center;
  transition: background-color 150ms, color 150ms, border-color 150ms;
}

.pedidos-payment__option--active {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: #fff;
}
</style>
