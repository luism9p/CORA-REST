// src/pedidos/composables/useSubmitOrder.js
// Arma el payload de ítems de un carrito y llama al RPC compartido
// submit_table_order — el mismo camino para un pedido de cliente
// (CartDrawer.vue, con session_token del check-in por GPS) y para uno que
// toma un mesero a mano (ManualOrderPanel.vue, sin session_token: la
// función lo permite cuando quien llama ya inició sesión como staff, ver
// la migración allow_staff_orders_without_session_token).
import { ref } from "vue";
import { supabase } from "@/pedidos/lib/supabaseClient";

export function useSubmitOrder() {
  const submitting = ref(false);
  const error = ref("");

  async function submitOrder({ tableId, metodoPago, total, items, sessionToken = null }) {
    submitting.value = true;
    error.value = "";

    const payload = items.map((line) => ({
      menu_item_id: line.menuItem.id,
      cantidad: line.cantidad,
      nota: line.nota || null,
      modifiers: (line.modifiers || []).map((mod) => ({
        nombre: mod.nombre,
        precio_extra: mod.precio_extra,
      })),
    }));

    const { data, error: rpcError } = await supabase
      .rpc("submit_table_order", {
        p_table_id: tableId,
        p_metodo_pago: metodoPago,
        p_delta_total: total,
        p_items: payload,
        p_session_token: sessionToken,
      })
      .single();

    submitting.value = false;

    if (rpcError || !data) {
      error.value = rpcError?.message || "No se pudo enviar el pedido, intenta de nuevo.";
      return null;
    }

    return data;
  }

  return { submitting, error, submitOrder };
}
