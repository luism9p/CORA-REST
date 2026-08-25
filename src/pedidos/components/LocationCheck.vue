<script setup>
import { ref, computed } from "vue";
import { useLanguage } from "@/pedidos/composables/useLanguage";

// Emite las coordenadas crudas — quien orquesta el flujo de /mesa/N (ver
// MesaApp.vue + useCheckIn.js) es quien llama a la Edge Function check-in
// con ellas. Este componente no sabe nada de fetch/localStorage: solo pide
// el GPS y refleja, vía props, cómo va esa llamada del padre.
const props = defineProps({
  // true mientras el padre está validando las coordenadas contra el
  // backend — el botón se queda en "Buscando..." aunque el GPS ya haya
  // respondido, porque para el cliente sigue siendo la misma espera.
  checking: { type: Boolean, default: false },
  // Mensaje de la Edge Function ("Estás fuera de la zona...", "El
  // restaurante se encuentra cerrado.") cuando el check-in fue rechazado.
  serverError: { type: String, default: "" },
});
const emit = defineEmits(["located"]);

const { t } = useLanguage();

const geoStatus = ref("idle"); // 'idle' | 'loading' | 'error'
const geoErrorMessage = ref("");

const isBusy = computed(() => geoStatus.value === "loading" || props.checking);
// El error del backend tiene prioridad: si el padre acaba de rechazar un
// intento, eso es lo último que pasó, no el permiso de GPS de antes.
const displayedError = computed(
  () => props.serverError || (geoStatus.value === "error" ? geoErrorMessage.value : "")
);

function requestLocation() {
  if (!navigator.geolocation) {
    geoStatus.value = "error";
    geoErrorMessage.value = t("locationUnsupported");
    return;
  }

  geoStatus.value = "loading";
  geoErrorMessage.value = "";

  navigator.geolocation.getCurrentPosition(
    (position) => {
      const { latitude, longitude } = position.coords;
      console.log("[LocationCheck] Ubicación capturada:", latitude, longitude);
      // A partir de acá, "Buscando..." lo controla `checking` (prop del
      // padre) mientras dura la llamada al backend.
      geoStatus.value = "idle";
      emit("located", { latitude, longitude });
    },
    () => {
      geoStatus.value = "error";
      geoErrorMessage.value = t("locationDenied");
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
        :disabled="isBusy"
        @click="requestLocation"
      >
        {{ isBusy ? t("locationSearching") : t("locationAllow") }}
      </button>

      <p v-if="displayedError" class="pedidos-location__error" role="alert">{{ displayedError }}</p>
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
