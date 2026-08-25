<script setup>
import { ref } from "vue";
import { useLanguage } from "@/pedidos/composables/useLanguage";

// Emite las coordenadas crudas para quien integre este componente en el
// flujo de /mesa/N — a propósito no llama a ningún backend acá todavía
// (ver punto 6 del pedido: primero confirmar con console.log que la
// extracción funciona, la validación del servidor es un paso aparte).
const emit = defineEmits(["located"]);

const { t } = useLanguage();

const status = ref("idle"); // 'idle' | 'loading' | 'error'
const errorMessage = ref("");

function requestLocation() {
  if (!navigator.geolocation) {
    status.value = "error";
    errorMessage.value = t("locationUnsupported");
    return;
  }

  status.value = "loading";
  errorMessage.value = "";

  navigator.geolocation.getCurrentPosition(
    (position) => {
      const { latitude, longitude } = position.coords;
      console.log("[LocationCheck] Ubicación capturada:", latitude, longitude);
      status.value = "idle";
      emit("located", { latitude, longitude });
    },
    () => {
      status.value = "error";
      errorMessage.value = t("locationDenied");
    }
  );
}
</script>

<template>
  <div class="pedidos-location">
    <div class="pedidos-location__box">
      <p class="pedidos-location__icon" aria-hidden="true">📍</p>
      <h2 class="pedidos-location__title">{{ t("locationTitle") }}</h2>
      <p class="pedidos-location__text">{{ t("locationText") }}</p>

      <button
        type="button"
        class="pedidos-location__btn"
        :disabled="status === 'loading'"
        @click="requestLocation"
      >
        {{ status === "loading" ? t("locationSearching") : t("locationAllow") }}
      </button>

      <p v-if="status === 'error'" class="pedidos-location__error">{{ errorMessage }}</p>
    </div>
  </div>
</template>

<style scoped>
.pedidos-location {
  position: fixed;
  inset: 0;
  z-index: 500;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-bg);
  padding: 1.5rem;
}

.pedidos-location__box {
  max-width: 24rem;
  width: 100%;
  text-align: center;
}

.pedidos-location__icon {
  font-size: 3.5rem;
  margin-bottom: 1rem;
}

.pedidos-location__title {
  font-size: 1.4rem;
  font-weight: 800;
  margin-bottom: 0.75rem;
}

.pedidos-location__text {
  color: var(--color-muted);
  line-height: 1.5;
  margin-bottom: 2rem;
}

.pedidos-location__btn {
  width: 100%;
  min-height: 3.5rem;
  border-radius: 9999px;
  background: var(--color-primary);
  color: #fff;
  font-weight: 700;
  font-size: 1.05rem;
  transition: transform 400ms var(--ease-spring), background-color 150ms var(--ease-out), opacity 150ms;
}

.pedidos-location__btn:not(:disabled):active {
  background: var(--color-primary-dark);
  transform: scale(0.96);
}

.pedidos-location__btn:disabled {
  opacity: 0.7;
}

.pedidos-location__error {
  margin-top: 1rem;
  color: var(--color-nuevo);
  font-size: 0.9rem;
  line-height: 1.4;
}
</style>
