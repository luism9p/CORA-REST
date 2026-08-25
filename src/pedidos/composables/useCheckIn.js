// src/pedidos/composables/useCheckIn.js
// Llama a la Edge Function check-in con las coordenadas que ya capturó
// LocationCheck.vue, y si el backend confirma que el cliente está dentro
// del radio del restaurante (y en horario), guarda la sesión en
// localStorage para no volver a pedirle el GPS mientras siga vigente.
import { ref } from "vue";
import { useLanguage } from "@/pedidos/composables/useLanguage";
import { setStoredSession, SESSION_DURATION_MS } from "@/pedidos/utils/session";

const CHECK_IN_URL = `${import.meta.env.PUBLIC_SUPABASE_URL}/functions/v1/check-in`;
const ANON_KEY = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

export function useCheckIn() {
  const { t } = useLanguage();
  const checking = ref(false);
  const error = ref("");

  async function checkIn({ tableNumber, tableId, latitude, longitude }) {
    checking.value = true;
    error.value = "";

    try {
      const res = await fetch(CHECK_IN_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${ANON_KEY}`,
          apikey: ANON_KEY,
        },
        body: JSON.stringify({ table_id: tableId, client_lat: latitude, client_lon: longitude }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.success) {
        // El backend ya manda mensajes listos para mostrar tal cual ("Estás
        // fuera de la zona...", "El restaurante se encuentra cerrado.").
        error.value = data?.error || t("locationCheckInError");
        return false;
      }

      setStoredSession(tableNumber, {
        token: data.session_token,
        expiresAt: Date.now() + SESSION_DURATION_MS,
        tableId: data.table_id,
      });
      return true;
    } catch {
      error.value = t("locationCheckInError");
      return false;
    } finally {
      checking.value = false;
    }
  }

  return { checking, error, checkIn };
}
