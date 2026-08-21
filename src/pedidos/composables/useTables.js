// src/pedidos/composables/useTables.js
import { ref, onMounted } from "vue";
import { supabase } from "@/pedidos/lib/supabaseClient";

export function useTables() {
  const tables = ref([]);
  const loading = ref(true);

  onMounted(async () => {
    const { data } = await supabase.from("tables").select("*").order("numero");
    tables.value = data || [];
    loading.value = false;
  });

  return { tables, loading };
}
