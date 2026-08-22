// src/pedidos/composables/useCrossSell.js
// Sugerencia de "Acompaña tu pedido con..." al agregar un plato fuerte, para
// subir el ticket promedio. Singleton (mismo patrón que useCart.js): el
// aviso vive en MesaApp.vue pero lo dispara MenuItemCard.vue al agregar.
import { reactive, computed } from "vue";
import { supabase } from "@/pedidos/lib/supabaseClient";
import { useCart } from "@/pedidos/composables/useCart";

const DRINK_CATEGORIES = ["Bebidas Naturales", "Gaseosas", "Cervezas"];

const state = reactive({
  visible: false,
  suggestions: [],
  shownThisSession: false, // no molestar más de una vez por visita
});

let drinksCache = null;

async function loadDrinks() {
  if (drinksCache) return drinksCache;
  const { data } = await supabase
    .from("menu_items")
    .select("id, nombre, nombre_en, precio, categoria, disponible")
    .in("categoria", DRINK_CATEGORIES)
    .eq("disponible", true);
  drinksCache = data || [];
  return drinksCache;
}

function cartHasDrink() {
  const cart = useCart();
  return cart.items.some((line) => DRINK_CATEGORIES.includes(line.menuItem.categoria));
}

async function maybeTrigger(item) {
  if (state.shownThisSession) return;
  if (DRINK_CATEGORIES.includes(item.categoria)) return; // ya es una bebida
  if (cartHasDrink()) return; // ya se acompañó

  const drinks = await loadDrinks();
  if (drinks.length === 0) return;

  state.suggestions = [...drinks].sort(() => Math.random() - 0.5).slice(0, 3);
  state.visible = true;
  state.shownThisSession = true;
  setTimeout(dismiss, 6000); // no se queda pegado en pantalla si lo ignoran
}

function dismiss() {
  state.visible = false;
}

export function useCrossSell() {
  return {
    visible: computed(() => state.visible),
    suggestions: computed(() => state.suggestions),
    maybeTrigger,
    dismiss,
  };
}
