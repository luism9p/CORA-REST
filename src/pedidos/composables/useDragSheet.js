// src/pedidos/composables/useDragSheet.js
// Gesto de arrastre tipo hoja modal de iOS: mientras el dedo se mueve, la
// hoja lo sigue 1:1 sin transición; al soltar, si se arrastró lo suficiente
// (por distancia o por velocidad, como un "flick" rápido) se cierra, y si no,
// vuelve a su lugar con la misma curva de resorte que ya usa la apertura
// (basta con no aplicar estilo inline: la clase CSS existente hace el resto).
import { ref, computed } from "vue";

export function useDragSheet({ onDismiss, dismissDistance = 120, dismissVelocity = 0.6 }) {
  const dragOffset = ref(0);
  const dragging = ref(false);
  let startY = 0;
  let startTime = 0;

  function onPointerDown(event) {
    dragging.value = true;
    startY = event.clientY;
    startTime = performance.now();
    event.currentTarget.setPointerCapture?.(event.pointerId);
  }

  function onPointerMove(event) {
    if (!dragging.value) return;
    dragOffset.value = Math.max(0, event.clientY - startY);
  }

  function onPointerUp() {
    if (!dragging.value) return;
    dragging.value = false;
    const elapsed = Math.max(1, performance.now() - startTime);
    const velocity = dragOffset.value / elapsed; // px/ms
    const shouldDismiss = dragOffset.value > dismissDistance || velocity > dismissVelocity;
    dragOffset.value = 0;
    if (shouldDismiss) onDismiss();
  }

  const dragStyle = computed(() =>
    dragging.value ? { transform: `translateY(${dragOffset.value}px)`, transition: "none" } : {}
  );

  return { dragging, onPointerDown, onPointerMove, onPointerUp, dragStyle };
}
