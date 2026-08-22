<script setup>
import { ref } from "vue";
import { useTableRequest } from "@/pedidos/composables/useTableRequest";
import { useLanguage } from "@/pedidos/composables/useLanguage";
import BillRequestModal from "./BillRequestModal.vue";

const props = defineProps({
  tableId: { type: Number, required: true },
  orderTotal: { type: Number, default: 0 },
});

const { toast, sendRequest } = useTableRequest(props.tableId);
const { t } = useLanguage();
const billModalOpen = ref(false);

function confirmBillRequest(extra) {
  sendRequest("cuenta", extra);
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

    <div v-if="toast" class="pedidos-quick-actions__toast">{{ toast }}</div>

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
}

.pedidos-quick-actions__btn:active {
  transform: scale(0.97);
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
</style>
