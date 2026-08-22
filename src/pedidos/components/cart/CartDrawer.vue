<script setup>
import { ref } from "vue";
import { useCart } from "@/pedidos/composables/useCart";
import { useLanguage } from "@/pedidos/composables/useLanguage";
import { supabase } from "@/pedidos/lib/supabaseClient";
import { formatCurrency } from "@/pedidos/utils/format";
import CartItemRow from "./CartItemRow.vue";
import PaymentMethodSelector from "./PaymentMethodSelector.vue";

const props = defineProps({
  open: { type: Boolean, default: false },
  tableId: { type: Number, required: true },
});
const emit = defineEmits(["close", "confirmed"]);

const cart = useCart();
const { t } = useLanguage();
const paymentMethod = ref("");
const submitting = ref(false);
const submitError = ref("");

async function confirmOrder() {
  if (!paymentMethod.value || cart.items.length === 0 || submitting.value) return;
  submitting.value = true;
  submitError.value = "";

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      table_id: props.tableId,
      total: cart.total.value,
      metodo_pago: paymentMethod.value,
    })
    .select()
    .single();

  if (orderError || !order) {
    submitError.value = t("orderError");
    submitting.value = false;
    return;
  }

  const rows = cart.items.map((line) => ({
    order_id: order.id,
    menu_item_id: line.menuItem.id,
    cantidad: line.cantidad,
    nota: line.nota || null,
  }));

  const { data: insertedItems, error: itemsError } = await supabase
    .from("order_items")
    .insert(rows)
    .select();

  if (itemsError || !insertedItems) {
    submitError.value = t("orderError");
    submitting.value = false;
    return;
  }

  // insert() preserva el orden de las filas insertadas, así que se puede
  // emparejar 1 a 1 con cart.items para saber a qué order_item corresponde
  // cada selección de modificadores.
  const modifierRows = cart.items.flatMap((line, i) =>
    (line.modifiers || []).map((mod) => ({
      order_item_id: insertedItems[i].id,
      nombre: mod.nombre,
      precio_extra: mod.precio_extra,
    }))
  );

  if (modifierRows.length > 0) {
    const { error: modifiersError } = await supabase.from("order_item_modifiers").insert(modifierRows);
    if (modifiersError) {
      submitError.value = t("orderError");
      submitting.value = false;
      return;
    }
  }

  cart.clear();
  paymentMethod.value = "";
  submitting.value = false;
  emit("confirmed", order.id);
}
</script>

<template>
  <div
    class="pedidos-cart-modal"
    :class="{ 'pedidos-cart-modal--open': open }"
    role="dialog"
    aria-modal="true"
    :aria-label="t('yourOrder')"
    @click.self="$emit('close')"
  >
    <div class="pedidos-cart-modal__box">
      <div class="pedidos-cart-modal__handle"></div>

      <div class="pedidos-cart-modal__header">
        <h2>{{ t("yourOrder") }}</h2>
        <button type="button" class="pedidos-cart-modal__close" aria-label="Cerrar" @click="$emit('close')">✕</button>
      </div>

      <div v-if="cart.items.length === 0" class="pedidos-cart-modal__empty">
        {{ t("emptyCart") }}
      </div>

      <template v-else>
        <div class="pedidos-cart-modal__list">
          <CartItemRow
            v-for="(line, index) in cart.items"
            :key="`${line.menuItem.id}-${index}`"
            :line="line"
            :index="index"
            @update-quantity="cart.updateQuantity"
            @update-note="cart.updateNote"
            @remove="cart.removeItem"
          />
        </div>

        <PaymentMethodSelector v-model="paymentMethod" />

        <div class="pedidos-cart-modal__total">
          <span>{{ t("total") }}</span>
          <span>{{ formatCurrency(cart.total.value) }}</span>
        </div>

        <p v-if="submitError" class="pedidos-cart-modal__error">{{ submitError }}</p>

        <button
          type="button"
          class="pedidos-cart-modal__confirm"
          :disabled="!paymentMethod || submitting"
          @click="confirmOrder"
        >
          {{ submitting ? t("sending") : t("confirmOrder") }}
        </button>
      </template>
    </div>
  </div>
</template>

<style scoped>
.pedidos-cart-modal {
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

.pedidos-cart-modal--open {
  opacity: 1;
  pointer-events: auto;
}

.pedidos-cart-modal__box {
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

.pedidos-cart-modal--open .pedidos-cart-modal__box {
  transform: translateY(0);
}

.pedidos-cart-modal__handle {
  width: 2.5rem;
  height: 0.35rem;
  border-radius: 9999px;
  background: var(--color-border);
  margin: 0.5rem auto 0.75rem;
}

.pedidos-cart-modal__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.5rem;
}

.pedidos-cart-modal__header h2 {
  font-size: 1.2rem;
  font-weight: 800;
}

.pedidos-cart-modal__close {
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 9999px;
  background: var(--color-bg);
}

.pedidos-cart-modal__empty {
  padding: 2rem 0;
  text-align: center;
  color: var(--color-muted);
}

.pedidos-cart-modal__list {
  margin-bottom: 1rem;
}

.pedidos-cart-modal__total {
  display: flex;
  justify-content: space-between;
  font-weight: 800;
  font-size: 1.1rem;
  padding: 1rem 0;
}

.pedidos-cart-modal__error {
  color: var(--color-nuevo);
  font-size: 0.85rem;
  margin-bottom: 0.5rem;
}

.pedidos-cart-modal__confirm {
  width: 100%;
  min-height: 3rem;
  border-radius: 9999px;
  background: var(--color-primary);
  color: #fff;
  font-weight: 700;
  font-size: 1rem;
}

.pedidos-cart-modal__confirm:disabled {
  opacity: 0.5;
}

.pedidos-cart-modal__confirm:not(:disabled):active {
  background: var(--color-primary-dark);
}
</style>
