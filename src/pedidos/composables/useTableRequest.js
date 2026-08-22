// src/pedidos/composables/useTableRequest.js
import { ref } from "vue";
import { supabase } from "@/pedidos/lib/supabaseClient";

const TOAST_MESSAGES = {
  mesero: "Ya avisamos al mesero 👍",
  cuenta: "Ya pedimos tu cuenta 👍",
};

export function useTableRequest(tableId) {
  const toast = ref("");
  let toastTimer = null;

  function showToast(message) {
    toast.value = message;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toast.value = "";
    }, 3000);
  }

  async function sendRequest(tipo, extra = {}) {
    const { error } = await supabase.from("table_requests").insert({
      table_id: tableId,
      tipo,
      ...extra,
    });

    if (error) {
      showToast("No se pudo enviar, intenta de nuevo");
      return false;
    }

    showToast(TOAST_MESSAGES[tipo] || "Listo 👍");
    return true;
  }

  return { toast, sendRequest };
}
