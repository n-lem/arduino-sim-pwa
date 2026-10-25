/**
 * @file boards.ts
 * @description Perfiles de placas de desarrollo (Arduino Uno, ESP32). Concentra lo que cambia entre
 * placas (tensión lógica, resolución del ADC, pines, rieles) para que el solver, el runner y los bloques
 * no dependan de una placa concreta.
 */

import type { CircuitComponent } from '../types/circuit';

export type BoardType = 'arduino-uno' | 'esp32';

/** Pin utilizable por el sketch: `id` es el pin del lienzo y `key` la clave del estado del pin. */
export interface BoardPin {
  id: string;
  key: string;
  /** Número que usa el sketch (digitalWrite(n)). */
  num: number;
  pwm: boolean;
  analog: boolean;
  /** Solo entrada (GPIO34-39 del ESP32). */
  inputOnly?: boolean;
}

/** Salida de alimentación de la placa. */
export interface BoardRail {
  id: string;
  volts: number;
  /** Resistencia de salida (Ω). */
  rs: number;
  label: string;
  kind: '5v' | '3v3';
}

export interface BoardProfile {
  type: BoardType;
  name: string;
  /** Tensión de los pines de E/S. */
  logicVolts: number;
  /** Valor máximo de analogRead. */
  adcMax: number;
  ledBuiltin: number;
  pins: BoardPin[];
  rails: BoardRail[];
  grounds: string[];
}

const UNO_PINS: BoardPin[] = [
  ...Array.from({ length: 14 }, (_, i): BoardPin => ({
    id: `d${i}`, key: String(i), num: i, pwm: [3, 5, 6, 9, 10, 11].includes(i), analog: false,
  })),
  ...Array.from({ length: 6 }, (_, i): BoardPin => ({
    id: `a${i}`, key: `A${i}`, num: 14 + i, pwm: false, analog: true,
  })),
];

const ESP32_GPIOS = [2, 4, 5, 12, 13, 14, 15, 16, 17, 18, 19, 21, 22, 23, 25, 26, 27, 32, 33, 34, 35, 36, 39, 1, 3];
const ESP32_ADC = [32, 33, 34, 35, 36, 39, 25, 26, 27, 14, 12, 13, 15, 2, 4];
const ESP32_INPUT_ONLY = [34, 35, 36, 39];

const ESP32_PINS: BoardPin[] = ESP32_GPIOS.map((g): BoardPin => ({
  id: `d${g}`,
  key: String(g),
  num: g,
  pwm: !ESP32_INPUT_ONLY.includes(g),
  analog: ESP32_ADC.includes(g),
  inputOnly: ESP32_INPUT_ONLY.includes(g),
}));

export const BOARD_PROFILES: Record<BoardType, BoardProfile> = {
  'arduino-uno': {
    type: 'arduino-uno',
    name: 'Arduino Uno',
    logicVolts: 5,
    adcMax: 1023,
    ledBuiltin: 13,
    pins: UNO_PINS,
    rails: [
      { id: '5v', volts: 5, rs: 0.5, label: '5V', kind: '5v' },
      { id: '3v3', volts: 3.3, rs: 1, label: '3.3V', kind: '3v3' },
    ],
    grounds: ['gnd1', 'gnd2', 'gnd3'],
  },
  esp32: {
    type: 'esp32',
    name: 'ESP32',
    logicVolts: 3.3,
    adcMax: 4095,
    ledBuiltin: 2,
    pins: ESP32_PINS,
    rails: [
      { id: '3v3', volts: 3.3, rs: 0.5, label: '3.3V', kind: '3v3' },
      { id: 'vin', volts: 5, rs: 0.5, label: '5V (VIN)', kind: '5v' },
    ],
    grounds: ['gnd1', 'gnd2'],
  },
};

/** Indica si un tipo de componente es una placa de desarrollo. */
export function isBoardType(type: string): type is BoardType {
  return type === 'arduino-uno' || type === 'esp32';
}

/** Devuelve la primera placa del circuito con su perfil, o null si el usuario la eliminó. */
export function findBoard(components: CircuitComponent[]): { comp: CircuitComponent; profile: BoardProfile } | null {
  const comp = components.find((c) => isBoardType(c.type));
  return comp ? { comp, profile: BOARD_PROFILES[comp.type as BoardType] } : null;
}

/** Perfil de la placa activa (Uno por defecto si no hay ninguna). */
export function activeProfile(components: CircuitComponent[]): BoardProfile {
  return findBoard(components)?.profile ?? BOARD_PROFILES['arduino-uno'];
}

/** Opciones de menú de pines para los bloques, según la placa. */
export function pinOptions(
  profile: BoardProfile,
  kind: 'any' | 'digital' | 'pwm' | 'analog' | 'output'
): [string, string][] {
  const label = (p: BoardPin) => {
    if (profile.type === 'arduino-uno') {
      if (p.analog) return `A${p.num - 14}`;
      const suffix = p.num === 13 ? ' (LED)' : p.pwm ? ' (~PWM)' : '';
      return `${p.num}${suffix}`;
    }
    return `GPIO ${p.num}${p.num === 2 ? ' (LED)' : ''}${p.inputOnly ? ' (solo entrada)' : ''}`;
  };
  const value = (p: BoardPin) => (profile.type === 'arduino-uno' && p.analog ? `A${p.num - 14}` : String(p.num));
  let pins = profile.pins;
  if (profile.type === 'arduino-uno') {
    // El Uno oculta D0/D1 (serie) y muestra los pines en orden descendente como antes.
    pins = pins.filter((p) => p.num > 1);
  } else {
    // En el ESP32 se ocultan GPIO1/3 (serie) y se ordena numéricamente.
    pins = pins.filter((p) => p.num !== 1 && p.num !== 3).sort((a, b) => a.num - b.num);
  }
  if (kind === 'any') return pins.map((p) => [label(p), value(p)]);
  if (kind === 'analog') pins = pins.filter((p) => p.analog);
  else if (kind === 'pwm') pins = pins.filter((p) => p.pwm);
  else if (kind === 'output') pins = pins.filter((p) => !p.analog || profile.type === 'esp32').filter((p) => !p.inputOnly);
  else pins = pins.filter((p) => !p.analog || profile.type === 'esp32');
  return pins.map((p) => [label(p), value(p)]);
}
