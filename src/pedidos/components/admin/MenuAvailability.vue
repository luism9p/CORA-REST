<script setup>
import { ref } from "vue";
import { useMenuAdmin } from "@/pedidos/composables/useMenuAdmin";
import { formatCurrency } from "@/pedidos/utils/format";
import LoadingSpinner from "@/pedidos/components/common/LoadingSpinner.vue";

const { groupedByCategory, loading, setDisponible, addModifier, removeModifier } = useMenuAdmin();

const expandedItemId = ref(null);
const newModifierName = ref("");
const newModifierPrice = ref("");

function toggleExpanded(item) {
  expandedItemId.value = expandedItemId.value === item.id ? null : item.id;
  newModifierName.value = "";
  newModifierPrice.value = "";
}

async function submitModifier(item) {
  const nombre = newModifierName.value.trim();
  if (!nombre) return;
  const precioExtra = Number(newModifierPrice.value) || 0;
  await addModifier(item, nombre, precioExtra);
  newModifierName.value = "";
  newModifierPrice.value = "";
}
</script>

<template>
  <div class="menu-availability">
    <LoadingSpinner v-if="loading" label="Cargando la carta..." />

    <section v-for="(dishes, categoria) in groupedByCategory" :key="categoria" class="menu-availability__group">
      <h3 class="menu-availability__category">{{ categoria }}</h3>
      <ul class="menu-availability__list">
        <li v-for="item in dishes" :key="item.id" class="menu-availability__item">
          <div class="menu-availability__row">
            <div class="menu-availability__info">
              <span class="menu-availability__name" :class="{ 'menu-availability__name--off': !item.disponible }">
                {{ item.nombre }}
              </span>
              <span class="menu-availability__price">{{ formatCurrency(item.precio) }}</span>
            </div>
            <button type="button" class="menu-availability__modifiers-btn" @click="toggleExpanded(item)">
              Modificadores{{ item.modifiers.length ? ` (${item.modifiers.length})` : "" }}
            </button>
            <button
              type="button"
              class="menu-availability__switch"
              :class="{ 'menu-availability__switch--on': item.disponible }"
              role="switch"
              :aria-checked="item.disponible"
              :aria-label="`Disponibilidad de ${item.nombre}`"
              @click="setDisponible(item, !item.disponible)"
            >
              <span class="menu-availability__switch-knob" />
            </button>
          </div>

          <div v-if="expandedItemId === item.id" class="menu-availability__modifiers-panel">
            <ul v-if="item.modifiers.length" class="menu-availability__modifiers-list">
              <li v-for="mod in item.modifiers" :key="mod.id">
                <span>{{ mod.nombre }}<template v-if="Number(mod.precio_extra) > 0"> (+{{ formatCurrency(mod.precio_extra) }})</template></span>
                <button type="button" class="menu-availability__modifier-remove" @click="removeModifier(item, mod.id)">Quitar</button>
              </li>
            </ul>
            <form class="menu-availability__modifier-form" @submit.prevent="submitModifier(item)">
              <input
                v-model="newModifierName"
                type="text"
                placeholder="Ej. Extra queso parmesano"
                class="menu-availability__modifier-input"
              />
              <input
                v-model="newModifierPrice"
                type="number"
                min="0"
                step="0.5"
                placeholder="S/ extra"
                class="menu-availability__modifier-input menu-availability__modifier-input--price"
              />
              <button type="submit" class="menu-availability__modifier-add">Añadir</button>
            </form>
          </div>
        </li>
      </ul>
    </section>
  </div>
</template>

<style scoped>
.menu-availability__group {
  margin-bottom: 1.5rem;
}

.menu-availability__category {
  font-size: 0.85rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  color: var(--color-muted);
  margin-bottom: 0.5rem;
}

.menu-availability__list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.menu-availability__item {
  border-radius: 0.75rem;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  overflow: hidden;
}

.menu-availability__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.6rem;
  padding: 0.75rem 0.9rem;
}

.menu-availability__modifiers-btn {
  flex-shrink: 0;
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--color-primary);
  white-space: nowrap;
  padding: 0.35rem 0.6rem;
  border-radius: 9999px;
  border: 1px solid var(--color-primary);
}

.menu-availability__modifiers-panel {
  padding: 0.75rem 0.9rem 1rem;
  border-top: 1px solid var(--color-border);
  background: var(--color-bg);
}

.menu-availability__modifiers-list {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  margin-bottom: 0.75rem;
}

.menu-availability__modifiers-list li {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 0.85rem;
  color: var(--color-text);
}

.menu-availability__modifier-remove {
  font-size: 0.75rem;
  color: var(--color-muted);
  text-decoration: underline;
}

.menu-availability__modifier-form {
  display: flex;
  gap: 0.5rem;
}

.menu-availability__modifier-input {
  min-height: 2.5rem;
  padding: 0 0.6rem;
  border-radius: 0.5rem;
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  color: var(--color-text);
  font-size: 16px;
  flex: 1;
  min-width: 0;
}

.menu-availability__modifier-input--price {
  flex: 0 0 6rem;
}

.menu-availability__modifier-add {
  flex-shrink: 0;
  min-height: 2.5rem;
  padding: 0 0.9rem;
  border-radius: 0.5rem;
  background: var(--color-primary);
  color: #fff;
  font-weight: 700;
  font-size: 0.85rem;
}

.menu-availability__info {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  min-width: 0;
}

.menu-availability__name {
  font-weight: 700;
  font-size: 0.9rem;
  color: var(--color-text);
}

.menu-availability__name--off {
  color: var(--color-muted);
  text-decoration: line-through;
}

.menu-availability__price {
  font-size: 0.8rem;
  color: var(--color-muted);
}

.menu-availability__switch {
  flex-shrink: 0;
  width: 3rem;
  height: 1.75rem;
  border-radius: 9999px;
  background: var(--color-border);
  position: relative;
  transition: background-color 150ms;
}

.menu-availability__switch--on {
  background: var(--color-primary);
}

.menu-availability__switch-knob {
  position: absolute;
  top: 0.2rem;
  left: 0.2rem;
  width: 1.35rem;
  height: 1.35rem;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
  transition: transform 150ms;
}

.menu-availability__switch--on .menu-availability__switch-knob {
  transform: translateX(1.25rem);
}
</style>
