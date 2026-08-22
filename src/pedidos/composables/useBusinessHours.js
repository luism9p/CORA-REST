// src/pedidos/composables/useBusinessHours.js
// Restringe el menú de pedidos al horario real de atención. Reusa el mismo
// horario que ya se muestra en el sitio principal (src/data/menu.json →
// settings.opening_hours, el mismo que alimenta el Footer) para no tener
// dos calendarios que alguien pueda olvidar sincronizar el día que cambien
// el horario del restaurante.
import { ref, onMounted, onUnmounted } from "vue";
import siteData from "@/data/menu.json";

const TIMEZONE = "America/Lima";
const WEEKDAY_INDEX = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

// Map<día (0=domingo...6=sábado), { start: "11:30", end: "17:00" }>
// Un día sin entrada (ej. martes) significa cerrado ese día.
const schedule = new Map(
  (siteData.settings.opening_hours || []).map((oh) => [Number(oh.day), oh.time.time])
);

function toMinutes(hhmm) {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

// Hora de Lima explícita (no la del dispositivo): un turista con el celular
// en otro huso horario no debería ver un estado de horario equivocado.
function limaNow() {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: TIMEZONE,
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const parts = Object.fromEntries(fmt.formatToParts(new Date()).map((p) => [p.type, p.value]));
  return {
    weekday: WEEKDAY_INDEX[parts.weekday],
    minutes: parseInt(parts.hour, 10) * 60 + parseInt(parts.minute, 10),
  };
}

function computeIsOpen() {
  // Solo para desarrollo local: pon PUBLIC_FORCE_MENU_OPEN=true en tu .env
  // (nunca en Vercel) para probar el menú fuera de horario. Si no está
  // seteada, esta condición no aplica y se usa el horario real.
  if (import.meta.env.PUBLIC_FORCE_MENU_OPEN === "true") return true;

  const { weekday, minutes } = limaNow();
  const today = schedule.get(weekday);
  if (!today) return false; // día sin horario definido = cerrado
  return minutes >= toMinutes(today.start) && minutes < toMinutes(today.end);
}

export function useBusinessHours() {
  const isOpen = ref(computeIsOpen());
  let interval;

  onMounted(() => {
    // Revisa cada 30s: si alguien deja la pestaña abierta justo a la hora
    // de cierre, el estado se actualiza solo, sin necesitar un refresh.
    interval = setInterval(() => {
      isOpen.value = computeIsOpen();
    }, 30000);
  });

  onUnmounted(() => clearInterval(interval));

  return { isOpen };
}
