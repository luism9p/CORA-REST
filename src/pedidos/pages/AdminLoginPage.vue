<script setup>
import { ref, watch, onMounted } from "vue";
import { useAuth } from "@/pedidos/composables/useAuth";

const email = ref("");
const password = ref("");
const error = ref("");
const submitting = ref(false);

const { session, loading, signIn } = useAuth();

// A dónde manda cada cuenta: la del mesero tiene { role: "mesero" } en su
// user_metadata (se configura al crear el usuario desde el dashboard de
// Supabase, no algo que esta app pueda hacer) y va a la vista recortada;
// cualquier otra cuenta (la del dueño/admin, sin ese metadata) va al panel
// completo, igual que siempre.
function destinationFor(currentSession) {
  return currentSession?.user?.user_metadata?.role === "mesero" ? "/mesero" : "/admin";
}

// Si ya hay sesión (o llega mientras está en esta página), va directo a su
// panel. Dentro de onMounted a propósito: este componente también se
// renderiza en el servidor (client:load), donde `window` no existe.
onMounted(() => {
  watch(
    session,
    (s) => {
      if (s) window.location.href = destinationFor(s);
    },
    { immediate: true }
  );
});

async function handleSubmit() {
  submitting.value = true;
  error.value = "";
  const { error: signInError } = await signIn(email.value, password.value);
  submitting.value = false;
  if (signInError) {
    error.value = "Correo o contraseña incorrectos.";
    return;
  }
  // No se redirige acá mismo: signIn() dispara el evento de Supabase Auth
  // que actualiza `session` de forma asíncrona (onAuthStateChange), así
  // que leer session.value en esta misma línea puede seguir siendo null
  // por una carrera. El watch(session, ...) de arriba es quien navega en
  // cuanto la sesión realmente llega, ya con el rol correcto disponible.
}
</script>

<template>
  <div class="admin-root admin-login">
    <form class="admin-login__form" @submit.prevent="handleSubmit">
      <h1 class="admin-login__title">Panel CORA</h1>

      <label class="admin-login__field">
        <span>Correo</span>
        <input v-model="email" type="email" required autocomplete="username" />
      </label>

      <label class="admin-login__field">
        <span>Contraseña</span>
        <input v-model="password" type="password" required autocomplete="current-password" />
      </label>

      <p v-if="error" class="admin-login__error">{{ error }}</p>

      <button type="submit" class="admin-login__submit" :disabled="submitting || loading">
        {{ submitting ? "Ingresando..." : "Ingresar" }}
      </button>
    </form>
  </div>
</template>

<style>
@import "../styles/pedidos.css";
</style>

<style scoped>
.admin-login {
  min-height: 100svh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
}

.admin-login__form {
  width: 100%;
  max-width: 22rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 2rem;
  border-radius: 1.25rem;
  border: 1px solid var(--color-border);
  background: var(--color-surface);
}

.admin-login__title {
  font-size: 1.4rem;
  font-weight: 800;
  text-align: center;
  margin-bottom: 0.5rem;
}

.admin-login__field {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--color-muted);
}

.admin-login__field input {
  min-height: 2.75rem;
  padding: 0 0.75rem;
  border-radius: 0.5rem;
  border: 1px solid var(--color-border);
  background: var(--color-bg);
  color: var(--color-text);
  font-size: 16px;
  font-weight: 400;
}

.admin-login__error {
  color: var(--color-nuevo);
  font-size: 0.85rem;
  font-weight: 600;
}

.admin-login__submit {
  min-height: 2.9rem;
  border-radius: 9999px;
  background: var(--color-primary);
  color: #fff;
  font-weight: 700;
}

.admin-login__submit:disabled {
  opacity: 0.6;
}
</style>
