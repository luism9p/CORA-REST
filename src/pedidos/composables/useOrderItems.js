// src/pedidos/composables/useOrderItems.js
// La lista reactiva de ítems ya vive en useOrdersRealtime (join anidado por
// pedido); este composable solo expone la mutación — el cambio vuelve a
// bajar por la suscripción realtime, no hace falta duplicar el fetch aquí.
import { supabase } from "@/pedidos/lib/supabaseClient";

export function useOrderItems() {
  async function setItemStatus(itemId, estado) {
    await supabase.from("order_items").update({ estado }).eq("id", itemId);
  }

  return { setItemStatus };
}
