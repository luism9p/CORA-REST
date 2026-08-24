<script setup>
import { ref } from "vue";
import { useTableRequest } from "@/pedidos/composables/useTableRequest";
import { useLanguage } from "@/pedidos/composables/useLanguage";
import { supabase } from "@/pedidos/lib/supabaseClient";
import BillRequestModal from "./BillRequestModal.vue";

const props = defineProps({
  tableId: { type: Number, required: true },
  orderId: { type: String, default: null },
  orderTotal: { type: Number, default: 0 },
});

const { toast, sendRequest } = useTableRequest(props.tableId);
const { t } = useLanguage();
const billModalOpen = ref(false);

async function confirmBillRequest(extra) {
  sendRequest("cuenta", extra);
  // La propina queda en el pedido (no solo en la notificación al mesero),
  // que es lo que después alimenta el reporte de cierre de caja. El query
  // builder de Supabase es "thenable" perezoso — sin awaitarlo, la petición
  // nunca sale.
  if (props.orderId) {
    await supabase.from("orders").update({ propina: extra.propina }).eq("id", props.orderId);
  }
  billModalOpen.value = false;
}
</script>

<template>
  <div class="pedidos-quick-actions">
    <button type="button" class="pedidos-quick-actions__btn" @click="sendRequest('mesero')">
      {{ t("callWaiter") }}
    </button>
    <button type="button" class="pedidos-quick-actions__btn" @click="billModalOpen = true">
      {{ t("requestBill") }}
    </button>

    <Transition name="pedidos-toast">
      <div v-if="toast" class="pedidos-quick-actions__toast">{{ toast }}</div>
    </Transition>

    <BillRequestModal
      :open="billModalOpen"
      :total="orderTotal"
      @close="billModalOpen = false"
      @confirm="confirmBillRequest"
    />
  </div>
</template>

<style scoped>
.pedidos-quick-actions {
  position: fixed;
  bottom: 1rem;
  left: 1rem;
  z-index: 40;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.pedidos-quick-actions__btn {
  min-height: 2.75rem;
  padding: 0 1rem;
  border-radius: 9999px;
  background: var(--color-surface);
  color: var(--color-text);
  border: 1px solid var(--color-border);
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.12);
  font-size: 0.85rem;
  font-weight: 700;
  text-align: left;
  transition: transform 400ms var(--ease-spring);
}

.pedidos-quick-actions__btn:active {
  transform: scale(0.94);
}

.pedidos-quick-actions__toast {
  position: fixed;
  bottom: 1rem;
  left: 50%;
  transform: translateX(-50%);
  background: var(--color-text);
  color: var(--color-bg);
  padding: 0.6rem 1.1rem;
  border-radius: 9999px;
  font-size: 0.85rem;
  font-weight: 600;
  white-space: nowrap;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.pedidos-toast-enter-active {
  transition: opacity 400ms var(--ease-spring), transform 400ms var(--ease-spring);
}
.pedidos-toast-leave-active {
  transition: opacity 200ms var(--ease-out), transform 200ms var(--ease-out);
}
.pedidos-toast-enter-from,
.pedidos-toast-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(0.5rem) scale(0.9);
}
</style>
