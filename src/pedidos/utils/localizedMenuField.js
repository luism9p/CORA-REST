// src/pedidos/utils/localizedMenuField.js
// nombre_en/descripcion_en son opcionales (el admin no está obligado a
// traducir cada plato): si no existen, se muestra el texto en español.
export function localizedName(item, language) {
  if (!item) return "";
  return (language === "en" && item.nombre_en) || item.nombre;
}

export function localizedDescription(item, language) {
  if (!item) return "";
  return (language === "en" && item.descripcion_en) || item.descripcion;
}
