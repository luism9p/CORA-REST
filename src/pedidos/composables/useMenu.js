// src/pedidos/composables/useMenu.js
import { ref, computed, onMounted } from "vue";
import { supabase } from "@/pedidos/lib/supabaseClient";

// Orden natural de la carta de CORA (el mismo de src/data/menu.json), para
// no mostrar las categorías en orden alfabético — los entrantes primero,
// las bebidas al final. Cualquier categoría nueva que no esté en esta lista
// simplemente cae al final, ordenada alfabéticamente entre ellas.
const CATEGORY_ORDER = [
  "Para Compartir",
  "Fondos Bien Taipa",
  "Filetes Fritos",
  "Milanesas",
  "Platos Especiales del Mar",
  "En Salsas",
  "A lo Pobre",
  "Tortillas",
  "Chaufa",
  "Adicionales",
  "Bebidas Naturales",
  "Gaseosas",
  "Cervezas",
];

function categoryRank(categoria) {
  const idx = CATEGORY_ORDER.indexOf(categoria);
  return idx === -1 ? CATEGORY_ORDER.length : idx;
}

export function useMenu() {
  const items = ref([]);
  const loading = ref(true);
  const error = ref(null);

  onMounted(async () => {
    loading.value = true;
    const { data, error: dbError } = await supabase
      .from("menu_items")
      .select("*")
      .eq("disponible", true)
      .order("categoria", { ascending: true })
      .order("nombre", { ascending: true });

    if (dbError) {
      error.value = dbError.message;
    } else {
      items.value = data || [];
    }
    loading.value = false;
  });

  const categories = computed(() => {
    const seen = new Set();
    const list = [];
    for (const item of items.value) {
      if (!seen.has(item.categoria)) {
        seen.add(item.categoria);
        list.push(item.categoria);
      }
    }
    return list.sort((a, b) => categoryRank(a) - categoryRank(b) || a.localeCompare(b));
  });

  const groupedByCategory = computed(() => {
    const groups = {};
    for (const item of items.value) {
      if (!groups[item.categoria]) groups[item.categoria] = [];
      groups[item.categoria].push(item);
    }
    return groups;
  });

  return { items, categories, groupedByCategory, loading, error };
}
