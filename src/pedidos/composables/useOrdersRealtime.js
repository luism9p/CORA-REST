// src/pedidos/composables/useOrdersRealtime.js
import { ref, onMounted, onUnmounted } from "vue";
import { supabase } from "@/pedidos/lib/supabaseClient";
import { useAlertSound } from "./useAlertSound";

const ORDER_ITEMS_SELECT =
  "id, cantidad, nota, listo, menu_item:menu_items(nombre, precio), modifiers:order_item_modifiers(nombre, precio_extra)";

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

export function useOrdersRealtime() {
  const orders = ref([]);
  const loading = ref(true);
  const { playNewOrder } = useAlertSound();
  let channel = null;

  async function fetchOrders() {
    const { data } = await supabase
      .from("orders")
      .select(`*, order_items(${ORDER_ITEMS_SELECT})`)
      .gte("created_at", startOfToday())
      .order("created_at", { ascending: false });
    orders.value = data || [];
    loading.value = false;
  }

  async function fetchItemsFor(orderId) {
    const { data } = await supabase
      .from("order_items")
      .select(ORDER_ITEMS_SELECT)
      .eq("order_id", orderId);
    const idx = orders.value.findIndex((o) => o.id === orderId);
    if (idx !== -1) orders.value[idx].order_items = data || [];
  }

  function upsertOrder(row, { isNew = false } = {}) {
    const idx = orders.value.findIndex((o) => o.id === row.id);
    if (idx === -1) {
      orders.value.unshift({ ...row, order_items: [] });
      fetchItemsFor(row.id);
      if (isNew) playNewOrder();
    } else {
      orders.value[idx] = { ...orders.value[idx], ...row };
    }
  }

  onMounted(() => {
    fetchOrders();

    channel = supabase
      .channel("admin-orders")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "orders" },
        (payload) => upsertOrder(payload.new, { isNew: true })
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "orders" },
        (payload) => upsertOrder(payload.new)
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "order_items" },
        (payload) => {
          const orderId = payload.new?.order_id || payload.old?.order_id;
          if (orderId) fetchItemsFor(orderId);
        }
      )
      .subscribe();
  });

  onUnmounted(() => {
    if (channel) supabase.removeChannel(channel);
  });

  return { orders, loading, refetch: fetchOrders };
}
