import { describe, it, expect } from 'vitest';
import { solveCircuitPhysics } from './circuitSolver';
import { createComponentFactory } from '../componentsRegistry';
import type { WireConnection } from '../../types/circuit';
import type { PinStateMap } from '../avr/avrRunner';

let n = 0;
const wire = (a: string, ap: string, b: string, bp: string): WireConnection => ({
  id: `w${n++}`, fromComponentId: a, fromPinId: ap, toComponentId: b, toPinId: bp, color: '#fff',
});
const pins = (o: Record<string, { mode: 'OUTPUT' | 'INPUT' | 'INPUT_PULLUP'; value?: number }> = {}): PinStateMap => {
  const m: PinStateMap = {};
  for (let i = 0; i <= 13; i++) m[String(i)] = { isHigh: false, value: 0, mode: 'INPUT' };
  for (let i = 0; i <= 5; i++) m[`A${i}`] = { isHigh: false, value: 0, mode: 'INPUT' };
  for (const [k, v] of Object.entries(o)) m[k] = { isHigh: (v.value ?? 0) > 0, value: v.value ?? 0, mode: v.mode };
  return m;
};

const uno = createComponentFactory('arduino-uno', 'u');
const led = () => createComponentFactory('led', 'l');
const res = () => createComponentFactory('resistor', 'r');

describe('baterías y ley de Ohm (sin Arduino)', () => {
  const bat = (v: number) => { const b = createComponentFactory('battery', 'b'); b.properties.voltage = v; return b; };

  it('batería 9V + 1 kΩ: 9 V y 9 mA en la resistencia', () => {
    const b = bat(9); const rr = res(); rr.properties.resistance = 1000;
    const r = solveCircuitPhysics([b, rr], [wire(b.id, 'pos', rr.id, 'pin1'), wire(rr.id, 'pin2', b.id, 'neg')], pins());
    expect(r.measurements[rr.id].volts).toBeCloseTo(9, 1);
    expect(r.measurements[rr.id].milliamps).toBeCloseTo(9, 1);
  });

  it('cambiar la resistencia cambia la corriente (I = V/R)', () => {
    const b = bat(5); const rr = res(); rr.properties.resistance = 500;
    const r = solveCircuitPhysics([b, rr], [wire(b.id, 'pos', rr.id, 'pin1'), wire(rr.id, 'pin2', b.id, 'neg')], pins());
    expect(r.measurements[rr.id].milliamps).toBeCloseTo(10, 1);
  });

  it('batería 9V + 330 Ω + LED enciende con ~20 mA', () => {
    const b = bat(9); const rr = res(); rr.properties.resistance = 330; const l = led();
    const r = solveCircuitPhysics([b, rr, l], [wire(b.id, 'pos', rr.id, 'pin1'), wire(rr.id, 'pin2', l.id, 'anode'), wire(l.id, 'cathode', b.id, 'neg')], pins());
    expect(r.ledStates[l.id]).toBe(true);
    expect(r.ledCurrents[l.id]).toBeGreaterThan(18);
    expect(r.ledCurrents[l.id]).toBeLessThan(23);
  });

  it('LED directo a una batería de 9V se quema', () => {
    const b = bat(9); const l = led();
    const r = solveCircuitPhysics([b, l], [wire(b.id, 'pos', l.id, 'anode'), wire(l.id, 'cathode', b.id, 'neg')], pins());
    expect(r.burnedLeds).toContain(l.id);
  });

  it('batería en cortocircuito avisa', () => {
    const b = bat(9);
    const r = solveCircuitPhysics([b], [wire(b.id, 'pos', b.id, 'neg')], pins());
    expect(r.warnings.join(' ')).toMatch(/Cortocircuito/);
  });

  it('buzzer suena con 5 V y no con 1,5 V', () => {
    const bz = createComponentFactory('buzzer', 'z');
    const w = (b: ReturnType<typeof bat>) => [wire(b.id, 'pos', bz.id, 'pos'), wire(bz.id, 'neg', b.id, 'neg')];
    const hi = bat(5); const lo = bat(1.5);
    expect(solveCircuitPhysics([hi, bz], w(hi), pins()).buzzerOn[bz.id]).toBe(true);
    expect(solveCircuitPhysics([lo, bz], w(lo), pins()).buzzerOn[bz.id]).toBe(false);
  });
});

describe('circuitSolver', () => {
  it('LED directo entre 5V y GND se quema', () => {
    const l = led();
    const r = solveCircuitPhysics([uno, l], [wire(uno.id, '5v', l.id, 'anode'), wire(l.id, 'cathode', uno.id, 'gnd2')], pins());
    expect(r.burnedLeds).toContain(l.id);
    expect(r.ledStates[l.id]).toBe(false);
    expect(r.warnings.join(' ')).toMatch(/quemado/);
  });

  it('LED con resistencia desde el pin 13 enciende con ~11 mA', () => {
    const l = led(); const rr = res();
    const w = [wire(uno.id, 'd13', rr.id, 'pin1'), wire(rr.id, 'pin2', l.id, 'anode'), wire(l.id, 'cathode', uno.id, 'gnd1')];
    const on = solveCircuitPhysics([uno, l, rr], w, pins({ '13': { mode: 'OUTPUT', value: 255 } }));
    expect(on.ledStates[l.id]).toBe(true);
    expect(on.ledCurrents[l.id]).toBeGreaterThan(9);
    expect(on.ledCurrents[l.id]).toBeLessThan(14);
    expect(on.burnedLeds).toHaveLength(0);
    const off = solveCircuitPhysics([uno, l, rr], w, pins({ '13': { mode: 'OUTPUT', value: 0 } }));
    expect(off.ledStates[l.id]).toBe(false);
  });

  it('LED conectado al revés no enciende', () => {
    const l = led(); const rr = res();
    const w = [wire(uno.id, 'd13', rr.id, 'pin1'), wire(rr.id, 'pin2', l.id, 'cathode'), wire(l.id, 'anode', uno.id, 'gnd1')];
    const r = solveCircuitPhysics([uno, l, rr], w, pins({ '13': { mode: 'OUTPUT', value: 255 } }));
    expect(r.ledStates[l.id]).toBe(false);
    expect(r.burnedLeds).toHaveLength(0);
  });

  it('LED sin ninguna conexión permanece apagado', () => {
    const l = led();
    expect(solveCircuitPhysics([uno, l], [], pins()).ledStates[l.id]).toBe(false);
  });

  it('pin 13 directo a LED y GND quema el LED (sin resistencia)', () => {
    const l = led();
    const r = solveCircuitPhysics([uno, l], [wire(uno.id, 'd13', l.id, 'anode'), wire(l.id, 'cathode', uno.id, 'gnd1')], pins({ '13': { mode: 'OUTPUT', value: 255 } }));
    expect(r.burnedLeds).toContain(l.id);
  });

  it('cortocircuito 5V-GND por cable genera aviso', () => {
    const r = solveCircuitPhysics([uno], [wire(uno.id, '5v', uno.id, 'gnd2')], pins());
    expect(r.warnings.join(' ')).toMatch(/Cortocircuito/);
  });

  it('pulsador con INPUT_PULLUP baja a 0 V al presionar', () => {
    const b = createComponentFactory('pushbutton', 'b');
    const w = [wire(uno.id, 'd2', b.id, 'pin1'), wire(b.id, 'pin2', uno.id, 'gnd1')];
    const st = pins({ '2': { mode: 'INPUT_PULLUP' } });
    expect(solveCircuitPhysics([uno, b], w, st).pinVoltages['2']).toBeGreaterThan(4.9);
    b.properties.isPressed = true;
    expect(solveCircuitPhysics([uno, b], w, st).pinVoltages['2']).toBeLessThan(0.1);
  });

  it('potenciómetro divide la tensión hacia A0', () => {
    const p = createComponentFactory('potentiometer', 'p');
    p.properties.value = 512;
    const w = [wire(p.id, 'vcc', uno.id, '5v'), wire(p.id, 'gnd', uno.id, 'gnd2'), wire(p.id, 'wiper', uno.id, 'a0')];
    const v = solveCircuitPhysics([uno, p], w, pins()).pinVoltages['A0'];
    expect(v).toBeGreaterThan(2.4);
    expect(v).toBeLessThan(2.6);
  });

  it('servo solo se mueve si está alimentado', () => {
    const s = createComponentFactory('servo-sg90', 's');
    const sig = wire(s.id, 'pwm', uno.id, 'd9');
    const st = pins({ '9': { mode: 'OUTPUT', value: 45 } });
    expect(solveCircuitPhysics([uno, s], [sig], st).servoAngles[s.id]).toBeUndefined();
    const full = solveCircuitPhysics([uno, s], [sig, wire(s.id, 'vcc', uno.id, '5v'), wire(s.id, 'gnd', uno.id, 'gnd1')], st);
    expect(full.servoAngles[s.id]).toBe(45);
  });
});
