// src/lib/scrollFade.js
// Botones de flecha en los extremos de una fila con scroll horizontal: se muestran
// solo cuando hay más contenido en esa dirección y, al tocarlos, desplazan la fila.

export function initScrollFade(containerId) {
  const container = document.getElementById(containerId);
  const wrapper = container?.parentElement;
  if (!container || !wrapper || container.dataset.scrollFadeInit === "true") return;
  container.dataset.scrollFadeInit = "true";

  const leftFade = wrapper.querySelector('[data-fade="left"]');
  const rightFade = wrapper.querySelector('[data-fade="right"]');
  if (!leftFade || !rightFade) return;

  const setFadeState = (el, visible) => {
    el.style.opacity = visible ? "1" : "0";
    el.style.pointerEvents = visible ? "auto" : "none";
  };

  const update = () => {
    const { scrollLeft, scrollWidth, clientWidth } = container;
    const maxScroll = scrollWidth - clientWidth;
    setFadeState(leftFade, scrollLeft > 4);
    setFadeState(rightFade, maxScroll > 4 && scrollLeft < maxScroll - 4);
  };

  const scrollByPage = (direction) => {
    container.scrollBy({ left: Math.round(container.clientWidth * 0.75) * direction, behavior: "smooth" });
    // El evento "scroll" cubre el arrastre táctil; este respaldo asegura que los
    // botones se actualicen también tras el scroll animado por clic.
    setTimeout(update, 450);
  };

  leftFade.addEventListener("click", () => scrollByPage(-1));
  rightFade.addEventListener("click", () => scrollByPage(1));

  update();
  container.addEventListener("scroll", update, { passive: true });
  container.addEventListener("scrollend", update, { passive: true });
  window.addEventListener("resize", update);
}
