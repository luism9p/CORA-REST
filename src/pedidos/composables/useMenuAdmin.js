// src/pedidos/composables/useMenuAdmin.js
// Gestión de disponibilidad de platos desde el admin. A diferencia de
// useMenu.js (que trae la carta para el cliente), este composable trae
// todos los platos sin filtrar, agrupados para editar.
import { ref, computed, onMounted } from "vue";
import { supabase } from "@/pedidos/lib/supabaseClient";

export function useMenuAdmin() {
  const items = ref([]);
  const loading = ref(true);

  onMounted(async () => {
    const { data } = await supabase
      .from("menu_items")
      .select("*")
      .order("categoria", { ascending: true })
      .order("nombre", { ascending: true });
    items.value = data || [];
    loading.value = false;
  });

  const groupedByCategory = computed(() => {
    const groups = {};
    for (const item of items.value) {
      if (!groups[item.categoria]) groups[item.categoria] = [];
      groups[item.categoria].push(item);
    }
    return groups;
  });

  async function setDisponible(item, disponible) {
    const previous = item.disponible;
    item.disponible = disponible; // optimista: el toggle responde al instante
    const { error } = await supabase
      .from("menu_items")
      .update({ disponible })
      .eq("id", item.id);
    if (error) item.disponible = previous; // revierte si falló
  }

  return { items, groupedByCategory, loading, setDisponible };
}
