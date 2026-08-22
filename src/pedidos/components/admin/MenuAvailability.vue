<script setup>
import { useMenuAdmin } from "@/pedidos/composables/useMenuAdmin";
import { formatCurrency } from "@/pedidos/utils/format";
import LoadingSpinner from "@/pedidos/components/common/LoadingSpinner.vue";

const { groupedByCategory, loading, setDisponible } = useMenuAdmin();
</script>

<template>
  <div class="menu-availability">
    <LoadingSpinner v-if="loading" label="Cargando la carta..." />

    <section v-for="(dishes, categoria) in groupedByCategory" :key="categoria" class="menu-availability__group">
      <h3 class="menu-availability__category">{{ categoria }}</h3>
      <ul class="menu-availability__list">
        <li v-for="item in dishes" :key="item.id" class="menu-availability__row">
          <div class="menu-availability__info">
            <span class="menu-availability__name" :class="{ 'menu-availability__name--off': !item.disponible }">
              {{ item.nombre }}
            </span>
            <span class="menu-availability__price">{{ formatCurrency(item.precio) }}</span>
          </div>
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

.menu-availability__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.75rem 0.9rem;
  border-radius: 0.75rem;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
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
