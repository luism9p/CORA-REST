// supabase/functions/check-in/index.ts
// Valida en el servidor que quien escaneó el tag NFC de la mesa está
// físicamente en el restaurante antes de abrirle una sesión de pedidos. El
// frontend (LocationCheck.vue) ya captura las coordenadas del cliente, pero
// confiar en eso sin más sería trivial de falsear desde devtools — esta
// función es la que de verdad decide.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Conversión exacta de 4°27'10.4"S 81°16'43.3"W.
const STORE_LAT = -4.452889;
const STORE_LON = -81.278694;
const MAX_RADIUS_METERS = 100;

const SESSION_DURATION_MS = 3 * 60 * 60 * 1000; // 3 horas

// Mismo horario que src/data/menu.json → settings.opening_hours, el que ya
// usa useBusinessHours.js en el frontend: todos los días 11:30–17:00,
// martes cerrado. No hay forma de compartir ese JSON entre el build de
// Astro y esta función de Deno, así que si cambia el horario del
// restaurante hay que actualizar los dos lados.
const TIMEZONE = "America/Lima";
const SCHEDULE: Record<number, { start: string; end: string }> = {
  0: { start: "11:30", end: "17:00" }, // domingo
  1: { start: "11:30", end: "17:00" }, // lunes
  // 2 = martes: sin entrada, cerrado
  3: { start: "11:30", end: "17:00" },
  4: { start: "11:30", end: "17:00" },
  5: { start: "11:30", end: "17:00" },
  6: { start: "11:30", end: "17:00" },
};
const WEEKDAY_INDEX: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const EARTH_RADIUS_METERS = 6371000;
  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return EARTH_RADIUS_METERS * c;
}

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

// Hora de Lima explícita (no la del servidor de Deno, que corre en UTC): un
// pedido a las 11:00pm UTC es mediodía en Lima, no medianoche.
function isWithinBusinessHours(): boolean {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: TIMEZONE,
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const parts = Object.fromEntries(fmt.formatToParts(new Date()).map((p) => [p.type, p.value]));
  const weekday = WEEKDAY_INDEX[parts.weekday];
  const minutes = parseInt(parts.hour, 10) * 60 + parseInt(parts.minute, 10);

  const today = SCHEDULE[weekday];
  if (!today) return false; // día sin horario definido = cerrado
  return minutes >= toMinutes(today.start) && minutes < toMinutes(today.end);
}

function jsonResponse(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req: Request) => {
  // Preflight de CORS: el navegador lo manda solo (sin cuerpo) antes del
  // POST real porque la petición lleva headers custom (apikey/authorization),
  // y espera 200, no un error.
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Método no permitido." }, 405);
  }

  let payload: { table_id?: string | number; client_lat?: number; client_lon?: number };
  try {
    payload = await req.json();
  } catch {
    return jsonResponse({ error: "El cuerpo de la petición no es JSON válido." }, 400);
  }

  const { table_id, client_lat, client_lon } = payload;
  const tableId = typeof table_id === "string" ? Number(table_id) : table_id;

  if (
    typeof tableId !== "number" ||
    !Number.isInteger(tableId) ||
    typeof client_lat !== "number" ||
    typeof client_lon !== "number" ||
    Number.isNaN(client_lat) ||
    Number.isNaN(client_lon)
  ) {
    return jsonResponse(
      { error: "Faltan datos: se requiere table_id, client_lat y client_lon." },
      400
    );
  }

  const distance = calculateDistance(STORE_LAT, STORE_LON, client_lat, client_lon);
  if (distance > MAX_RADIUS_METERS) {
    return jsonResponse({ error: "Estás fuera de la zona de pedidos del restaurante." }, 403);
  }

  if (!isWithinBusinessHours()) {
    return jsonResponse({ error: "El restaurante se encuentra cerrado." }, 403);
  }

  const sessionToken = crypto.randomUUID();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + SESSION_DURATION_MS);

  // Service role: table_sessions no tiene ninguna policy pública (ver su
  // migración) porque escribirla directamente desde el cliente permitiría
  // fabricarse una sesión sin pasar por la validación de arriba. Supabase
  // inyecta esta key sola en runtime — nunca vive en el repo.
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  const { error: insertError } = await supabase.from("table_sessions").insert({
    session_token: sessionToken,
    table_id: tableId,
    created_at: now.toISOString(),
    expires_at: expiresAt.toISOString(),
  });

  if (insertError) {
    console.error("check-in: error al crear la sesión", insertError);
    return jsonResponse({ error: "No se pudo crear la sesión. Intenta de nuevo." }, 500);
  }

  return jsonResponse({ success: true, session_token: sessionToken, table_id: tableId }, 200);
});
