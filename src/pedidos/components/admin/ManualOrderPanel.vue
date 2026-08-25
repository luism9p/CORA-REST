<script setup>
// src/pedidos/components/admin/ManualOrderPanel.vue
// "Tomar pedidos manualmente": un mesero arma el pedido de una mesa a mano
// (walk-in, cliente que no quiere usar el celular, etc.) desde el mismo
// panel donde ve las mesas. Reusa el menú y el carrito del cliente
// (useMenu/useCart/MenuItemCard) — es la misma carta, solo que la arma el
// mesero en vez del cliente — y el mismo submit_table_order() de
// CartDrawer.vue vía useSubmitOrder.js, sin session_token: la función
// permite eso cuando quien llama ya inició sesión como staff (ver
// allow_staff_orders_without_session_token), porque estar autenticado en
// el panel ya prueba presencia con más peso que el check-in por GPS.
import { ref, watch, onMounted } from "vue";
import { useMenu } from "@/pedidos/composables/useMenu";
import { useCart } from "@/pedidos/composables/useCart";
import { useSubmitOrder } from "@/pedidos/composables/useSubmitOrder";
import { formatCurrency } from "@/pedidos/utils/format";
import LoadingSpinner from "@/pedidos/components/common/LoadingSpinner.vue";
import CategoryTabs from "@/pedidos/components/menu/CategoryTabs.vue";
import MenuItemCard from "@/pedidos/components/menu/MenuItemCard.vue";
import CartItemRow from "@/pedidos/components/cart/CartItemRow.vue";
import PaymentMethodSelector from "@/pedidos/components/cart/PaymentMethodSelector.vue";

const props = defineProps({
  table: { type: Object, required: true },
});
const emit = defineEmits(["close", "submitted"]);

const { categories, groupedByCategory, loading: menuLoading } = useMenu();
const cart = useCart();
const { submitting, error: submitError, submitOrder } = useSubmitOrder();

const activeCategory = ref("");
const paymentMethod = ref("");

watch(
  categories,
  (list) => {
    if (list.length > 0 && !activeCategory.value) activeCategory.value = list[0];
  },
  { immediate: true }
);

// El carrito es un singleton por carga de página (ver useCart.js) — en
// /mesa/N eso está bien porque cada mesa es una página nueva, pero acá el
// mesero puede abrir este panel para varias mesas distintas sin recargar.
// Sin este reset, un pedido a medio armar y cancelado para la Mesa 3
// seguiría apareciendo al abrir la Mesa 5.
onMounted(() => cart.clear());

async function confirm() {
  if (!paymentMethod.value || cart.items.length === 0 || submitting.value) return;

  const result = await submitOrder({
    tableId: props.table.id,
    metodoPago: paymentMethod.value,
    total: cart.total.value,
    items: cart.items,
  });

  if (!result) return;

  cart.clear();
  paymentMethod.value = "";
  emit("submitted", result.order_id);
}

function close() {
  cart.clear();
  emit("close");
}
</script>

<template>
  <div class="manual-order" role="dialog" aria-modal="true" :aria-label="`Nuevo pedido — Mesa ${table.numero}`">
    <div class="manual-order__header">
      <h2>Mesa {{ table.numero }} · Nuevo pedido</h2>
      <button type="button" class="manual-order__close" aria-label="Cerrar" @click="close">✕</button>
    </div>

    <LoadingSpinner v-if="menuLoading" label="Cargando la carta..." />

    <template v-else>
      <CategoryTabs
        :categories="categories"
        :active-category="activeCategory"
        @select="activeCategory = $event"
      />

      <div class="manual-order__menu">
        <MenuItemCard
          v-for="item in groupedByCategory[activeCategory] ?? []"
          :key="item.id"
          :item="item"
        />
      </div>

      <div v-if="cart.items.length > 0" class="manual-order__summary">
        <h3 class="manual-order__summary-title">Resumen del pedido</h3>

        <CartItemRow
          v-for="(line, index) in cart.items"
          :key="`${line.menuItem.id}-${index}`"
          :line="line"
          :index="index"
          @update-quantity="cart.updateQuantity"
          @update-note="cart.updateNote"
          @remove="cart.removeItem"
        />

        <PaymentMethodSelector v-model="paymentMethod" />

        <div class="manual-order__total">
          <span>Total</span>
          <span>{{ formatCurrency(cart.total.value) }}</span>
        </div>

        <p v-if="submitError" class="manual-order__error">{{ submitError }}</p>

        <button
          type="button"
          class="manual-order__confirm"
          :disabled="!paymentMethod || submitting"
          @click="confirm"
        >
          {{ submitting ? "Enviando..." : "Confirmar pedido" }}
        </button>
      </div>
    </template>
  </div>
</template>

<style scoped>
.manual-order {
  width: 100%;
  max-width: 34rem;
  max-height: 85vh;
  overflow-y: auto;
  background: var(--color-surface);
  color: var(--color-text);
  border-radius: 1.25rem;
  padding: 1.25rem;
}

.manual-order__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 1rem;
}

.manual-order__header h2 {
  font-size: 1.2rem;
  font-weight: 800;
}

.manual-order__close {
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 9999px;
  background: var(--color-bg);
  flex-shrink: 0;
}

.manual-order__menu {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  margin: 1rem 0;
}

.manual-order__summary {
  border-top: 1px solid var(--color-border);
  padding-top: 1rem;
  margin-top: 1rem;
}

.manual-order__summary-title {
  font-size: 1rem;
  font-weight: 800;
  margin-bottom: 0.5rem;
}

.manual-order__total {
  display: flex;
  justify-content: space-between;
  font-weight: 800;
  font-size: 1.1rem;
  padding: 1rem 0;
}

.manual-order__error {
  color: var(--color-nuevo);
  font-size: 0.85rem;
  margin-bottom: 0.5rem;
}

.manual-order__confirm {
  width: 100%;
  min-height: 3rem;
  border-radius: 9999px;
  background: var(--color-primary);
  color: #fff;
  font-weight: 700;
  font-size: 1rem;
  transition: transform 400ms var(--ease-spring), background-color 150ms var(--ease-out), opacity 150ms;
}

.manual-order__confirm:disabled {
  opacity: 0.5;
}

.manual-order__confirm:not(:disabled):active {
  background: var(--color-primary-dark);
  transform: scale(0.96);
}
</style>
