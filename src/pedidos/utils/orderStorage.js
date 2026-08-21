// src/pedidos/utils/orderStorage.js
// Recuerda el pedido activo de cada mesa en localStorage, para poder
// recuperarlo si el cliente recarga la página por accidente.

const PREFIX = "cora:orderId:mesa:";

function keyFor(tableNumber) {
  return `${PREFIX}${tableNumber}`;
}

export function getStoredOrderId(tableNumber) {
  try {
    return localStorage.getItem(keyFor(tableNumber));
  } catch {
    return null;
  }
}

export function setStoredOrderId(tableNumber, orderId) {
  try {
    localStorage.setItem(keyFor(tableNumber), orderId);
  } catch {
    // localStorage no disponible (modo privado, cuota llena, etc.)
  }
}

export function clearStoredOrderId(tableNumber) {
  try {
    localStorage.removeItem(keyFor(tableNumber));
  } catch {
    // no-op
  }
}
