// src/pedidos/utils/session.js
// Recuerda la sesión de check-in (geolocalización validada por la Edge
// Function check-in) de cada mesa en localStorage, para no pedirle el GPS
// al cliente de nuevo mientras la sesión siga vigente. Mismo patrón que
// orderStorage.js.

const PREFIX = "cora:session:mesa:";

// Mismo plazo que usa la Edge Function para calcular expires_at en
// table_sessions — la función no lo devuelve en la respuesta, así que este
// es el valor que el frontend usa para saber hasta cuándo confiar en la
// sesión guardada.
export const SESSION_DURATION_MS = 3 * 60 * 60 * 1000; // 3 horas

function keyFor(tableNumber) {
  return `${PREFIX}${tableNumber}`;
}

// { token, expiresAt, tableId } | null. Cualquier forma inesperada (JSON
// corrupto, localStorage editado a mano, versión vieja del formato) se
// trata como "no hay sesión" en vez de romper la carga de la página.
export function getStoredSession(tableNumber) {
  try {
    const raw = localStorage.getItem(keyFor(tableNumber));
    if (!raw) return null;
    const session = JSON.parse(raw);
    if (!session || typeof session.token !== "string" || typeof session.expiresAt !== "number") {
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

export function setStoredSession(tableNumber, { token, expiresAt, tableId }) {
  try {
    localStorage.setItem(keyFor(tableNumber), JSON.stringify({ token, expiresAt, tableId }));
  } catch {
    // localStorage no disponible (modo privado, cuota llena, etc.)
  }
}

export function clearStoredSession(tableNumber) {
  try {
    localStorage.removeItem(keyFor(tableNumber));
  } catch {
    // no-op
  }
}

export function isSessionValid(session) {
  return Boolean(session) && Date.now() < session.expiresAt;
}
