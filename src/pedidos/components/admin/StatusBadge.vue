<script setup>
import { STATUS_LABEL, STATUS_COLOR } from "@/pedidos/utils/orderStatus";

defineProps({
  status: { type: String, required: true },
});
</script>

<template>
  <span class="admin-status-badge" :style="{ backgroundColor: STATUS_COLOR[status] }">
    {{ STATUS_LABEL[status] }}
  </span>
</template>

<style scoped>
.admin-status-badge {
  display: inline-flex;
  align-items: center;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  color: #fff;
  font-weight: 700;
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}
</style>
