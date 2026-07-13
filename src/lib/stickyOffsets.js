// src/lib/stickyOffsets.js
// Calcula en tiempo real la altura del header fijo y de la barra de alérgenos,
// y las expone como variables CSS para que las barras sticky que van debajo
// (alérgenos, categorías) se apilen exactas, sin adivinar píxeles a mano.

let initialized = false;

function measure() {
  const header = document.querySelector("header");
  const allergenBar = document.querySelector(".allergen-filter-container");
  const root = document.documentElement.style;

  if (header) {
    root.setProperty("--sticky-header-h", `${header.offsetHeight}px`);
  }
  if (allergenBar) {
    root.setProperty("--sticky-allergen-h", `${allergenBar.offsetHeight}px`);
  }
}

export function initStickyOffsets() {
  if (initialized) {
    measure();
    return;
  }
  initialized = true;

  measure();
  window.addEventListener("resize", measure);

  const header = document.querySelector("header");
  const allergenBar = document.querySelector(".allergen-filter-container");
  if (typeof ResizeObserver !== "undefined") {
    const observer = new ResizeObserver(measure);
    if (header) observer.observe(header);
    if (allergenBar) observer.observe(allergenBar);
  }
}
