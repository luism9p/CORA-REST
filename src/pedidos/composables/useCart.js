// src/pedidos/composables/useCart.js
// Carrito como composable "singleton": un solo estado reactivo a nivel de
// módulo, compartido por cualquier componente que llame useCart() dentro de
// la misma carga de página. No hace falta Pinia/Vuex para esto — cada
// /mesa/N es una página nueva (Astro static), así que no hay contaminación
// entre mesas distintas.
import { reactive, computed } from "vue";

const state = reactive({
  items: [], // { menuItem, cantidad, nota, modifiers }
});

// Firma estable de una combinación de modificadores, para saber si dos
// líneas del carrito son "la misma" (mismo plato + misma nota + mismos
// modificadores) y se pueden sumar en vez de crear una línea nueva.
function modifiersKey(modifiers) {
  return (modifiers || [])
    .map((m) => m.nombre)
    .sort()
    .join("|");
}

function addItem(menuItem, cantidad = 1, nota = "", modifiers = []) {
  const existing = state.items.find(
    (i) =>
      i.menuItem.id === menuItem.id &&
      i.nota === nota &&
      modifiersKey(i.modifiers) === modifiersKey(modifiers)
  );
  if (existing) {
    existing.cantidad += cantidad;
  } else {
    state.items.push({ menuItem, cantidad, nota, modifiers });
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

export function modifiersExtra(modifiers) {
  return (modifiers || []).reduce((sum, m) => sum + Number(m.precio_extra || 0), 0);
}

export function lineUnitPrice(line) {
  return line.menuItem.precio + modifiersExtra(line.modifiers);
}

const total = computed(() =>
  state.items.reduce((sum, i) => sum + lineUnitPrice(i) * i.cantidad, 0)
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
