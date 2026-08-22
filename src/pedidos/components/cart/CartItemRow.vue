<script setup>
import { computed } from "vue";
import { formatCurrency } from "@/pedidos/utils/format";
import { lineUnitPrice } from "@/pedidos/composables/useCart";
import { useLanguage } from "@/pedidos/composables/useLanguage";
import { localizedName } from "@/pedidos/utils/localizedMenuField";

const props = defineProps({
  line: { type: Object, required: true },
  index: { type: Number, required: true },
});
const emit = defineEmits(["update-quantity", "update-note", "remove"]);

const { language, t } = useLanguage();
const lineTotal = computed(() => lineUnitPrice(props.line) * props.line.cantidad);
const displayName = computed(() => localizedName(props.line.menuItem, language.value));
</script>

<template>
  <div class="pedidos-cart-row">
    <div class="pedidos-cart-row__main">
      <span class="pedidos-cart-row__name">{{ displayName }}</span>
      <span class="pedidos-cart-row__price">{{ formatCurrency(lineTotal) }}</span>
    </div>

    <ul v-if="line.modifiers?.length" class="pedidos-cart-row__modifiers">
      <li v-for="mod in line.modifiers" :key="mod.nombre">
        + {{ mod.nombre }}<span v-if="Number(mod.precio_extra) > 0"> ({{ formatCurrency(mod.precio_extra) }})</span>
      </li>
    </ul>

    <input
      type="text"
      class="pedidos-cart-row__note"
      :placeholder="t('notePlaceholder')"
      :value="line.nota"
      @input="emit('update-note', index, $event.target.value)"
    />

    <div class="pedidos-cart-row__footer">
      <div class="pedidos-stepper">
        <button type="button" class="pedidos-stepper__btn" :aria-label="t('removeOne')" @click="emit('update-quantity', index, line.cantidad - 1)">−</button>
        <span class="pedidos-stepper__count">{{ line.cantidad }}</span>
        <button type="button" class="pedidos-stepper__btn" :aria-label="t('addOne')" @click="emit('update-quantity', index, line.cantidad + 1)">+</button>
      </div>
      <button type="button" class="pedidos-cart-row__remove" @click="emit('remove', index)">{{ t("remove") }}</button>
    </div>
  </div>
</template>

<style scoped>
.pedidos-cart-row {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 0.75rem 0;
  border-bottom: 1px solid var(--color-border);
}

.pedidos-cart-row__main {
  display: flex;
  justify-content: space-between;
  gap: 0.5rem;
  font-weight: 700;
  color: var(--color-text);
}

.pedidos-cart-row__modifiers {
  font-size: 0.8rem;
  color: var(--color-muted);
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
}

.pedidos-cart-row__note {
  min-height: 2.25rem;
  padding: 0 0.6rem;
  border-radius: 0.5rem;
  border: 1px solid var(--color-border);
  background: var(--color-bg);
  color: var(--color-text);
  font-size: 16px;
}

.pedidos-cart-row__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.pedidos-cart-row__remove {
  font-size: 0.8rem;
  color: var(--color-muted);
  text-decoration: underline;
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
