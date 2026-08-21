// src/pedidos/composables/useAuth.js
// Sesión de Supabase Auth como estado compartido a nivel de módulo: tanto
// AdminLoginPage como AdminDashboardPage llaman useAuth() y ven la misma
// sesión, con un solo listener registrado (no uno por componente).
import { ref } from "vue";
import { supabase } from "@/pedidos/lib/supabaseClient";

const session = ref(null);
const loading = ref(true);
let initialized = false;

function init() {
  if (initialized) return;
  initialized = true;

  supabase.auth.getSession().then(({ data }) => {
    session.value = data.session;
    loading.value = false;
  });

  supabase.auth.onAuthStateChange((_event, newSession) => {
    session.value = newSession;
    loading.value = false;
  });
}

export function useAuth() {
  init();

  async function signIn(email, password) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  }

  async function signOut() {
    await supabase.auth.signOut();
  }

  return { session, loading, signIn, signOut };
}
