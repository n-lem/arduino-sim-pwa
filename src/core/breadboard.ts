/**
 * @file breadboard.ts
 * @description Modelo de la protoboard: tamaños disponibles, generación de pines y conexiones internas.
 * Pines: `a1..j<N>` (agujeros; a–e y f–j forman tiras verticales por columna) y rieles `tp/tn/bp/bn<i>`
 * (arriba +/−, abajo +/−; cada riel es una sola tira horizontal).
 */

import type { CircuitComponent, PinDefinition } from '../types/circuit';

export type BreadboardSize = 'mini' | 'small' | 'medium' | 'large';

export interface BreadboardSizeInfo {
  size: BreadboardSize;
  label: string;
  columns: number;
  hint: string;
}

export const BREADBOARD_SIZES: Record<BreadboardSize, BreadboardSizeInfo> = {
  mini: { size: 'mini', label: 'Mini', columns: 10, hint: '10 columnas · 170 puntos aprox.' },
  small: { size: 'small', label: 'Chica', columns: 17, hint: '17 columnas · 170 puntos' },
  medium: { size: 'medium', label: 'Mediana', columns: 30, hint: '30 columnas · 400 puntos (half)' },
  large: { size: 'large', label: 'Grande', columns: 63, hint: '63 columnas · 830 puntos (full)' },
};

export const BREADBOARD_SIZE_LIST = Object.values(BREADBOARD_SIZES);

export const isBreadboardSize = (v: unknown): v is BreadboardSize => typeof v === 'string' && v in BREADBOARD_SIZES;

/** Separación entre agujeros en píxeles del lienzo. */
export const PITCH = 14;
const MARGIN_X = 24;
const ROW_LETTERS = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j'];
/** Coordenadas Y de rieles y filas. */
export const ROW_Y = {
  tp: 14,
  tn: 28,
  rows: [58, 72, 86, 100, 114, 146, 160, 174, 188, 202],
  bp: 232,
  bn: 246,
};
export const BREADBOARD_HEIGHT = 262;

/** Ancho del dibujo según el número de columnas. */
export const breadboardWidth = (columns: number): number => MARGIN_X * 2 + (columns - 1) * PITCH;

/** X de la columna (1-based). */
export const columnX = (col: number): number => MARGIN_X + (col - 1) * PITCH;

/** Cantidad de agujeros por riel: grupos de 5 separados por un hueco. */
export function railHoles(columns: number): number[] {
  const lastX = columnX(columns);
  const xs: number[] = [];
  for (let i = 0; ; i++) {
    const x = MARGIN_X + (i + Math.floor(i / 5)) * PITCH;
    if (x > lastX) break;
    xs.push(x);
  }
  return xs;
}

/** Genera todos los pines de una protoboard del tamaño pedido. */
export function getBreadboardPins(size: BreadboardSize): PinDefinition[] {
  const { columns } = BREADBOARD_SIZES[size];
  const pins: PinDefinition[] = [];
  for (let c = 1; c <= columns; c++) {
    ROW_LETTERS.forEach((letter, r) => {
      pins.push({ id: `${letter}${c}`, name: `${letter.toUpperCase()}${c}`, type: 'passive', x: columnX(c), y: ROW_Y.rows[r] });
    });
  }
  railHoles(columns).forEach((x, i) => {
    pins.push({ id: `tp${i}`, name: '+', type: 'power', x, y: ROW_Y.tp });
    pins.push({ id: `tn${i}`, name: '-', type: 'ground', x, y: ROW_Y.tn });
    pins.push({ id: `bp${i}`, name: '+', type: 'power', x, y: ROW_Y.bp });
    pins.push({ id: `bn${i}`, name: '-', type: 'ground', x, y: ROW_Y.bn });
  });
  return pins;
}

/**
 * Grupos de pines unidos eléctricamente dentro de la protoboard (tiras de columna y rieles).
 * @returns Lista de grupos; cada grupo es una lista de ids de pin.
 */
export function breadboardGroups(component: CircuitComponent): string[][] {
  const groups = new Map<string, string[]>();
  for (const p of component.pins) {
    const m = /^([a-j])(\d+)$/.exec(p.id);
    let key: string;
    if (m) key = `${m[1] <= 'e' ? 'top' : 'bot'}${m[2]}`;
    else key = p.id.replace(/\d+$/, '');
    const g = groups.get(key);
    if (g) g.push(p.id);
    else groups.set(key, [p.id]);
  }
  return [...groups.values()];
}
