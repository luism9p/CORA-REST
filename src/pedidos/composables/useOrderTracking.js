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
      .select("id, cantidad, nota, estado, menu_item:menu_items(nombre, nombre_en, precio), modifiers:order_item_modifiers(nombre, precio_extra)")
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
      .on(
        // Despachos parciales: el admin marca cada plato por separado
        // (preparando/listo_para_servir/en_mesa), y esto lo refleja en la
        // pantalla del cliente al instante, sin recargar.
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "order_items", filter: `order_id=eq.${id}` },
        (payload) => {
          const idx = orderItems.value.findIndex((i) => i.id === payload.new.id);
          // payload.new no trae los joins a menu_item/modifiers: se combina
          // en vez de reemplazar, para no perderlos.
          if (idx !== -1) orderItems.value[idx] = { ...orderItems.value[idx], ...payload.new };
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
