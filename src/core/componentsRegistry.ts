/**
 * @file componentsRegistry.ts
 * @description Registro y definiciones de fábrica para todos los componentes electrónicos y sus pines.
 */

import type { CircuitComponent, ComponentType, PinDefinition } from '../types/circuit';
import { BREADBOARD_SIZES, getBreadboardPins, type BreadboardSize } from './breadboard';

/**
 * Genera la definición de pines para la placa Arduino Uno R3.
 * Medidas calibradas para un ancho de 300px y alto de 200px.
 */
export function getArduinoUnoPins(): PinDefinition[] {
  const pins: PinDefinition[] = [];

  // 1. Pines Digitales Superiores (D0 a D13 + GND + AREF)
  // Distribuidos en el header superior (y = 12)
  const digitalPins = [
    { id: 'aref', name: 'AREF', type: 'passive' as const, pinNumber: 'AREF' },
    { id: 'gnd1', name: 'GND', type: 'ground' as const, pinNumber: 'GND' },
    { id: 'd13', name: '13', type: 'digital' as const, pinNumber: 13 },
    { id: 'd12', name: '12', type: 'digital' as const, pinNumber: 12 },
    { id: 'd11', name: '~11', type: 'pwm' as const, pinNumber: 11 },
    { id: 'd10', name: '~10', type: 'pwm' as const, pinNumber: 10 },
    { id: 'd9', name: '~9', type: 'pwm' as const, pinNumber: 9 },
    { id: 'd8', name: '8', type: 'digital' as const, pinNumber: 8 },
    { id: 'd7', name: '7', type: 'digital' as const, pinNumber: 7 },
    { id: 'd6', name: '~6', type: 'pwm' as const, pinNumber: 6 },
    { id: 'd5', name: '~5', type: 'pwm' as const, pinNumber: 5 },
    { id: 'd4', name: '4', type: 'digital' as const, pinNumber: 4 },
    { id: 'd3', name: '~3', type: 'pwm' as const, pinNumber: 3 },
    { id: 'd2', name: '2', type: 'digital' as const, pinNumber: 2 },
    { id: 'd1', name: 'TX>1', type: 'digital' as const, pinNumber: 1 },
    { id: 'd0', name: 'RX<0', type: 'digital' as const, pinNumber: 0 },
  ];

  digitalPins.forEach((p, idx) => {
    pins.push({
      id: p.id,
      name: p.name,
      type: p.type,
      pinNumber: p.pinNumber,
      x: 108 + idx * 11.5,
      y: 14,
    });
  });

  // 2. Pines de Potencia Inferiores (y = 186)
  const powerPins = [
    { id: 'ioref', name: 'IOREF', type: 'power' as const },
    { id: 'reset', name: 'RESET', type: 'passive' as const },
    { id: '3v3', name: '3.3V', type: 'power' as const },
    { id: '5v', name: '5V', type: 'power' as const },
    { id: 'gnd2', name: 'GND', type: 'ground' as const },
    { id: 'gnd3', name: 'GND', type: 'ground' as const },
    { id: 'vin', name: 'VIN', type: 'power' as const },
  ];

  powerPins.forEach((p, idx) => {
    pins.push({
      id: p.id,
      name: p.name,
      type: p.type,
      pinNumber: p.id.toUpperCase(),
      x: 110 + idx * 11.5,
      y: 186,
    });
  });

  // 3. Pines Analógicos Inferiores (A0 a A5) (y = 186)
  const analogPins = [
    { id: 'a0', name: 'A0', pinNumber: 'A0' },
    { id: 'a1', name: 'A1', pinNumber: 'A1' },
    { id: 'a2', name: 'A2', pinNumber: 'A2' },
    { id: 'a3', name: 'A3', pinNumber: 'A3' },
    { id: 'a4', name: 'A4', pinNumber: 'A4' },
    { id: 'a5', name: 'A5', pinNumber: 'A5' },
  ];

  analogPins.forEach((p, idx) => {
    pins.push({
      id: p.id,
      name: p.name,
      type: 'analog',
      pinNumber: p.pinNumber,
      x: 215 + idx * 11.5,
      y: 186,
    });
  });

  return pins;
}

/** Ancho y alto del dibujo de la placa ESP32. */
export const ESP32_SIZE = { width: 130, height: 260 };

/**
 * Pines de un ESP32 DevKit de 30 pines (15 por lado). Los pines GPIO usan el id `d<GPIO>`.
 */
export function getEsp32Pins(): PinDefinition[] {
  type Spec = { id: string; name: string; type: PinDefinition['type'] };
  const gpio = (n: number, name?: string): Spec => ({ id: `d${n}`, name: name ?? String(n), type: 'digital' });
  const left: Spec[] = [
    { id: 'en', name: 'EN', type: 'passive' },
    gpio(36, 'VP'), gpio(39, 'VN'), gpio(34), gpio(35), gpio(32), gpio(33), gpio(25), gpio(26), gpio(27),
    gpio(14), gpio(12),
    { id: 'gnd1', name: 'GND', type: 'ground' },
    gpio(13),
    { id: 'vin', name: 'VIN', type: 'power' },
  ];
  const right: Spec[] = [
    { id: '3v3', name: '3V3', type: 'power' },
    { id: 'gnd2', name: 'GND', type: 'ground' },
    gpio(15), gpio(2), gpio(4), gpio(16), gpio(17), gpio(5), gpio(18), gpio(19), gpio(21),
    gpio(3, 'RX0'), gpio(1, 'TX0'), gpio(22), gpio(23),
  ];
  const place = (specs: Spec[], x: number): PinDefinition[] =>
    specs.map((s, i) => ({ id: s.id, name: s.name, type: s.type, pinNumber: s.id, x, y: 40 + i * 14 }));
  return [...place(left, 10), ...place(right, ESP32_SIZE.width - 10)];
}

/**
 * Genera la configuración inicial para un nuevo componente dado su tipo.
 */
export function createComponentFactory(
  type: ComponentType,
  idSuffix?: string,
  options?: { size?: BreadboardSize }
): CircuitComponent {
  const id = `${type}-${idSuffix || Math.random().toString(36).substring(2, 7)}`;

  switch (type) {
    case 'breadboard': {
      const size = options?.size ?? 'medium';
      return {
        id,
        type: 'breadboard',
        name: `Protoboard ${BREADBOARD_SIZES[size].label.toLowerCase()}`,
        x: 40,
        y: 360,
        rotation: 0,
        pins: getBreadboardPins(size),
        properties: { size },
      };
    }

    case 'arduino-uno':
      return {
        id,
        type: 'arduino-uno',
        name: 'Arduino Uno R3',
        x: 80,
        y: 60,
        rotation: 0,
        pins: getArduinoUnoPins(),
        properties: {
          mcu: 'ATmega328P',
          clockSpeed: 16000000,
        },
      };

    case 'led':
      return {
        id,
        type: 'led',
        name: 'LED Rojo',
        x: 420,
        y: 70,
        rotation: 0,
        pins: [
          { id: 'anode', name: 'Ánodo (+)', type: 'passive', x: 22, y: 56 },
          { id: 'cathode', name: 'Cátodo (-)', type: 'ground', x: 38, y: 56 },
        ],
        properties: {
          color: '#EF4444', // Rojo Tailwind
          isOn: false,
          forwardVoltage: 2.0,
        },
      };

    case 'resistor':
      return {
        id,
        type: 'resistor',
        name: 'Resistencia 220Ω',
        x: 420,
        y: 160,
        rotation: 0,
        pins: [
          { id: 'pin1', name: 'Pin 1', type: 'passive', x: 10, y: 20 },
          { id: 'pin2', name: 'Pin 2', type: 'passive', x: 70, y: 20 },
        ],
        properties: {
          resistance: 220,
        },
      };

    case 'pushbutton':
      return {
        id,
        type: 'pushbutton',
        name: 'Pulsador',
        x: 420,
        y: 230,
        rotation: 0,
        pins: [
          { id: 'pin1', name: 'Pin 1', type: 'passive', x: 12, y: 24 },
          { id: 'pin2', name: 'Pin 2', type: 'passive', x: 48, y: 24 },
        ],
        properties: {
          isPressed: false,
        },
      };

    case 'servo-sg90':
      return {
        id,
        type: 'servo-sg90',
        name: 'Micro Servo SG90',
        x: 520,
        y: 60,
        rotation: 0,
        pins: [
          { id: 'gnd', name: 'GND (Marrón)', type: 'ground', x: 20, y: 84 },
          { id: 'vcc', name: '5V (Rojo)', type: 'power', x: 35, y: 84 },
          { id: 'pwm', name: 'PWM (Naranja)', type: 'pwm', x: 50, y: 84 },
        ],
        properties: {
          angle: 90, // Grados (0 a 180)
        },
      };

    case 'ultrasonic-hcsr04':
      return {
        id,
        type: 'ultrasonic-hcsr04',
        name: 'Sensor HC-SR04',
        x: 520,
        y: 180,
        rotation: 0,
        pins: [
          { id: 'vcc', name: 'VCC', type: 'power', x: 25, y: 65 },
          { id: 'trig', name: 'TRIG', type: 'digital', x: 40, y: 65 },
          { id: 'echo', name: 'ECHO', type: 'digital', x: 55, y: 65 },
          { id: 'gnd', name: 'GND', type: 'ground', x: 70, y: 65 },
        ],
        properties: {
          distanceCm: 25,
        },
      };

    case 'potentiometer':
      return {
        id,
        type: 'potentiometer',
        name: 'Potenciómetro 10k',
        x: 420,
        y: 310,
        rotation: 0,
        pins: [
          { id: 'vcc', name: '1 (VCC)', type: 'power', x: 15, y: 55 },
          { id: 'wiper', name: 'Wiper (A)', type: 'analog', x: 35, y: 55 },
          { id: 'gnd', name: '2 (GND)', type: 'ground', x: 55, y: 55 },
        ],
        properties: {
          value: 512, // 0 a 1023
          maxResistance: 10000,
        },
      };

    case 'buzzer':
      return {
        id,
        type: 'buzzer',
        name: 'Buzzer',
        x: 520,
        y: 310,
        rotation: 0,
        pins: [
          { id: 'pos', name: 'Positivo (+)', type: 'power', x: 18, y: 64 },
          { id: 'neg', name: 'Negativo (-)', type: 'ground', x: 42, y: 64 },
        ],
        properties: {
          sounding: false,
        },
      };

    case 'battery':
      return {
        id,
        type: 'battery',
        name: 'Batería',
        x: 320,
        y: 260,
        rotation: 0,
        pins: [
          { id: 'pos', name: 'Positivo (+)', type: 'power', x: 18, y: 12 },
          { id: 'neg', name: 'Negativo (-)', type: 'ground', x: 42, y: 12 },
        ],
        properties: {
          voltage: 9,
        },
      };

    case 'esp32':
      return {
        id,
        type: 'esp32',
        name: 'ESP32 DevKit',
        x: 80,
        y: 40,
        rotation: 0,
        pins: getEsp32Pins(),
        properties: { mcu: 'ESP32-WROOM-32', clockSpeed: 240000000 },
      };

    case 'switch':
      return {
        id,
        type: 'switch',
        name: 'Interruptor',
        x: 420,
        y: 230,
        rotation: 0,
        pins: [
          { id: 'pin1', name: 'Pin 1', type: 'passive', x: 12, y: 30 },
          { id: 'pin2', name: 'Pin 2', type: 'passive', x: 68, y: 30 },
        ],
        properties: { closed: false },
      };

    case 'ldr':
      return {
        id,
        type: 'ldr',
        name: 'Fotorresistencia (LDR)',
        x: 420,
        y: 310,
        rotation: 0,
        pins: [
          { id: 'pin1', name: 'Pin 1', type: 'passive', x: 22, y: 64 },
          { id: 'pin2', name: 'Pin 2', type: 'passive', x: 48, y: 64 },
        ],
        properties: { light: 60 },
      };

    case 'multimeter':
      return {
        id,
        type: 'multimeter',
        name: 'Multímetro',
        x: 520,
        y: 400,
        rotation: 0,
        pins: [
          { id: 'red', name: 'Punta roja (V+)', type: 'power', x: 30, y: 96 },
          { id: 'black', name: 'Punta negra (COM)', type: 'ground', x: 70, y: 96 },
        ],
        properties: {},
      };

    default:
      return {
        id,
        type,
        name: String(type).toUpperCase(),
        x: 400,
        y: 100,
        rotation: 0,
        pins: [
          { id: 'p1', name: 'Pin 1', type: 'passive', x: 10, y: 20 },
          { id: 'p2', name: 'Pin 2', type: 'passive', x: 40, y: 20 },
        ],
        properties: {},
      };
  }
}
