import { describe, expect, it } from 'vitest';
import { createComponentFactory } from './componentsRegistry';
import { computePlugs, computeSnap, getPinPosition } from './geometry';

describe('geometry', () => {
  it('rota 90° un pin alrededor del centro del componente', () => {
    const led = createComponentFactory('led', 'a');
    const pin = led.pins[0];
    const before = getPinPosition(led, pin);
    const after = getPinPosition({ ...led, rotation: 90 }, pin);
    expect(after).not.toEqual(before);
    const back = getPinPosition({ ...led, rotation: 360 }, pin);
    expect(back.x).toBeCloseTo(before.x);
    expect(back.y).toBeCloseTo(before.y);
  });

  it('encaja un LED cercano a la protoboard y crea cables de enchufe', () => {
    const bb = { ...createComponentFactory('breadboard', 'b'), x: 0, y: 0 };
    const led = { ...createComponentFactory('led', 'l'), x: 53, y: 41 };
    const snap = computeSnap(led, [bb]);
    expect(snap).not.toBeNull();
    const moved = { ...led, x: led.x + snap!.dx, y: led.y + snap!.dy };
    const plugs = computePlugs(moved, [bb]);
    expect(plugs.length).toBeGreaterThan(0);
    expect(plugs.every((p) => p.plug && p.toComponentId === bb.id)).toBe(true);
  });

  it('no encaja si está lejos', () => {
    const bb = { ...createComponentFactory('breadboard', 'b'), x: 0, y: 0 };
    const led = { ...createComponentFactory('led', 'l'), x: 2000, y: 2000 };
    expect(computeSnap(led, [bb])).toBeNull();
  });
});
