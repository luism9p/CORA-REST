// src/pedidos/composables/useTable.js
// Valida que el número de mesa exista y esté activa antes de dejar pedir.
import { ref, onMounted } from "vue";
import { supabase } from "@/pedidos/lib/supabaseClient";

export function useTable(tableNumber) {
  const table = ref(null);
  const loading = ref(true);
  const error = ref(null);

  onMounted(async () => {
    loading.value = true;
    error.value = null;
    const { data, error: dbError } = await supabase
      .from("tables")
      .select("id, numero, activa")
      .eq("numero", tableNumber)
      .maybeSingle();

    if (dbError) {
      error.value = dbError.message;
    } else if (!data || !data.activa) {
      error.value = "Esta mesa no está disponible.";
    } else {
      table.value = data;
    }
    loading.value = false;
  });

  return { table, loading, error };
}
