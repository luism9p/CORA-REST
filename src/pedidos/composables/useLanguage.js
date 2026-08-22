// src/pedidos/composables/useLanguage.js
// Idioma de la vista del cliente (ES/EN). Singleton igual que useCart/useAuth:
// un solo estado por carga de página, compartido por todos los componentes.
// El panel admin nunca importa esto — se queda siempre en español.
import { ref, computed } from "vue";
import { STRINGS } from "@/pedidos/i18n/strings";

const language = ref("es");

function toggleLanguage() {
  language.value = language.value === "es" ? "en" : "es";
}

export function useLanguage() {
  function t(key, ...args) {
    const entry = STRINGS[language.value][key] ?? STRINGS.es[key] ?? key;
    return typeof entry === "function" ? entry(...args) : entry;
  }
  return {
    language: computed(() => language.value),
    toggleLanguage,
    t,
  };
}
