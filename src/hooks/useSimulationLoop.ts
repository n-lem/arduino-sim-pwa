/**
 * @file useSimulationLoop.ts
 * @description Hook de negocio que acopla el emulador AVR8js con los componentes del lienzo y cables.
 */

import { useEffect, useRef } from 'react';
import { avrSimulator } from '../core/avr/avrRunner';
import { useCircuitStore } from '../stores/useCircuitStore';
import { useSimulationStore } from '../stores/useSimulationStore';
import { useCodeStore } from '../stores/useCodeStore';

export function useSimulationLoop() {
  const { isRunning, setIsRunning, addSerialLog } = useSimulationStore();
  const { components, wires, updateComponentProperty } = useCircuitStore();
  const { code } = useCodeStore();

  const componentsRef = useRef(components);
  const wiresRef = useRef(wires);

  useEffect(() => {
    componentsRef.current = components;
    wiresRef.current = wires;
  }, [components, wires]);

  useEffect(() => {
    // Configurar listener para transmitir logs del UART al Monitor Serial
    avrSimulator.setSerialListener((text) => {
      addSerialLog(text);
    });

    // Configurar listener de pines del Arduino Uno hacia los componentes del lienzo
    avrSimulator.setPinListener((pinName, isHigh, value) => {
      const currentWires = wiresRef.current;
      const currentComponents = componentsRef.current;

      const arduino = currentComponents.find((c) => c.type === 'arduino-uno');
      if (!arduino) return;

      // Buscar el pin de Arduino correspondiente (ej. d13, d12, o por pinNumber)
      const arduinoPin = arduino.pins.find(
        (p) => p.name.includes(pinName) || p.id === `d${pinName}` || p.pinNumber?.toString() === pinName
      );
      if (!arduinoPin) return;

      // Buscar todos los cables que conecten este pin de Arduino con otros componentes
      const connectedWires = currentWires.filter(
        (w) =>
          (w.fromComponentId === arduino.id && w.fromPinId === arduinoPin.id) ||
          (w.toComponentId === arduino.id && w.toPinId === arduinoPin.id)
      );

      for (const wire of connectedWires) {
        const targetCompId = wire.fromComponentId === arduino.id ? wire.toComponentId : wire.fromComponentId;
        const targetPinId = wire.fromComponentId === arduino.id ? wire.toPinId : wire.fromPinId;
        const targetComp = currentComponents.find((c) => c.id === targetCompId);
        if (!targetComp) continue;

        // 1. Control de LED (Ánodo conectado a pin de Arduino)
        if (targetComp.type === 'led') {
          if (targetPinId === 'anode') {
            updateComponentProperty(targetComp.id, 'isOn', isHigh);
          }
        }

        // 2. Control de Servomotor SG90 (Pin PWM)
        if (targetComp.type === 'servo-sg90') {
          if (targetPinId === 'pwm') {
            const angle = Math.max(0, Math.min(180, value));
            updateComponentProperty(targetComp.id, 'angle', angle);
          }
        }
      }
    });
  }, [addSerialLog, updateComponentProperty]);

  // Manejo de inicio y detención de la simulación
  useEffect(() => {
    if (isRunning) {
      avrSimulator.startSketch(code);
    } else {
      avrSimulator.stop();
      // Apagar todos los actuadores visuales al detener
      components.forEach((c) => {
        if (c.type === 'led' && c.properties.isOn) {
          updateComponentProperty(c.id, 'isOn', false);
        }
      });
    }

    return () => {
      avrSimulator.stop();
    };
  }, [isRunning, code]);

  return {
    isRunning,
    toggleRun: () => setIsRunning(!isRunning),
    resetSimulation: () => {
      setIsRunning(false);
      avrSimulator.reset();
    },
  };
}
