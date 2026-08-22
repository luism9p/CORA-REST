<script setup>
import { ref, computed, watch } from "vue";
import { formatCurrency } from "@/pedidos/utils/format";
import { useLanguage } from "@/pedidos/composables/useLanguage";
import { useDragSheet } from "@/pedidos/composables/useDragSheet";

const props = defineProps({
  open: { type: Boolean, default: false },
  total: { type: Number, default: 0 },
});
const emit = defineEmits(["close", "confirm"]);

const { t } = useLanguage();
const { onPointerDown, onPointerMove, onPointerUp, dragStyle } = useDragSheet({
  onDismiss: () => emit("close"),
});

const TIP_OPTIONS = [0, 0.1, 0.15];

const personas = ref(1);
const tipPercent = ref(0); // null cuando el usuario elige "personalizado"
const customTip = ref("");

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      personas.value = 1;
      tipPercent.value = 0;
      customTip.value = "";
    }
  }
);

const tipAmount = computed(() => {
  if (tipPercent.value === null) return Number(customTip.value) || 0;
  return props.total * tipPercent.value;
});

const totalWithTip = computed(() => props.total + tipAmount.value);
const perPerson = computed(() => totalWithTip.value / Math.max(1, personas.value));

function selectTip(pct) {
  tipPercent.value = pct;
  customTip.value = "";
}

function selectCustomTip() {
  tipPercent.value = null;
}

function confirm() {
  emit("confirm", {
    personas: personas.value,
    propina: Number(tipAmount.value.toFixed(2)),
    total_a_cobrar: Number(totalWithTip.value.toFixed(2)),
  });
}
</script>

<template>
  <div
    class="pedidos-bill-modal"
    :class="{ 'pedidos-bill-modal--open': open }"
    role="dialog"
    aria-modal="true"
    :aria-label="t('billTitle')"
    @click.self="$emit('close')"
  >
    <div class="pedidos-bill-modal__box" :style="dragStyle">
      <div
        class="pedidos-bill-modal__handle-hitbox"
        @pointerdown="onPointerDown"
        @pointermove="onPointerMove"
        @pointerup="onPointerUp"
        @pointercancel="onPointerUp"
      >
        <div class="pedidos-bill-modal__handle"></div>
      </div>

      <div class="pedidos-bill-modal__header">
        <h2>{{ t("billTitle") }}</h2>
        <button type="button" class="pedidos-bill-modal__close" aria-label="Cerrar" @click="$emit('close')">✕</button>
      </div>

      <div class="pedidos-bill-modal__row">
        <span>{{ t("billOrderTotal") }}</span>
        <span>{{ formatCurrency(total) }}</span>
      </div>

      <div class="pedidos-bill-modal__section">
        <span class="pedidos-bill-modal__label">{{ t("billTip") }}</span>
        <div class="pedidos-bill-modal__tip-options">
          <button
            v-for="pct in TIP_OPTIONS"
            :key="pct"
            type="button"
            class="pedidos-bill-modal__tip-btn"
            :class="{ 'pedidos-bill-modal__tip-btn--active': tipPercent === pct }"
            @click="selectTip(pct)"
          >
            {{ pct === 0 ? t("billNoTip") : `${pct * 100}%` }}
          </button>
          <button
            type="button"
            class="pedidos-bill-modal__tip-btn"
            :class="{ 'pedidos-bill-modal__tip-btn--active': tipPercent === null }"
            @click="selectCustomTip"
          >
            {{ t("billCustomTip") }}
          </button>
        </div>
        <input
          v-if="tipPercent === null"
          v-model="customTip"
          type="number"
          min="0"
          step="0.5"
          :placeholder="t('billCustomTipPlaceholder')"
          class="pedidos-bill-modal__custom-tip"
        />
      </div>

      <div class="pedidos-bill-modal__section">
        <span class="pedidos-bill-modal__label">{{ t("billSplit") }}</span>
        <div class="pedidos-stepper">
          <button type="button" class="pedidos-stepper__btn" aria-label="Menos personas" @click="personas = Math.max(1, personas - 1)">−</button>
          <span class="pedidos-stepper__count">{{ personas }} {{ personas === 1 ? t("billPerson") : t("billPeople") }}</span>
          <button type="button" class="pedidos-stepper__btn" aria-label="Más personas" @click="personas++">+</button>
        </div>
      </div>

      <div class="pedidos-bill-modal__summary">
        <div class="pedidos-bill-modal__row">
          <span>{{ t("billTip") }}</span>
          <span>{{ formatCurrency(tipAmount) }}</span>
        </div>
        <div class="pedidos-bill-modal__row pedidos-bill-modal__row--total">
          <span>{{ t("billTotalWithTip") }}</span>
          <span>{{ formatCurrency(totalWithTip) }}</span>
        </div>
        <div v-if="personas > 1" class="pedidos-bill-modal__row pedidos-bill-modal__row--per-person">
          <span>{{ t("billPerPerson", personas) }}</span>
          <span>{{ formatCurrency(perPerson) }}</span>
        </div>
      </div>

      <button type="button" class="pedidos-bill-modal__confirm" @click="confirm">
        {{ t("billConfirm") }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.pedidos-bill-modal {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(3px);
  -webkit-backdrop-filter: blur(3px);
  opacity: 0;
  pointer-events: none;
  transition: opacity 250ms var(--ease-out);
}

.pedidos-bill-modal--open {
  opacity: 1;
  pointer-events: auto;
}

.pedidos-bill-modal__box {
  width: 100%;
  max-width: 32rem;
  max-height: 85vh;
  overflow-y: auto;
  background: var(--color-surface);
  color: var(--color-text);
  border-radius: 1.25rem 1.25rem 0 0;
  padding: 0.75rem 1.25rem 1.5rem;
  transform: translateY(100%);
  transition: transform 400ms var(--ease-sheet);
}

.pedidos-bill-modal--open .pedidos-bill-modal__box {
  transform: translateY(0);
}

.pedidos-bill-modal__handle-hitbox {
  display: flex;
  justify-content: center;
  padding: 0.6rem 0 0.85rem;
  touch-action: none;
  cursor: grab;
}

.pedidos-bill-modal__handle-hitbox:active {
  cursor: grabbing;
}

.pedidos-bill-modal__handle {
  width: 2.5rem;
  height: 0.35rem;
  border-radius: 9999px;
  background: var(--color-border);
}

.pedidos-bill-modal__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.75rem;
}

.pedidos-bill-modal__header h2 {
  font-size: 1.2rem;
  font-weight: 800;
  letter-spacing: -0.01em;
}

.pedidos-bill-modal__close {
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 9999px;
  background: var(--color-bg);
  flex-shrink: 0;
  transition: transform 400ms var(--ease-spring);
}

.pedidos-bill-modal__close:active {
  transform: scale(0.9);
}

.pedidos-bill-modal__row {
  display: flex;
  justify-content: space-between;
  padding: 0.4rem 0;
  font-weight: 600;
}

.pedidos-bill-modal__section {
  padding: 0.75rem 0;
  border-top: 1px solid var(--color-border);
}

.pedidos-bill-modal__label {
  display: block;
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--color-muted);
  margin-bottom: 0.5rem;
}

.pedidos-bill-modal__tip-options {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.pedidos-bill-modal__tip-btn {
  min-height: 2.5rem;
  padding: 0 0.9rem;
  border-radius: 9999px;
  border: 1px solid var(--color-border);
  background: var(--color-bg);
  color: var(--color-text);
  font-weight: 700;
  font-size: 0.85rem;
  transition: transform 400ms var(--ease-spring), background-color 150ms var(--ease-out), border-color 150ms var(--ease-out), color 150ms var(--ease-out);
}

.pedidos-bill-modal__tip-btn--active {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: #fff;
}

.pedidos-bill-modal__tip-btn:active {
  transform: scale(0.94);
}

.pedidos-bill-modal__custom-tip {
  margin-top: 0.6rem;
  width: 100%;
  min-height: 2.5rem;
  padding: 0 0.75rem;
  border-radius: 0.5rem;
  border: 1px solid var(--color-border);
  background: var(--color-bg);
  color: var(--color-text);
  font-size: 16px;
}

.pedidos-stepper {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  border-radius: 9999px;
  background: var(--color-primary);
  color: #fff;
  padding: 0.3rem 0.75rem;
  width: fit-content;
}

.pedidos-stepper__btn {
  width: 1.75rem;
  height: 1.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.1rem;
  font-weight: 700;
  line-height: 1;
}

.pedidos-stepper__count {
  font-weight: 700;
  font-size: 0.85rem;
  white-space: nowrap;
}

.pedidos-bill-modal__summary {
  border-top: 1px solid var(--color-border);
  padding-top: 0.5rem;
}

.pedidos-bill-modal__row--total {
  font-weight: 800;
  font-size: 1.05rem;
}

.pedidos-bill-modal__row--per-person {
  color: var(--color-primary);
  font-weight: 800;
}

.pedidos-bill-modal__confirm {
  width: 100%;
  min-height: 3rem;
  border-radius: 9999px;
  background: var(--color-primary);
  color: #fff;
  font-weight: 700;
  font-size: 1rem;
  margin-top: 1rem;
  transition: transform 400ms var(--ease-spring), background-color 150ms var(--ease-out);
}

.pedidos-bill-modal__confirm:active {
  background: var(--color-primary-dark);
  transform: scale(0.96);
}
</style>
