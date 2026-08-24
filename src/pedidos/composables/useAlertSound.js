// src/pedidos/composables/useAlertSound.js
// Beep compartido vía Web Audio API. Un solo AudioContext para todo el
// panel (con conteo de referencias), cerrado solo cuando el último
// consumidor se desmonta — antes cada hook creaba el suyo y se quedaban
// abiertos (leak), ahora se comparte uno solo.
import { onUnmounted } from "vue";

let audioCtx = null;
let refCount = 0;

function ensureContext() {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    audioCtx = new AudioContextClass();
  }
  return audioCtx;
}

// Restaurante ruidoso: el pico de ganancia se fuerza por encima de 1.0 a
// propósito. El oscilador ya sale a amplitud ±1, así que un gain de 3.0
// satura/recorta la señal contra el techo de salida — suena más "duro" y
// se corta en vez de una onda seno limpia, pero es justo ese timbre áspero
// el que se necesita para que la alerta se note sobre el ruido del salón.
const ALERT_GAIN = 3.0;

function beep(frequency, duration) {
  const ctx = ensureContext();
  if (ctx.state === "suspended") ctx.resume();

  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();
  oscillator.type = "sine";
  oscillator.frequency.value = frequency;
  gainNode.gain.setValueAtTime(ALERT_GAIN, ctx.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);
  oscillator.start();
  oscillator.stop(ctx.currentTime + duration);
}

export function useAlertSound() {
  refCount++;

  onUnmounted(() => {
    refCount = Math.max(0, refCount - 1);
    if (refCount === 0 && audioCtx) {
      audioCtx.close();
      audioCtx = null;
    }
  });

  return {
    playNewOrder: () => beep(880, 0.15),
    playRequest: () => beep(660, 0.2),
  };
}
