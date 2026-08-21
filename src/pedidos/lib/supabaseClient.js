// src/pedidos/lib/supabaseClient.js
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    "[pedidos] Faltan PUBLIC_SUPABASE_URL / PUBLIC_SUPABASE_ANON_KEY en las variables de entorno."
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
