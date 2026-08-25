<script setup>
import { ref } from "vue";
import { useCart } from "@/pedidos/composables/useCart";
import { useLanguage } from "@/pedidos/composables/useLanguage";
import { useDragSheet } from "@/pedidos/composables/useDragSheet";
import { useSubmitOrder } from "@/pedidos/composables/useSubmitOrder";
import { formatCurrency } from "@/pedidos/utils/format";
import { getStoredSession, isSessionValid } from "@/pedidos/utils/session";
import CartItemRow from "./CartItemRow.vue";
import PaymentMethodSelector from "./PaymentMethodSelector.vue";

const props = defineProps({
  open: { type: Boolean, default: false },
  tableId: { type: Number, required: true },
  // Distinto de tableId (la PK): la sesión de check-in se guarda en
  // localStorage por número de mesa (ver utils/session.js), igual que el
  // pedido en curso en orderStorage.js.
  tableNumero: { type: Number, required: true },
});
const emit = defineEmits(["close", "confirmed"]);

const cart = useCart();
const { t } = useLanguage();
const paymentMethod = ref("");
const { submitting, submitOrder } = useSubmitOrder();
const submitError = ref("");
const { onPointerDown, onPointerMove, onPointerUp, dragStyle } = useDragSheet({
  onDismiss: () => emit("close"),
});

async function confirmOrder() {
  if (!paymentMethod.value || cart.items.length === 0 || submitting.value) return;

  // El backend es quien de verdad hace cumplir esto — submit_table_order
  // rechaza la llamada si el session_token no existe o venció (ver
  // migración require_session_token_for_orders) — pero no tiene sentido ni
  // armar el payload si ya sabemos acá que no hay sesión válida. Alerta
  // bloqueante a propósito: no es un error que se pueda ignorar y seguir
  // pidiendo, hay que recargar para pasar el check-in de nuevo.
  const session = getStoredSession(props.tableNumero);
  if (!isSessionValid(session)) {
    alert(t("sessionExpiredAlert"));
    return;
  }

  submitError.value = "";

  // Varios celulares pueden escanear el mismo tag NFC de esta mesa y
  // confirmar casi al mismo tiempo. Por eso esto no es un insert directo:
  // submit_table_order() decide en una sola transacción atómica en el
  // servidor si esto es un pedido nuevo o una adición al que ya está activo
  // en la mesa (y suma los platos + el total ahí, no acá) — dos llamadas
  // simultáneas para la misma mesa no pueden crear dos pedidos duplicados.
  const result = await submitOrder({
    tableId: props.tableId,
    metodoPago: paymentMethod.value,
    total: cart.total.value,
    items: cart.items,
    sessionToken: session.token,
  });

  if (!result) {
    submitError.value = t("orderError");
    return;
  }

  cart.clear();
  paymentMethod.value = "";
  emit("confirmed", result.order_id, result.was_addition);
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
    <div class="pedidos-cart-modal__box" :style="dragStyle">
      <div
        class="pedidos-cart-modal__handle-hitbox"
        @pointerdown="onPointerDown"
        @pointermove="onPointerMove"
        @pointerup="onPointerUp"
        @pointercancel="onPointerUp"
      >
        <div class="pedidos-cart-modal__handle"></div>
      </div>

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
  backdrop-filter: blur(3px);
  -webkit-backdrop-filter: blur(3px);
  opacity: 0;
  pointer-events: none;
  transition: opacity 250ms var(--ease-out);
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
  transition: transform 400ms var(--ease-sheet);
}

.pedidos-cart-modal--open .pedidos-cart-modal__box {
  transform: translateY(0);
}

.pedidos-cart-modal__handle-hitbox {
  /* El área de agarre real es más grande que la barrita visible, y sin
     gestos del navegador (scroll/refresh) interfiriendo con el arrastre. */
  display: flex;
  justify-content: center;
  padding: 0.6rem 0 0.85rem;
  touch-action: none;
  cursor: grab;
}

.pedidos-cart-modal__handle-hitbox:active {
  cursor: grabbing;
}

.pedidos-cart-modal__handle {
  width: 2.5rem;
  height: 0.35rem;
  border-radius: 9999px;
  background: var(--color-border);
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
  letter-spacing: -0.01em;
}

.pedidos-cart-modal__close {
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 9999px;
  background: var(--color-bg);
  transition: transform 400ms var(--ease-spring);
}

.pedidos-cart-modal__close:active {
  transform: scale(0.9);
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
  transition: transform 400ms var(--ease-spring), background-color 150ms var(--ease-out), opacity 150ms;
}

.pedidos-cart-modal__confirm:disabled {
  opacity: 0.5;
}

.pedidos-cart-modal__confirm:not(:disabled):active {
  background: var(--color-primary-dark);
  transform: scale(0.96);
}
</style>
