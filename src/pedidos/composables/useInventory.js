// src/pedidos/composables/useInventory.js
// Vista de inventario para el admin: solo productos con inventariable=true
// (ver menu_items.inventariable / useMenuAdmin.js), con su stock actual y
// el historial de movimientos que permite "cuadrar cuentas" — ver
// supabase/migrations/20260905000001_add_inventory_tables.sql.
import { ref, computed, onMounted, onUnmounted } from "vue";
import { supabase } from "@/pedidos/lib/supabaseClient";

export function useInventory() {
  const items = ref([]);
  const loading = ref(true);
  let channel = null;

  // menu_item_inventory.menu_item_id es unique, así que PostgREST debería
  // embeber esto como un objeto — pero se maneja también el caso array
  // (algunas versiones de PostgREST lo devuelven así igual) en vez de
  // asumir una forma exacta.
  function normalizeStock(row) {
    const stock = Array.isArray(row.stock) ? row.stock[0] : row.stock;
    return {
      id: row.id,
      nombre: row.nombre,
      categoria: row.categoria,
      cantidad_actual: stock?.cantidad_actual ?? 0,
      updated_at: stock?.updated_at ?? null,
    };
  }

  async function fetchItems() {
    const { data } = await supabase
      .from("menu_items")
      .select("id, nombre, categoria, stock:menu_item_inventory(cantidad_actual, updated_at)")
      .eq("inventariable", true)
      .order("categoria", { ascending: true })
      .order("nombre", { ascending: true });
    items.value = (data || []).map(normalizeStock);
    loading.value = false;
  }

  onMounted(() => {
    fetchItems();

    // Para que una venta disparada por el trigger de la base (ver
    // decrement_menu_item_inventory) se refleje al instante en esta
    // pantalla, sin recargar — esa es la prueba visible de que el
    // descuento automático funciona sin que nadie lo supervise.
    channel = supabase
      .channel("inventory-admin")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "menu_item_inventory" },
        (payload) => {
          const idx = items.value.findIndex((i) => i.id === payload.new.menu_item_id);
          if (idx !== -1) items.value[idx].cantidad_actual = payload.new.cantidad_actual;
        }
      )
      .subscribe();
  });

  onUnmounted(() => {
    if (channel) supabase.removeChannel(channel);
  });

  const groupedByCategory = computed(() => {
    const groups = {};
    for (const item of items.value) {
      if (!groups[item.categoria]) groups[item.categoria] = [];
      groups[item.categoria].push(item);
    }
    return groups;
  });

  async function fetchMovements(menuItemId) {
    const { data } = await supabase
      .from("inventory_movements")
      .select("*")
      .eq("menu_item_id", menuItemId)
      .order("created_at", { ascending: false })
      .limit(50);
    return data || [];
  }

  async function applyAdjustment(menuItemId, tipo, cantidad, nota) {
    const { data, error } = await supabase
      .rpc("adjust_menu_item_inventory", {
        p_menu_item_id: menuItemId,
        p_tipo: tipo,
        p_cantidad: cantidad,
        p_nota: nota || null,
      })
      .single();

    if (!error && data) {
      const idx = items.value.findIndex((i) => i.id === menuItemId);
      if (idx !== -1) items.value[idx].cantidad_actual = data.cantidad_resultante;
    }
    return { data, error };
  }

  // 'restock': cantidad es un delta ("cuántas entraron").
  function restock(menuItemId, cantidad, nota) {
    return applyAdjustment(menuItemId, "restock", cantidad, nota);
  }

  // 'ajuste_conteo': cantidad es el conteo físico absoluto ("cuánto hay
  // ahora") — el backend calcula la diferencia contra lo esperado.
  function reconcile(menuItemId, conteoFisico, nota) {
    return applyAdjustment(menuItemId, "ajuste_conteo", conteoFisico, nota);
  }

  return { items, groupedByCategory, loading, fetchMovements, restock, reconcile };
}
