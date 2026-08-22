// src/pedidos/composables/useTableRequest.js
import { ref } from "vue";
import { supabase } from "@/pedidos/lib/supabaseClient";
import { useLanguage } from "@/pedidos/composables/useLanguage";

const TOAST_MESSAGES = {
  es: { mesero: "Ya avisamos al mesero 👍", cuenta: "Ya pedimos tu cuenta 👍" },
  en: { mesero: "The waiter has been notified 👍", cuenta: "We requested your bill 👍" },
};

export function useTableRequest(tableId) {
  const { language, t } = useLanguage();
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
      showToast(t("requestError"));
      return false;
    }

    showToast(TOAST_MESSAGES[language.value][tipo] || t("requestDone"));
    return true;
  }

  return { toast, sendRequest };
}
