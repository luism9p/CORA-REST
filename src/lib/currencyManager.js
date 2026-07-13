// src/lib/currencyManager.js
// Conversor de divisas 100% client-side (sin backend). Base: PEN.

const API_URL = "https://open.er-api.com/v6/latest/PEN";
const CACHE_KEY = "cora_exchange_rates";
const CACHE_MAX_AGE = 24 * 60 * 60 * 1000; // 24h
const PREF_KEY = "cora_preferred_currency";

export const CURRENCY_SYMBOLS = {
  PEN: "S/",
  USD: "$",
  EUR: "€",
  MXN: "$",
  COP: "$",
  ARS: "$",
};

function readCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const { timestamp, rates } = JSON.parse(raw);
    if (!timestamp || !rates || Date.now() - timestamp > CACHE_MAX_AGE) return null;
    return rates;
  } catch {
    return null;
  }
}

function writeCache(rates) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ timestamp: Date.now(), rates }));
  } catch {
    // localStorage no disponible (modo privado, cuota llena, etc.)
  }
}

async function fetchRates() {
  const res = await fetch(API_URL);
  if (!res.ok) throw new Error(`Currency API error: ${res.status}`);
  const data = await res.json();
  if (!data?.rates) throw new Error("Currency API: respuesta sin 'rates'");
  return data.rates;
}

async function getRates() {
  const cached = readCache();
  if (cached) return cached;
  const rates = await fetchRates();
  writeCache(rates);
  return rates;
}

// Si no hay tasa disponible para la moneda pedida, se fuerza PEN (fallback seguro).
function resolveCurrency(currency, rates) {
  if (currency === "PEN") return "PEN";
  if (rates && typeof rates[currency] === "number") return currency;
  return "PEN";
}

function applyPrices(currency, rates) {
  const effective = resolveCurrency(currency, rates);
  const symbol = CURRENCY_SYMBOLS[effective];
  const rate = effective === "PEN" ? 1 : rates[effective];

  document.querySelectorAll(".price-value").forEach((el) => {
    const base = parseFloat(el.dataset.basePrice || "0");
    el.textContent = (base * rate).toFixed(2);
  });

  document.querySelectorAll(".currency-symbol").forEach((el) => {
    el.textContent = symbol;
  });

  return effective;
}

export async function initCurrencyManager(rootId) {
  const root = document.getElementById(rootId);
  if (!root || root.dataset.currencyInit === "true") return;
  root.dataset.currencyInit = "true";

  const trigger = root.querySelector("#currency-trigger");
  const panel = root.querySelector("#currency-panel");
  const chevron = root.querySelector(".currency-chevron");
  const triggerSymbol = root.querySelector("#currency-trigger-symbol");
  const triggerCode = root.querySelector("#currency-trigger-code");
  const options = Array.from(root.querySelectorAll(".currency-option"));
  if (!trigger || !panel || !options.length) return;

  const preferred = localStorage.getItem(PREF_KEY) || "PEN";

  let rates = null;
  try {
    rates = await getRates();
  } catch (err) {
    console.error("No se pudieron obtener las tasas de cambio, se mantienen los precios en PEN.", err);
  }

  const setActiveOption = (currency) => {
    options.forEach((opt) => {
      const isActive = opt.dataset.currency === currency;
      opt.classList.toggle("bg-black", isActive);
      opt.classList.toggle("text-white", isActive);
      opt.classList.toggle("dark:bg-white", isActive);
      opt.classList.toggle("dark:text-black", isActive);
      opt.setAttribute("aria-selected", String(isActive));
    });
    if (triggerSymbol) triggerSymbol.textContent = CURRENCY_SYMBOLS[currency];
    if (triggerCode) triggerCode.textContent = currency;
  };

  const select = (currency) => {
    const effective = applyPrices(currency, rates);
    setActiveOption(effective);
    localStorage.setItem(PREF_KEY, effective);
    return effective;
  };

  const closePanel = () => {
    panel.classList.add("hidden");
    trigger.setAttribute("aria-expanded", "false");
    chevron?.classList.remove("rotate-180");
  };

  const openPanel = () => {
    panel.classList.remove("hidden");
    trigger.setAttribute("aria-expanded", "true");
    chevron?.classList.add("rotate-180");
  };

  select(preferred);

  trigger.addEventListener("click", (e) => {
    e.stopPropagation();
    const isOpen = trigger.getAttribute("aria-expanded") === "true";
    if (isOpen) closePanel();
    else openPanel();
  });

  options.forEach((opt) => {
    opt.addEventListener("click", () => {
      select(opt.dataset.currency);
      closePanel();
    });
  });

  document.addEventListener("click", (e) => {
    if (!root.contains(e.target)) closePanel();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closePanel();
  });
}
