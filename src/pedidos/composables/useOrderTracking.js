// src/pedidos/composables/useOrderTracking.js
// Sigue en tiempo real el pedido activo del cliente. Si el pedido ya no
// existe (por ejemplo, fue borrado desde el admin), notFound se pone en
// true para que quien lo use pueda limpiar el localStorage y volver al
// menú — nunca se debe quedar "cargando" para siempre.
import { ref, watch, onUnmounted } from "vue";
import { supabase } from "@/pedidos/lib/supabaseClient";

export function useOrderTracking(orderId) {
  const order = ref(null);
  const orderItems = ref([]);
  const loading = ref(true);
  const notFound = ref(false);
  let channel = null;

  async function fetchOrder(id) {
    loading.value = true;
    notFound.value = false;

    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error || !data) {
      order.value = null;
      orderItems.value = [];
      notFound.value = true;
      loading.value = false;
      return;
    }

    order.value = data;

    const { data: itemsData } = await supabase
      .from("order_items")
      .select("id, cantidad, nota, listo, menu_item:menu_items(nombre, precio)")
      .eq("order_id", id);

    orderItems.value = itemsData || [];
    loading.value = false;
  }

  function subscribe(id) {
    unsubscribe();
    channel = supabase
      .channel(`order-tracking-${id}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "orders", filter: `id=eq.${id}` },
        (payload) => {
          order.value = payload.new;
        }
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "orders", filter: `id=eq.${id}` },
        () => {
          order.value = null;
          notFound.value = true;
        }
      )
      .subscribe();
  }

  function unsubscribe() {
    if (channel) {
      supabase.removeChannel(channel);
      channel = null;
    }
  }

  watch(
    () => orderId.value,
    (id) => {
      if (!id) {
        unsubscribe();
        order.value = null;
        orderItems.value = [];
        loading.value = false;
        return;
      }
      fetchOrder(id);
      subscribe(id);
    },
    { immediate: true }
  );

  onUnmounted(unsubscribe);

  return { order, orderItems, loading, notFound };
}
