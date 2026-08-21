// src/pedidos/composables/useTableRequestsRealtime.js
import { ref, onMounted, onUnmounted } from "vue";
import { supabase } from "@/pedidos/lib/supabaseClient";
import { useAlertSound } from "./useAlertSound";

export function useTableRequestsRealtime() {
  const requests = ref([]);
  const { playRequest } = useAlertSound();
  let channel = null;

  async function fetchPending() {
    const { data } = await supabase
      .from("table_requests")
      .select("*, table:tables(numero)")
      .eq("estado", "pendiente")
      .order("created_at", { ascending: true });
    requests.value = data || [];
  }

  async function markAttended(id) {
    requests.value = requests.value.filter((r) => r.id !== id);
    await supabase.from("table_requests").update({ estado: "atendido" }).eq("id", id);
  }

  onMounted(() => {
    fetchPending();

    channel = supabase
      .channel("admin-table-requests")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "table_requests" },
        () => {
          fetchPending();
          playRequest();
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "table_requests" },
        () => fetchPending()
      )
      .subscribe();
  });

  onUnmounted(() => {
    if (channel) supabase.removeChannel(channel);
  });

  return { requests, markAttended };
}
