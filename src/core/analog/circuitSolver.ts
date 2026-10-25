/**
 * @file circuitSolver.ts
 * @description Motor de resolución de circuitos eléctricos y análisis nodal de potenciales para componentes.
 */

import type { CircuitComponent, WireConnection } from '../../types/circuit';
import type { PinStateMap } from '../avr/avrRunner';

interface NodeVoltage {
  voltage: number;
  isDefined: boolean;
}

/**
 * Resuelve los potenciales eléctricos (voltajes) en cada pin y determina el estado de componentes
 * como LEDs, pulsadores y sensores basándose en física de circuitos real.
 */
export function solveCircuitPhysics(
  components: CircuitComponent[],
  wires: WireConnection[],
  pinStates: PinStateMap
): { ledStates: Record<string, boolean>; servoAngles: Record<string, number> } {
  const ledStates: Record<string, boolean> = {};
  const servoAngles: Record<string, number> = {};

  const arduino = components.find((c) => c.type === 'arduino-uno');
  if (!arduino) {
    return { ledStates, servoAngles };
  }

  /**
   * Obtiene el potencial eléctrico de un pin de Arduino (en Voltios).
   */
  function getArduinoPinVoltage(pinId: string, pinName?: string): NodeVoltage {
    const id = (pinId || '').toLowerCase();
    const name = (pinName || '').toUpperCase();

    // 1. Pines de Referencia Fija
    if (id.includes('gnd') || name.includes('GND')) {
      return { voltage: 0.0, isDefined: true };
    }
    if (id === '5v' || name === '5V') {
      return { voltage: 5.0, isDefined: true };
    }
    if (id === '3v3' || name.includes('3.3V')) {
      return { voltage: 3.3, isDefined: true };
    }

    // 2. Pines Digitales (D0 a D13)
    let pinNum = id.replace('d', '');
    if (pinStates[pinNum]) {
      const state = pinStates[pinNum];
      if (state.mode === 'OUTPUT') {
        return { voltage: state.isHigh ? 5.0 : 0.0, isDefined: true };
      }
      if (state.mode === 'INPUT_PULLUP') {
        return { voltage: 5.0, isDefined: true };
      }
    }

    // Pin 13 por defecto
    if (id === 'd13' && pinStates['13']) {
      return { voltage: pinStates['13'].isHigh ? 5.0 : 0.0, isDefined: true };
    }

    // Circuito abierto o pin no conducido
    return { voltage: 0.0, isDefined: false };
  }

  /**
   * Rastrear hacia qué potencial está conectado un pin de un componente a través de cables
   * y posibles resistencias en serie.
   */
  function traceNetVoltage(
    startComponentId: string,
    startPinId: string,
    visited = new Set<string>()
  ): NodeVoltage {
    const key = `${startComponentId}:${startPinId}`;
    if (visited.has(key)) {
      return { voltage: 0.0, isDefined: false };
    }
    visited.add(key);

    // Buscar cables conectados a este pin
    const connectedWires = wires.filter(
      (w) =>
        (w.fromComponentId === startComponentId && w.fromPinId === startPinId) ||
        (w.toComponentId === startComponentId && w.toPinId === startPinId)
    );

    for (const wire of connectedWires) {
      const otherCompId = wire.fromComponentId === startComponentId ? wire.toComponentId : wire.fromComponentId;
      const otherPinId = wire.fromComponentId === startComponentId ? wire.toPinId : wire.fromPinId;
      const otherComp = components.find((c) => c.id === otherCompId);
      if (!otherComp) continue;

      // Si el otro extremo es el Arduino Uno, resolvemos el voltaje del pin
      if (otherComp.type === 'arduino-uno') {
        const pinDef = otherComp.pins.find((p) => p.id === otherPinId);
        const nodeV = getArduinoPinVoltage(otherPinId, pinDef?.name);
        if (nodeV.isDefined) {
          return nodeV;
        }
      }

      // Si el otro extremo es una Resistencia, propagamos hacia su otro terminal
      if (otherComp.type === 'resistor') {
        const resistorOtherPin = otherPinId === 'pin1' ? 'pin2' : 'pin1';
        const throughResistor = traceNetVoltage(otherComp.id, resistorOtherPin, visited);
        if (throughResistor.isDefined) {
          return throughResistor;
        }
      }
    }

    return { voltage: 0.0, isDefined: false };
  }

  // Evaluar cada LED del circuito
  components.filter((c) => c.type === 'led').forEach((led) => {
    const anodeVoltage = traceNetVoltage(led.id, 'anode');
    const cathodeVoltage = traceNetVoltage(led.id, 'cathode');

    // Regla de Física de Diodo:
    // 1. Ambos terminales deben estar conectados a nodos definidos (circuito cerrado).
    // 2. La diferencia de potencial (V_anode - V_cathode) debe superar el umbral de conducción directa (aprox 1.8V).
    // 3. Si Ánodo y Cátodo están a la misma tensión (ej: 5V y 5V, o GND y GND), V_drop = 0V -> APAGADO.
    // 4. Si Ánodo < Cátodo (polarización inversa, ej: Ánodo a 0V y Cátodo a 5V) -> APAGADO.
    if (anodeVoltage.isDefined && cathodeVoltage.isDefined) {
      const drop = anodeVoltage.voltage - cathodeVoltage.voltage;
      const forwardThreshold = 1.8; // Voltaje umbral de LED rojo/estándar
      ledStates[led.id] = drop >= forwardThreshold;
    } else {
      // Circuito abierto: falta conectar ánodo o cátodo
      ledStates[led.id] = false;
    }
  });

  // Evaluar Servos SG90
  components.filter((c) => c.type === 'servo-sg90').forEach((servo) => {
    // Buscar cable conectado al pin PWM del servo
    const pwmWire = wires.find(
      (w) =>
        (w.fromComponentId === servo.id && w.fromPinId === 'pwm') ||
        (w.toComponentId === servo.id && w.toPinId === 'pwm')
    );

    if (pwmWire) {
      const otherCompId = pwmWire.fromComponentId === servo.id ? pwmWire.toComponentId : pwmWire.fromComponentId;
      const otherPinId = pwmWire.fromComponentId === servo.id ? pwmWire.toPinId : pwmWire.fromPinId;
      const otherComp = components.find((c) => c.id === otherCompId);

      if (otherComp && otherComp.type === 'arduino-uno') {
        const pinNum = otherPinId.replace('d', '');
        if (pinStates[pinNum]) {
          servoAngles[servo.id] = pinStates[pinNum].value;
        }
      }
    }
  });

  return { ledStates, servoAngles };
}
