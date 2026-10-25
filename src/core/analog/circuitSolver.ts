/**
 * @file circuitSolver.ts
 * @description Solver analógico DC por Análisis Nodal Modificado (MNA). Calcula tensiones y
 * corrientes reales del circuito: un LED entre 5V y GND se quema, una resistencia limita la
 * corriente, un pulsador con INPUT_PULLUP baja el pin a 0 V, un potenciómetro genera un divisor, etc.
 *
 * Es puro (sin React ni DOM) para poder testearlo. El modelo es de régimen permanente; el
 * comportamiento transitorio (capacitores, inductores) se agregará más adelante.
 */

import type { CircuitComponent, WireConnection } from '../../types/circuit';
import type { PinStateMap } from '../avr/avrRunner';

/** Resultado de resolver el circuito para un estado dado de los pines del Arduino. */
export interface SolveResult {
  /** LED conduciendo lo suficiente como para verse encendido. */
  ledStates: Record<string, boolean>;
  /** Corriente de cada LED en mA. */
  ledCurrents: Record<string, number>;
  /** IDs de LEDs quemados (incluye los que ya venían quemados). */
  burnedLeds: string[];
  /** Ángulo (0..180) de cada servo alimentado. */
  servoAngles: Record<string, number>;
  /** Servos con alimentación suficiente (≥ 3.5 V entre VCC y GND). */
  servoPowered: Record<string, boolean>;
  /** Tensión en cada pin del Arduino, con claves "0".."13" y "A0".."A5". */
  pinVoltages: Record<string, number>;
  /** Duración (µs) que debe devolver pulseIn() en el pin ECHO conectado a cada HC-SR04 alimentado. */
  pulseMicros: Record<string, number>;
  /** Tensión (V) y corriente (mA) de cada componente de dos terminales, para la ley de Ohm. */
  measurements: Record<string, { volts: number; milliamps: number }>;
  /** Buzzers con tensión suficiente para sonar. */
  buzzerOn: Record<string, boolean>;
  /** Avisos legibles para el usuario (cortocircuitos, LED quemado, sobrecarga de pin). */
  warnings: string[];
}

const GMIN = 1e-9;
const LED_RD = 10;
const LED_BURN_MA = 40;
const PIN_RS = 25;
const PIN_PULLUP_R = 30000;
const PIN_MAX_MA = 40;
const RAIL_5V_RS = 0.5;
const RAIL_5V_MAX_MA = 500;
const SERVO_LOAD = 200;
const SENSOR_LOAD = 330;
const BATTERY_RI = 0.1;
const BATTERY_MAX_MA = 1000;
const BUZZER_LOAD = 100;
const BUZZER_MIN_V = 2;
const MIN_R = 0.01;
const US_PER_CM = 58.2;

class UnionFind {
  private parent = new Map<string, string>();
  find(x: string): string {
    if (!this.parent.has(x)) this.parent.set(x, x);
    let r = x;
    while (this.parent.get(r) !== r) r = this.parent.get(r)!;
    let c = x;
    while (c !== r) { const n = this.parent.get(c)!; this.parent.set(c, r); c = n; }
    return r;
  }
  union(a: string, b: string): void {
    const ra = this.find(a);
    const rb = this.find(b);
    if (ra !== rb) this.parent.set(ra, rb);
  }
}

/** Resuelve A·x = b por eliminación gaussiana con pivoteo parcial. */
function solveLinear(a: number[][], b: number[]): number[] {
  const n = b.length;
  for (let col = 0; col < n; col++) {
    let piv = col;
    for (let r = col + 1; r < n; r++) if (Math.abs(a[r][col]) > Math.abs(a[piv][col])) piv = r;
    [a[col], a[piv]] = [a[piv], a[col]];
    [b[col], b[piv]] = [b[piv], b[col]];
    const d = a[col][col] || GMIN;
    for (let r = col + 1; r < n; r++) {
      const f = a[r][col] / d;
      if (f === 0) continue;
      for (let c = col; c < n; c++) a[r][c] -= f * a[col][c];
      b[r] -= f * b[col];
    }
  }
  const x = new Array<number>(n).fill(0);
  for (let r = n - 1; r >= 0; r--) {
    let s = b[r];
    for (let c = r + 1; c < n; c++) s -= a[r][c] * x[c];
    x[r] = s / (a[r][r] || GMIN);
  }
  return x;
}

interface Res { a: number; b: number; g: number }
interface Src { n: number; v: number; rs: number; label: string; kind: 'pin' | '5v' | '3v3' }
interface Led { id: string; a: number; k: number; vf: number; on: boolean }

const DIGITAL_PINS = Array.from({ length: 14 }, (_, i) => ({ id: `d${i}`, key: String(i) }));
const ANALOG_PINS = Array.from({ length: 6 }, (_, i) => ({ id: `a${i}`, key: `A${i}` }));

/**
 * Resuelve el circuito completo.
 * @param components Componentes del lienzo.
 * @param wires Cables (conexiones ideales entre pines).
 * @param pinStates Estado de los pines del microcontrolador (modo, nivel, PWM).
 */
export function solveCircuitPhysics(
  components: CircuitComponent[],
  wires: WireConnection[],
  pinStates: PinStateMap
): SolveResult {
  const arduino = components.find((c) => c.type === 'arduino-uno');
  const firstBattery = components.find((c) => c.type === 'battery');
  if (!arduino && !firstBattery) {
    return {
      ledStates: {}, ledCurrents: {}, burnedLeds: [], servoAngles: {}, servoPowered: {},
      pinVoltages: {}, pulseMicros: {}, measurements: {}, buzzerOn: {}, warnings: [],
    };
  }

  const preBurned = new Set(components.filter((c) => c.type === 'led' && c.properties.burned).map((c) => c.id));
  const first = runSolve(components, wires, pinStates, arduino, preBurned);
  if (first.newlyBurned.length === 0) return first.result;

  // Un LED se quemó: se vuelve a resolver como circuito abierto para reflejar el estado real.
  const burned = new Set([...preBurned, ...first.newlyBurned]);
  return runSolve(components, wires, pinStates, arduino, burned).result;
}

function runSolve(
  components: CircuitComponent[],
  wires: WireConnection[],
  pinStates: PinStateMap,
  arduino: CircuitComponent | undefined,
  burned: Set<string>
): { result: SolveResult; newlyBurned: string[] } {
  const k = (c: string, p: string) => `${c}:${p}`;
  const uf = new UnionFind();
  for (const w of wires) uf.union(k(w.fromComponentId, w.fromPinId), k(w.toComponentId, w.toPinId));
  // Referencia de 0 V: GND del Arduino o, si no hay placa, el negativo de la primera batería.
  if (arduino) {
    uf.union(k(arduino.id, 'gnd1'), k(arduino.id, 'gnd2'));
    uf.union(k(arduino.id, 'gnd1'), k(arduino.id, 'gnd3'));
  }
  const refBattery = components.find((c) => c.type === 'battery');
  const groundKey = arduino ? k(arduino.id, 'gnd1') : k(refBattery!.id, 'neg');
  const nets = new Map<string, number>([[uf.find(groundKey), -1]]);
  let count = 0;
  const node = (c: string, p: string): number => {
    const r = uf.find(k(c, p));
    if (!nets.has(r)) nets.set(r, count++);
    return nets.get(r)!;
  };

  const res: Res[] = [];
  const srcs: Src[] = [];
  const leds: Led[] = [];
  const addR = (a: number, b: number, ohms: number) => res.push({ a, b, g: 1 / Math.max(ohms, MIN_R) });

  if (arduino) {
    srcs.push({ n: node(arduino.id, '5v'), v: 5, rs: RAIL_5V_RS, label: '5V', kind: '5v' });
    srcs.push({ n: node(arduino.id, '3v3'), v: 3.3, rs: 1, label: '3.3V', kind: '3v3' });
  }
  const arduinoPins = arduino ? [...DIGITAL_PINS, ...ANALOG_PINS] : [];
  for (const p of arduinoPins) {
    const n = node(arduino!.id, p.id);
    const st = pinStates[p.key];
    if (!st) continue;
    if (st.mode === 'OUTPUT') srcs.push({ n, v: (Math.max(0, Math.min(255, st.value)) / 255) * 5, rs: PIN_RS, label: `pin ${p.key}`, kind: 'pin' });
    else if (st.mode === 'INPUT_PULLUP') srcs.push({ n, v: 5, rs: PIN_PULLUP_R, label: `pin ${p.key}`, kind: 'pin' });
  }

  const batteries: { c: CircuitComponent; pos: number; neg: number; v: number }[] = [];
  const buzzers: { c: CircuitComponent; pos: number; neg: number }[] = [];
  const resistors: { c: CircuitComponent; a: number; b: number; ohms: number }[] = [];
  const ultras: CircuitComponent[] = [];
  const servos: CircuitComponent[] = [];
  for (const c of components) {
    switch (c.type) {
      case 'resistor': {
        const ohms = Number(c.properties.resistance) || 220;
        const ra = node(c.id, 'pin1');
        const rb = node(c.id, 'pin2');
        addR(ra, rb, ohms);
        resistors.push({ c, a: ra, b: rb, ohms });
        break;
      }
      case 'battery': {
        const volts = Number(c.properties.voltage);
        const bat = { c, pos: node(c.id, 'pos'), neg: node(c.id, 'neg'), v: Number.isFinite(volts) ? volts : 9 };
        batteries.push(bat);
        // Equivalente de Norton: fuente ideal con resistencia interna, flotante respecto a tierra.
        addR(bat.pos, bat.neg, BATTERY_RI);
        break;
      }
      case 'buzzer': {
        const bz = { c, pos: node(c.id, 'pos'), neg: node(c.id, 'neg') };
        buzzers.push(bz);
        addR(bz.pos, bz.neg, BUZZER_LOAD);
        break;
      }
      case 'pushbutton':
        if (c.properties.isPressed) addR(node(c.id, 'pin1'), node(c.id, 'pin2'), 0.05);
        else { node(c.id, 'pin1'); node(c.id, 'pin2'); }
        break;
      case 'potentiometer': {
        const max = Number(c.properties.maxResistance) || 10000;
        const raw = Number(c.properties.value);
        const frac = Math.max(0, Math.min(1023, Number.isFinite(raw) ? raw : 512)) / 1023;
        const w = node(c.id, 'wiper');
        addR(node(c.id, 'vcc'), w, Math.max(1, max * (1 - frac)));
        addR(w, node(c.id, 'gnd'), Math.max(1, max * frac));
        break;
      }
      case 'led': {
        const a = node(c.id, 'anode');
        const cat = node(c.id, 'cathode');
        if (!burned.has(c.id)) leds.push({ id: c.id, a, k: cat, vf: Number(c.properties.forwardVoltage) || 2.0, on: false });
        break;
      }
      case 'servo-sg90':
        servos.push(c);
        addR(node(c.id, 'vcc'), node(c.id, 'gnd'), SERVO_LOAD);
        node(c.id, 'pwm');
        break;
      case 'ultrasonic-hcsr04':
        ultras.push(c);
        addR(node(c.id, 'vcc'), node(c.id, 'gnd'), SENSOR_LOAD);
        node(c.id, 'trig'); node(c.id, 'echo');
        break;
    }
  }

  const n = count;
  const build = (): { a: number[][]; b: number[] } => {
    const a = Array.from({ length: n }, () => new Array<number>(n).fill(0));
    const b = new Array<number>(n).fill(0);
    const stampG = (i: number, j: number, g: number) => {
      if (i >= 0) a[i][i] += g;
      if (j >= 0) a[j][j] += g;
      if (i >= 0 && j >= 0) { a[i][j] -= g; a[j][i] -= g; }
    };
    for (let i = 0; i < n; i++) a[i][i] += GMIN;
    for (const r of res) stampG(r.a, r.b, r.g);
    for (const s of srcs) if (s.n >= 0) { a[s.n][s.n] += 1 / s.rs; b[s.n] += s.v / s.rs; }
    for (const bt of batteries) {
      const i = bt.v / BATTERY_RI;
      if (bt.pos >= 0) b[bt.pos] += i;
      if (bt.neg >= 0) b[bt.neg] -= i;
    }
    for (const l of leds) {
      if (!l.on) continue;
      const g = 1 / LED_RD;
      stampG(l.a, l.k, g);
      if (l.a >= 0) b[l.a] += g * l.vf;
      if (l.k >= 0) b[l.k] -= g * l.vf;
    }
    return { a, b };
  };

  // Diodo lineal por tramos: se itera hasta que el estado on/off de cada LED sea consistente.
  let x: number[] = [];
  for (let iter = 0; iter < 40; iter++) {
    const m = build();
    x = solveLinear(m.a, m.b);
    let changed = false;
    for (const l of leds) {
      const vd = (l.a < 0 ? 0 : x[l.a]) - (l.k < 0 ? 0 : x[l.k]);
      if (!l.on && vd > l.vf + 1e-6) { l.on = true; changed = true; }
      else if (l.on && vd < l.vf - 1e-6) { l.on = false; changed = true; }
    }
    if (!changed) break;
  }
  const v = (i: number) => (i < 0 ? 0 : x[i] ?? 0);

  const result: SolveResult = {
    ledStates: {}, ledCurrents: {}, burnedLeds: [...burned], servoAngles: {}, servoPowered: {},
    pinVoltages: {}, pulseMicros: {}, measurements: {}, buzzerOn: {}, warnings: [],
  };
  const newlyBurned: string[] = [];
  const nameOf = (id: string) => components.find((c) => c.id === id)?.name ?? id;

  for (const id of burned) {
    result.ledStates[id] = false;
    result.ledCurrents[id] = 0;
    result.warnings.push(`LED «${nameOf(id)}» quemado por exceso de corriente. Agregá una resistencia y reiniciá la simulación.`);
  }
  for (const l of leds) {
    const ma = l.on ? ((v(l.a) - v(l.k) - l.vf) / LED_RD) * 1000 : 0;
    result.ledCurrents[l.id] = Math.max(0, ma);
    result.ledStates[l.id] = ma > 0.2;
    if (ma > LED_BURN_MA) newlyBurned.push(l.id);
  }

  if (newlyBurned.length === 0) {
    for (const s of srcs) {
      const i = ((s.v - v(s.n)) / s.rs) * 1000;
      if (s.kind === '5v' && i > RAIL_5V_MAX_MA) result.warnings.push(`Cortocircuito: el pin 5V entrega ${i.toFixed(0)} mA. Revisá los cables.`);
      if (s.kind === 'pin' && s.rs === PIN_RS && Math.abs(i) > PIN_MAX_MA) {
        result.warnings.push(`El ${s.label} maneja ${Math.abs(i).toFixed(0)} mA (máximo ${PIN_MAX_MA} mA). Usá una resistencia.`);
      }
    }
  }

  for (const p of arduinoPins) result.pinVoltages[p.key] = v(node(arduino!.id, p.id));

  const pinOnNet = (c: string, pid: string) => {
    const r = uf.find(k(c, pid));
    return arduinoPins.find((p) => uf.find(k(arduino!.id, p.id)) === r);
  };

  for (const r of resistors) {
    const volts = v(r.a) - v(r.b);
    result.measurements[r.c.id] = { volts, milliamps: (volts / r.ohms) * 1000 };
  }
  for (const bt of batteries) {
    const terminal = v(bt.pos) - v(bt.neg);
    const ma = ((bt.v - terminal) / BATTERY_RI) * 1000;
    result.measurements[bt.c.id] = { volts: terminal, milliamps: ma };
    if (newlyBurned.length === 0 && ma > BATTERY_MAX_MA) {
      result.warnings.push(`Cortocircuito en la batería «${bt.c.name}»: circulan ${(ma / 1000).toFixed(1)} A. Agregá una resistencia.`);
    }
  }
  for (const bz of buzzers) {
    const volts = v(bz.pos) - v(bz.neg);
    result.buzzerOn[bz.c.id] = volts >= BUZZER_MIN_V;
    result.measurements[bz.c.id] = { volts, milliamps: (volts / BUZZER_LOAD) * 1000 };
  }
  for (const l of leds) {
    result.measurements[l.id] = { volts: v(l.a) - v(l.k), milliamps: result.ledCurrents[l.id] };
  }

  for (const s of servos) {
    const powered = v(node(s.id, 'vcc')) - v(node(s.id, 'gnd')) >= 3.5;
    result.servoPowered[s.id] = powered;
    const pin = pinOnNet(s.id, 'pwm');
    if (powered && pin && pinStates[pin.key]) result.servoAngles[s.id] = Math.max(0, Math.min(180, pinStates[pin.key].value));
  }

  for (const u of ultras) {
    const powered = v(node(u.id, 'vcc')) - v(node(u.id, 'gnd')) >= 4;
    const echo = pinOnNet(u.id, 'echo');
    const cm = Number(u.properties.distanceCm);
    if (powered && echo) result.pulseMicros[echo.key] = Math.max(0, (Number.isFinite(cm) ? cm : 25) * US_PER_CM);
  }

  return { result, newlyBurned };
}
