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
    // Trae también los agotados: se muestran igual en la carta pero con el
    // botón de "Agregar" deshabilitado (ver MenuItemCard.vue), en vez de
    // desaparecer sin explicación.
    const { data, error: dbError } = await supabase
      .from("menu_items")
      .select("*, modifiers:menu_item_modifiers(id, nombre, precio_extra)")
      .order("categoria", { ascending: true })
      .order("nombre", { ascending: true });

    if (dbError) {
      error.value = dbError.message;
    } else {
      items.value = data || [];
    }
    loading.value = false;

    // El admin puede marcar/desmarcar "Agotado" mientras el cliente ya tiene
    // el menú abierto — esto lo refleja al instante, sin necesitar recargar.
    supabase
      .channel("menu-items-availability")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "menu_items" },
        (payload) => {
          // payload.new no trae el join a modifiers: se combina en vez de
          // reemplazar, para no perder los modificadores ya cargados.
          const idx = items.value.findIndex((i) => i.id === payload.new.id);
          if (idx !== -1) items.value[idx] = { ...items.value[idx], ...payload.new };
        }
      )
      .subscribe();
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
