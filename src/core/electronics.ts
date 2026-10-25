/**
 * @file electronics.ts
 * @description Utilidades puras de electrónica: formato de unidades, código de colores y valores comerciales.
 */

/** Valores de resistencia comerciales más usados en el aula (Ω). */
export const RESISTOR_PRESETS = [10, 100, 220, 330, 470, 1000, 2200, 4700, 10000, 47000, 100000];

/** Tensiones típicas de pilas y baterías (V). */
export const BATTERY_PRESETS = [1.5, 3, 4.5, 5, 9, 12];

const DIGIT_COLORS = ['#111827', '#78350F', '#EF4444', '#F97316', '#EAB308', '#22C55E', '#3B82F6', '#8B5CF6', '#9CA3AF', '#F8FAFC'];

/**
 * Formatea ohmios con prefijo (Ω, kΩ, MΩ).
 * @param ohms Valor en ohmios.
 */
export function formatOhms(ohms: number): string {
  if (ohms >= 1_000_000) return `${+(ohms / 1_000_000).toFixed(2)}MΩ`;
  if (ohms >= 1000) return `${+(ohms / 1000).toFixed(2)}kΩ`;
  return `${+ohms.toFixed(2)}Ω`;
}

/**
 * Calcula los colores de las 3 bandas de valor (2 dígitos + multiplicador) de una resistencia.
 * La cuarta banda (tolerancia, dorada) la agrega quien dibuja.
 * @param ohms Valor en ohmios (> 0).
 */
export function resistorBandColors(ohms: number): [string, string, string] {
  if (!Number.isFinite(ohms) || ohms <= 0) return [DIGIT_COLORS[0], DIGIT_COLORS[0], DIGIT_COLORS[0]];
  let exp = Math.floor(Math.log10(ohms)) - 1;
  let mantissa = Math.round(ohms / 10 ** exp);
  if (mantissa >= 100) { mantissa = Math.round(mantissa / 10); exp += 1; }
  const multiplier = exp < 0 ? (exp === -1 ? '#D4AF37' : '#C0C0C0') : DIGIT_COLORS[Math.min(exp, 9)];
  return [DIGIT_COLORS[Math.floor(mantissa / 10) % 10], DIGIT_COLORS[mantissa % 10], multiplier];
}

/**
 * Convierte texto del usuario ("4.7k", "220", "1M", "2,2k") a un número en ohmios.
 * @returns El valor, o `null` si el texto no es válido.
 */
export function parseOhms(text: string): number | null {
  const m = text.trim().toLowerCase().replace(',', '.').replace(/[ωΩ]/g, '').match(/^(\d+(?:\.\d+)?)\s*([km]?)$/);
  if (!m) return null;
  const value = parseFloat(m[1]) * (m[2] === 'k' ? 1000 : m[2] === 'm' ? 1_000_000 : 1);
  return value > 0 ? value : null;
}

/** Formatea una corriente en mA con 1 decimal (o µA si es muy chica). */
export function formatCurrent(milliamps: number): string {
  const abs = Math.abs(milliamps);
  if (abs >= 1000) return `${(milliamps / 1000).toFixed(2)} A`;
  if (abs > 0 && abs < 0.1) return `${(milliamps * 1000).toFixed(0)} µA`;
  return `${milliamps.toFixed(1)} mA`;
}
