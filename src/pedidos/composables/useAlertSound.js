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

function beep(frequency, duration) {
  const ctx = ensureContext();
  if (ctx.state === "suspended") ctx.resume();

  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();
  oscillator.type = "sine";
  oscillator.frequency.value = frequency;
  gain.gain.setValueAtTime(0.2, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
  oscillator.connect(gain);
  gain.connect(ctx.destination);
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
