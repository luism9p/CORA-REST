// src/pedidos/composables/useTheme.js
// Dark mode SOLO para la vista de cliente (/mesa). No toca document.documentElement
// a propósito: si lo hiciera, el atributo se filtraría al <html> compartido y
// afectaría también al panel admin, que debe quedarse siempre en modo claro.
import { ref, watch } from "vue";

const STORAGE_KEY = "cora:theme";

function getInitialTheme() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "light" || stored === "dark") return stored;
  } catch {
    // localStorage no disponible
  }
  if (typeof matchMedia === "function" && matchMedia("(prefers-color-scheme: dark)").matches) {
    return "dark";
  }
  return "light";
}

export function useTheme() {
  const theme = ref(getInitialTheme());

  watch(theme, (value) => {
    try {
      localStorage.setItem(STORAGE_KEY, value);
    } catch {
      // no-op
    }
  });

  function toggleTheme() {
    theme.value = theme.value === "dark" ? "light" : "dark";
  }

  return { theme, toggleTheme };
}
