// src/pedidos/composables/useOrderItems.js
// La lista reactiva de ítems ya vive en useOrdersRealtime (join anidado por
// pedido); este composable solo expone la mutación — el cambio vuelve a
// bajar por la suscripción realtime, no hace falta duplicar el fetch aquí.
import { supabase } from "@/pedidos/lib/supabaseClient";

export function useOrderItems() {
  async function toggleListo(itemId, listo) {
    await supabase.from("order_items").update({ listo }).eq("id", itemId);
  }

  return { toggleListo };
}
