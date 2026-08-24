<script setup>
import { ref, computed, watch } from "vue";
import { useTable } from "@/pedidos/composables/useTable";
import { useMenu } from "@/pedidos/composables/useMenu";
import { useCart } from "@/pedidos/composables/useCart";
import { useTheme } from "@/pedidos/composables/useTheme";
import { useBusinessHours } from "@/pedidos/composables/useBusinessHours";
import { useOrderTracking } from "@/pedidos/composables/useOrderTracking";
import { useLanguage } from "@/pedidos/composables/useLanguage";
import {
  getStoredOrderId,
  setStoredOrderId,
  clearStoredOrderId,
} from "@/pedidos/utils/orderStorage";

import LoadingSpinner from "@/pedidos/components/common/LoadingSpinner.vue";
import CategoryTabs from "@/pedidos/components/menu/CategoryTabs.vue";
import SearchBar from "@/pedidos/components/menu/SearchBar.vue";
import MenuItemCard from "@/pedidos/components/menu/MenuItemCard.vue";
import CartDrawer from "@/pedidos/components/cart/CartDrawer.vue";
import CrossSellPrompt from "@/pedidos/components/menu/CrossSellPrompt.vue";
import QuickActions from "@/pedidos/components/QuickActions.vue";
import ThemeToggleButton from "@/pedidos/components/ThemeToggleButton.vue";
import LanguageToggle from "@/pedidos/components/LanguageToggle.vue";
import OrderTrackingView from "./OrderTrackingView.vue";
import ThankYouView from "./ThankYouView.vue";
import ClosedView from "./ClosedView.vue";

const props = defineProps({
  tableId: { type: Number, required: true },
});

const { table, loading: tableLoading, error: tableError } = useTable(props.tableId);
const { theme, toggleTheme } = useTheme();
const { t } = useLanguage();
const { isOpen } = useBusinessHours();
const cart = useCart();
const { categories, groupedByCategory, loading: menuLoading } = useMenu();

const view = ref("menu"); // 'menu' | 'tracking' | 'thankyou'
const activeOrderId = ref(null);
const justAddedToTable = ref(false);
const activeCategory = ref("");
const searchTerm = ref("");
const cartOpen = ref(false);
const initialized = ref(false);

const { order, orderItems, notFound } = useOrderTracking(activeOrderId);

// En cuanto conocemos la mesa, revisamos si ya había un pedido activo
// guardado en localStorage (recarga de página accidental) antes de mostrar
// el menú desde cero.
watch(
  table,
  (t) => {
    if (!t || initialized.value) return;
    initialized.value = true;
    const stored = getStoredOrderId(t.numero);
    if (stored) {
      activeOrderId.value = stored;
      view.value = "tracking";
    }
  },
  { immediate: true }
);

watch(categories, (list) => {
  if (list.length > 0 && !activeCategory.value) {
    activeCategory.value = list[0];
  }
});

watch(
  () => order.value?.estado,
  (estado) => {
    if (estado === "entregado") view.value = "thankyou";
  }
);

// El pedido guardado ya no existe (p. ej. lo borraron desde el admin):
// limpiamos y volvemos al menú en vez de quedarnos cargando para siempre.
watch(notFound, (isNotFound) => {
  if (isNotFound && view.value === "tracking") {
    if (table.value) clearStoredOrderId(table.value.numero);
    activeOrderId.value = null;
    view.value = "menu";
  }
});

function normalize(text) {
  return (text || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

const filteredItems = computed(() => {
  const term = normalize(searchTerm.value.trim());
  if (!term) return null; // null = usar vista normal por categoría
  const all = Object.values(groupedByCategory.value).flat();
  return all.filter(
    (item) =>
      normalize(item.nombre).includes(term) ||
      normalize(item.descripcion).includes(term) ||
      normalize(item.nombre_en).includes(term) ||
      normalize(item.descripcion_en).includes(term)
  );
});

function handleConfirmed(orderId, wasAddition) {
  if (table.value) setStoredOrderId(table.value.numero, orderId);
  activeOrderId.value = orderId;
  justAddedToTable.value = Boolean(wasAddition);
  cartOpen.value = false;
  view.value = "tracking";
}

function handleNewOrder() {
  if (table.value) clearStoredOrderId(table.value.numero);
  activeOrderId.value = null;
  view.value = "menu";
}
</script>

<template>
  <div class="mesa-theme-root" :data-theme="theme">
    <LoadingSpinner v-if="tableLoading" :label="t('loadingTable')" />

    <div v-else-if="tableError" class="mesa-app__error">
      {{ tableError }}
    </div>

    <template v-else-if="table">
      <ThemeToggleButton :theme="theme" @toggle="toggleTheme" />
      <LanguageToggle />
      <!-- Fuera de horario y sin pedido en curso no hay nada que pedir/pedir
           la cuenta de, así que las acciones rápidas solo se ocultan en ese
           caso puntual — si ya tienen un pedido activo, se quedan visibles
           aunque el reloj haya pasado la hora de cierre mientras comían. -->
      <QuickActions
        v-if="isOpen || view !== 'menu'"
        :table-id="table.id"
        :order-id="order?.id ?? null"
        :order-total="order?.total ?? 0"
      />

      <!-- Cerrado (y sin pedido en curso) -->
      <ClosedView v-if="view === 'menu' && !isOpen" />

      <!-- Menú -->
      <div v-else-if="view === 'menu'" class="mesa-app__menu">
        <div class="mesa-app__menu-header">
          <SearchBar v-model="searchTerm" />
          <CategoryTabs
            v-if="!searchTerm"
            :categories="categories"
            :active-category="activeCategory"
            @select="activeCategory = $event"
          />
        </div>

        <LoadingSpinner v-if="menuLoading" :label="t('loadingMenu')" />

        <div v-else class="mesa-app__grid">
          <MenuItemCard
            v-for="item in filteredItems ?? groupedByCategory[activeCategory] ?? []"
            :key="item.id"
            :item="item"
          />
          <p v-if="filteredItems && filteredItems.length === 0" class="mesa-app__empty">
            {{ t("noResultsFor", searchTerm) }}
          </p>
          <p v-else-if="!filteredItems && categories.length === 0" class="mesa-app__empty">
            {{ t("menuNotReady") }}
          </p>
        </div>

        <Transition name="mesa-app-fab">
          <button
            v-if="cart.count.value > 0"
            type="button"
            class="mesa-app__cart-fab"
            @click="cartOpen = true"
          >
            {{ t("viewOrder", cart.count.value) }}
          </button>
        </Transition>

        <CartDrawer :open="cartOpen" :table-id="table.id" @close="cartOpen = false" @confirmed="handleConfirmed" />
        <CrossSellPrompt />
      </div>

      <!-- Seguimiento -->
      <div v-else-if="view === 'tracking'">
        <LoadingSpinner v-if="!order" :label="t('lookingUpOrder')" />
        <OrderTrackingView
          v-else
          :order="order"
          :order-items="orderItems"
          :just-added="justAddedToTable"
        />
      </div>

      <!-- Agradecimiento -->
      <ThankYouView v-else-if="view === 'thankyou'" @new-order="handleNewOrder" />
    </template>
  </div>
</template>

<style>
@import "../styles/pedidos.css";
</style>

<style scoped>
.mesa-app__error {
  max-width: 24rem;
  margin: 4rem auto;
  text-align: center;
  color: var(--color-nuevo);
  font-weight: 600;
  padding: 0 1.25rem;
}

.mesa-app__menu {
  padding: 1rem 1rem 6rem;
  max-width: 40rem;
  margin: 0 auto;
}

.mesa-app__menu-header {
  position: sticky;
  top: 0;
  z-index: 20;
  background: var(--color-bg);
  padding-bottom: 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.mesa-app__grid {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-top: 1rem;
}

.mesa-app__empty {
  text-align: center;
  color: var(--color-muted);
  padding: 2rem 0;
}

.mesa-app__cart-fab {
  /* Esquina inferior derecha, ancho según contenido — no abajo-a-lo-ancho,
     para no chocar con QuickActions (🙋/🧾) que vive abajo a la izquierda. */
  position: fixed;
  bottom: 1rem;
  right: 1rem;
  min-height: 3.25rem;
  padding: 0 1.5rem;
  border-radius: 9999px;
  background: var(--color-primary);
  color: #fff;
  font-weight: 700;
  white-space: nowrap;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.25);
  z-index: 30;
  transition: transform 400ms var(--ease-spring), background-color 150ms var(--ease-out);
}

.mesa-app__cart-fab:active {
  background: var(--color-primary-dark);
  transform: scale(0.94);
}

.mesa-app-fab-enter-active {
  transition: opacity 400ms var(--ease-spring), transform 400ms var(--ease-spring);
}
.mesa-app-fab-leave-active {
  transition: opacity 200ms var(--ease-out), transform 200ms var(--ease-out);
}
.mesa-app-fab-enter-from,
.mesa-app-fab-leave-to {
  opacity: 0;
  transform: scale(0.7) translateY(0.5rem);
}
</style>
