/**
 * @file geometry.ts
 * @description Tamaños de los componentes, rotación y encaje ("snap") sobre los agujeros de una protoboard.
 * Las coordenadas de pines son locales al componente sin rotar; la rotación (múltiplos de 90°) se aplica
 * alrededor del centro del dibujo.
 */

import type { CircuitComponent, ComponentType, PinDefinition, WireConnection } from '../types/circuit';
import { BREADBOARD_HEIGHT, BREADBOARD_SIZES, breadboardWidth, isBreadboardSize } from './breadboard';
import { ESP32_SIZE } from './componentsRegistry';

export interface Size {
  width: number;
  height: number;
}

export interface Point {
  x: number;
  y: number;
}

const FIXED_SIZES: Partial<Record<ComponentType, Size>> = {
  'arduino-uno': { width: 300, height: 200 },
  esp32: ESP32_SIZE,
  led: { width: 60, height: 65 },
  resistor: { width: 80, height: 32 },
  pushbutton: { width: 60, height: 48 },
  'servo-sg90': { width: 70, height: 95 },
  'ultrasonic-hcsr04': { width: 95, height: 72 },
  potentiometer: { width: 70, height: 80 },
  buzzer: { width: 60, height: 72 },
  battery: { width: 60, height: 96 },
  switch: { width: 80, height: 56 },
  ldr: { width: 70, height: 76 },
  multimeter: { width: 100, height: 106 },
};

/** Tamaño del dibujo (sin rotar) de un componente. */
export function getComponentSize(component: CircuitComponent): Size {
  if (component.type === 'breadboard') {
    const size = isBreadboardSize(component.properties.size) ? component.properties.size : 'medium';
    return { width: breadboardWidth(BREADBOARD_SIZES[size].columns), height: BREADBOARD_HEIGHT };
  }
  return FIXED_SIZES[component.type] ?? { width: 80, height: 80 };
}

/** Normaliza un ángulo a 0, 90, 180 o 270. */
export const normalizeRotation = (deg: number): number => ((Math.round(deg / 90) * 90) % 360 + 360) % 360;

/** Centro del componente en coordenadas del lienzo. */
export function getComponentCenter(component: CircuitComponent): Point {
  const { width, height } = getComponentSize(component);
  return { x: component.x + width / 2, y: component.y + height / 2 };
}

/** Rota un punto alrededor de un centro. */
export function rotatePoint(p: Point, center: Point, deg: number): Point {
  const rad = (normalizeRotation(deg) * Math.PI) / 180;
  const cos = Math.round(Math.cos(rad));
  const sin = Math.round(Math.sin(rad));
  const dx = p.x - center.x;
  const dy = p.y - center.y;
  return { x: center.x + dx * cos - dy * sin, y: center.y + dx * sin + dy * cos };
}

/** Posición de un pin en coordenadas del lienzo, considerando posición y rotación. */
export function getPinPosition(component: CircuitComponent, pin: PinDefinition): Point {
  const raw = { x: component.x + pin.x, y: component.y + pin.y };
  return rotatePoint(raw, getComponentCenter(component), component.rotation);
}

/** Máxima distancia (px) entre un pin y un agujero para considerarlos enchufados. */
export const SNAP_RADIUS = 9;

/**
 * Calcula cuánto hay que desplazar un componente para que sus pines caigan sobre agujeros de protoboard.
 * Prueba alinear cada pin con cada agujero cercano y se queda con el desplazamiento que enchufa más pines.
 * @returns `null` si ningún pin queda cerca de un agujero.
 */
export function computeSnap(
  component: CircuitComponent,
  breadboards: CircuitComponent[]
): { dx: number; dy: number } | null {
  const pinPositions = component.pins.map((p) => getPinPosition(component, p));
  const holes: Point[] = [];
  for (const bb of breadboards) for (const h of bb.pins) holes.push(getPinPosition(bb, h));
  if (holes.length === 0 || pinPositions.length === 0) return null;

  const reach = SNAP_RADIUS * 2.5;
  const candidates = new Map<string, { dx: number; dy: number }>();
  for (const p of pinPositions) {
    for (const h of holes) {
      if (Math.abs(h.x - p.x) > reach || Math.abs(h.y - p.y) > reach) continue;
      const dx = Math.round((h.x - p.x) * 100) / 100;
      const dy = Math.round((h.y - p.y) * 100) / 100;
      candidates.set(`${dx}|${dy}`, { dx, dy });
    }
  }

  let best: { dx: number; dy: number; score: number; dist: number } | null = null;
  for (const c of candidates.values()) {
    let score = 0;
    for (const p of pinPositions) {
      const x = p.x + c.dx;
      const y = p.y + c.dy;
      if (holes.some((h) => Math.abs(h.x - x) <= SNAP_RADIUS && Math.abs(h.y - y) <= SNAP_RADIUS)) score++;
    }
    const dist = Math.hypot(c.dx, c.dy);
    if (!best || score > best.score || (score === best.score && dist < best.dist)) best = { ...c, score, dist };
  }
  return best && best.score > 0 ? { dx: best.dx, dy: best.dy } : null;
}

/**
 * Cables "de enchufe": uniones sin cable visible creadas al encajar un componente en una protoboard.
 * Para cada pin del componente cerca de un agujero se crea una conexión directa.
 */
export function computePlugs(component: CircuitComponent, breadboards: CircuitComponent[]): WireConnection[] {
  const plugs: WireConnection[] = [];
  const used = new Set<string>();
  for (const pin of component.pins) {
    const pos = getPinPosition(component, pin);
    let best: { bb: CircuitComponent; hole: PinDefinition; d: number } | null = null;
    for (const bb of breadboards) {
      for (const hole of bb.pins) {
        const h = getPinPosition(bb, hole);
        const d = Math.hypot(h.x - pos.x, h.y - pos.y);
        if (d <= SNAP_RADIUS && (!best || d < best.d)) best = { bb, hole, d };
      }
    }
    if (!best) continue;
    const key = `${best.bb.id}:${best.hole.id}`;
    // Un agujero admite una sola pata.
    if (used.has(key)) continue;
    used.add(key);
    plugs.push({
      id: `plug-${component.id}-${pin.id}`,
      fromComponentId: component.id,
      fromPinId: pin.id,
      toComponentId: best.bb.id,
      toPinId: best.hole.id,
      color: 'transparent',
      plug: true,
    });
  }
  return plugs;
}
