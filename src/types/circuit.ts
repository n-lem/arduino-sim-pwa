/**
 * @file circuit.ts
 * @description Definición de tipos y contratos para componentes electrónicos, pines y conexiones.
 */

export type ComponentType = 
  | 'arduino-uno'
  | 'led'
  | 'resistor'
  | 'pushbutton'
  | 'servo-sg90'
  | 'ultrasonic-hcsr04'
  | 'potentiometer'
  | 'buzzer'
  | 'battery';

export type PinType = 'digital' | 'analog' | 'power' | 'ground' | 'pwm' | 'passive';

export interface PinDefinition {
  id: string;
  name: string;
  type: PinType;
  /** Coordenadas relativas en píxeles respecto al origen del componente */
  x: number;
  y: number;
  /** Número de pin en Arduino o identificador eléctrico */
  pinNumber?: number | string;
}

export interface CircuitComponent {
  id: string;
  type: ComponentType;
  name: string;
  x: number;
  y: number;
  rotation: number;
  pins: PinDefinition[];
  /** Parámetros específicos (resistencia en ohms, color de led, etc.) */
  properties: Record<string, any>;
}

export interface WireConnection {
  id: string;
  fromComponentId: string;
  fromPinId: string;
  toComponentId: string;
  toPinId: string;
  color: string;
}

export type ViewMode = 'circuit' | 'blocks' | 'code' | 'serial';
