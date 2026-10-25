/**
 * @file audio.ts
 * @description Generador de sonido del buzzer con Web Audio (funciona sin conexión). Un único oscilador
 * cuadrado, como el de un buzzer piezoeléctrico, que se enciende y apaga según el circuito.
 */

let ctx: AudioContext | null = null;
let osc: OscillatorNode | null = null;
let gain: GainNode | null = null;

/** Crea el contexto de audio. Debe llamarse desde un gesto del usuario (p. ej. el botón Iniciar). */
export function unlockAudio(): void {
  if (typeof window === 'undefined') return;
  const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return;
  ctx ??= new Ctor();
  if (ctx.state === 'suspended') void ctx.resume();
}

/**
 * Reproduce una nota; frecuencia 0 la silencia.
 * @param frequency Hercios.
 */
export function playTone(frequency: number): void {
  if (!ctx) return;
  if (frequency <= 0) {
    stopTone();
    return;
  }
  if (!osc) {
    osc = ctx.createOscillator();
    gain = ctx.createGain();
    osc.type = 'square';
    gain.gain.value = 0.04;
    osc.connect(gain).connect(ctx.destination);
    osc.start();
  }
  osc.frequency.setValueAtTime(Math.min(frequency, 12000), ctx.currentTime);
}

/** Silencia el buzzer. */
export function stopTone(): void {
  if (osc) {
    try { osc.stop(); } catch { /* ya detenido */ }
    osc.disconnect();
    gain?.disconnect();
  }
  osc = null;
  gain = null;
}
