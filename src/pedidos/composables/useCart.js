// src/pedidos/composables/useCart.js
// Carrito como composable "singleton": un solo estado reactivo a nivel de
// módulo, compartido por cualquier componente que llame useCart() dentro de
// la misma carga de página. No hace falta Pinia/Vuex para esto — cada
// /mesa/N es una página nueva (Astro static), así que no hay contaminación
// entre mesas distintas.
import { reactive, computed } from "vue";

const state = reactive({
  items: [], // { menuItem, cantidad, nota }
});

function addItem(menuItem, cantidad = 1, nota = "") {
  const existing = state.items.find(
    (i) => i.menuItem.id === menuItem.id && i.nota === nota
  );
  if (existing) {
    existing.cantidad += cantidad;
  } else {
    state.items.push({ menuItem, cantidad, nota });
  }
}

function updateQuantity(index, cantidad) {
  if (cantidad <= 0) {
    state.items.splice(index, 1);
    return;
  }
  state.items[index].cantidad = cantidad;
}

function updateNote(index, nota) {
  state.items[index].nota = nota;
}

function removeItem(index) {
  state.items.splice(index, 1);
}

function clear() {
  state.items.splice(0, state.items.length);
}

const total = computed(() =>
  state.items.reduce((sum, i) => sum + i.menuItem.precio * i.cantidad, 0)
);

const count = computed(() => state.items.reduce((sum, i) => sum + i.cantidad, 0));

export function useCart() {
  return {
    items: state.items,
    addItem,
    updateQuantity,
    updateNote,
    removeItem,
    clear,
    total,
    count,
  };
}
