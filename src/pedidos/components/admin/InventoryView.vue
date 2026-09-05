<script setup>
import { ref } from "vue";
import { useInventory } from "@/pedidos/composables/useInventory";
import LoadingSpinner from "@/pedidos/components/common/LoadingSpinner.vue";

const { groupedByCategory, loading, fetchMovements, restock, reconcile } = useInventory();

const expandedItemId = ref(null);
const movementsByItem = ref({});
const restockAmount = ref("");
const restockNota = ref("");
const conteoAmount = ref("");
const conteoNota = ref("");
const formError = ref("");

const TIPO_LABEL = {
  venta: "Venta",
  restock: "Reabastecimiento",
  ajuste_conteo: "Conteo físico",
};

function formatDate(iso) {
  return new Date(iso).toLocaleString("es-PE", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

async function toggleExpanded(item) {
  if (expandedItemId.value === item.id) {
    expandedItemId.value = null;
    return;
  }
  expandedItemId.value = item.id;
  restockAmount.value = "";
  restockNota.value = "";
  conteoAmount.value = "";
  conteoNota.value = "";
  formError.value = "";
  movementsByItem.value[item.id] = await fetchMovements(item.id);
}

async function submitRestock(item) {
  const cantidad = Number(restockAmount.value);
  if (!cantidad || cantidad <= 0) return;
  formError.value = "";
  const { error } = await restock(item.id, cantidad, restockNota.value.trim() || null);
  if (error) {
    formError.value = "No se pudo registrar el reabastecimiento.";
    return;
  }
  restockAmount.value = "";
  restockNota.value = "";
  movementsByItem.value[item.id] = await fetchMovements(item.id);
}

async function submitConteo(item) {
  if (conteoAmount.value === "") return;
  const cantidad = Number(conteoAmount.value);
  formError.value = "";
  const { error } = await reconcile(item.id, cantidad, conteoNota.value.trim() || null);
  if (error) {
    formError.value = "No se pudo registrar el conteo.";
    return;
  }
  conteoAmount.value = "";
  conteoNota.value = "";
  movementsByItem.value[item.id] = await fetchMovements(item.id);
}
</script>

<template>
  <div class="inventory-view">
    <LoadingSpinner v-if="loading" label="Cargando inventario..." />

    <p v-else-if="Object.keys(groupedByCategory).length === 0" class="inventory-view__empty">
      Todavía no activaste inventario en ningún producto. Actívalo desde la pestaña "Carta".
    </p>

    <section v-for="(dishes, categoria) in groupedByCategory" :key="categoria" class="inventory-view__group">
      <h3 class="inventory-view__category">{{ categoria }}</h3>
      <ul class="inventory-view__list">
        <li v-for="item in dishes" :key="item.id" class="inventory-view__item">
          <div class="inventory-view__row">
            <span class="inventory-view__name">{{ item.nombre }}</span>
            <span
              class="inventory-view__qty"
              :class="{ 'inventory-view__qty--negative': item.cantidad_actual <= 0 }"
            >
              {{ item.cantidad_actual }}
            </span>
            <button type="button" class="inventory-view__toggle" @click="toggleExpanded(item)">
              {{ expandedItemId === item.id ? "Cerrar" : "Gestionar" }}
            </button>
          </div>

          <div v-if="expandedItemId === item.id" class="inventory-view__panel">
            <div class="inventory-view__forms">
              <form class="inventory-view__form" @submit.prevent="submitRestock(item)">
                <label class="inventory-view__form-label">Reabastecer (unidades que entraron)</label>
                <div class="inventory-view__form-row">
                  <input v-model="restockAmount" type="number" step="1" min="1" placeholder="Cantidad" />
                  <input v-model="restockNota" type="text" placeholder="Nota (opcional)" />
                  <button type="submit">Registrar</button>
                </div>
              </form>

              <form class="inventory-view__form" @submit.prevent="submitConteo(item)">
                <label class="inventory-view__form-label">Conteo físico (cuánto hay ahora)</label>
                <div class="inventory-view__form-row">
                  <input v-model="conteoAmount" type="number" step="1" placeholder="Conteo real" />
                  <input v-model="conteoNota" type="text" placeholder="Nota (opcional)" />
                  <button type="submit">Registrar</button>
                </div>
              </form>
            </div>

            <p v-if="formError" class="inventory-view__error">{{ formError }}</p>

            <div class="inventory-view__history">
              <h4 class="inventory-view__history-title">Historial</h4>
              <p v-if="!movementsByItem[item.id]?.length" class="inventory-view__empty-history">
                Sin movimientos todavía.
              </p>
              <div v-else class="inventory-view__history-scroll">
                <table class="inventory-view__history-table">
                  <thead>
                    <tr>
                      <th>Fecha</th>
                      <th>Tipo</th>
                      <th>Diferencia</th>
                      <th>Quedó en</th>
                      <th>Nota</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="mov in movementsByItem[item.id]" :key="mov.id">
                      <td>{{ formatDate(mov.created_at) }}</td>
                      <td>{{ TIPO_LABEL[mov.tipo] || mov.tipo }}</td>
                      <td :class="{ 'inventory-view__delta--negative': mov.delta < 0 }">
                        {{ mov.delta > 0 ? "+" : "" }}{{ mov.delta }}
                      </td>
                      <td>{{ mov.cantidad_resultante }}</td>
                      <td>{{ mov.nota || "—" }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </li>
      </ul>
    </section>
  </div>
</template>

<style scoped>
.inventory-view__empty {
  text-align: center;
  color: var(--color-muted);
  padding: 2rem 0;
}

.inventory-view__group {
  margin-bottom: 1.5rem;
}

.inventory-view__category {
  font-size: 0.85rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  color: var(--color-muted);
  margin-bottom: 0.5rem;
}

.inventory-view__list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.inventory-view__item {
  border-radius: 0.75rem;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  overflow: hidden;
}

.inventory-view__row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 0.9rem;
}

.inventory-view__name {
  flex: 1;
  min-width: 0;
  font-weight: 700;
  font-size: 0.9rem;
  color: var(--color-text);
}

.inventory-view__qty {
  flex-shrink: 0;
  font-weight: 800;
  font-size: 1.05rem;
  font-variant-numeric: tabular-nums;
  color: var(--color-text);
  min-width: 2.5rem;
  text-align: right;
}

.inventory-view__qty--negative {
  color: var(--color-nuevo);
}

.inventory-view__toggle {
  flex-shrink: 0;
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--color-primary);
  white-space: nowrap;
  padding: 0.35rem 0.6rem;
  border-radius: 9999px;
  border: 1px solid var(--color-primary);
}

.inventory-view__panel {
  padding: 0.75rem 0.9rem 1rem;
  border-top: 1px solid var(--color-border);
  background: var(--color-bg);
}

.inventory-view__forms {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
}

.inventory-view__form-label {
  display: block;
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--color-muted);
  margin-bottom: 0.3rem;
}

.inventory-view__form-row {
  display: flex;
  gap: 0.5rem;
}

.inventory-view__form-row input {
  min-height: 2.5rem;
  padding: 0 0.6rem;
  border-radius: 0.5rem;
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  color: var(--color-text);
  font-size: 16px;
  flex: 1;
  min-width: 0;
}

.inventory-view__form-row input[type="number"] {
  flex: 0 0 6rem;
}

.inventory-view__form-row button {
  flex-shrink: 0;
  min-height: 2.5rem;
  padding: 0 0.9rem;
  border-radius: 0.5rem;
  background: var(--color-primary);
  color: #fff;
  font-weight: 700;
  font-size: 0.85rem;
}

.inventory-view__error {
  color: var(--color-nuevo);
  font-size: 0.85rem;
  margin-bottom: 0.75rem;
}

.inventory-view__history-title {
  font-size: 0.8rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  color: var(--color-muted);
  margin-bottom: 0.5rem;
}

.inventory-view__empty-history {
  font-size: 0.85rem;
  color: var(--color-muted);
}

.inventory-view__history-scroll {
  overflow-x: auto;
}

.inventory-view__history-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.8rem;
}

.inventory-view__history-table thead {
  background: #f9fafb;
}

.inventory-view__history-table th,
.inventory-view__history-table td {
  text-align: left;
  padding: 0.45rem 0.6rem;
  white-space: nowrap;
  border-bottom: 1px solid var(--color-border);
  color: var(--color-text);
}

.inventory-view__history-table th {
  font-weight: 700;
  color: var(--color-muted);
}

.inventory-view__delta--negative {
  color: var(--color-nuevo);
  font-weight: 700;
}
</style>
