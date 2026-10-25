/**
 * @file useSimulationLoop.ts
 * @description Hook de negocio que acopla el emulador AVR8js con el solver de física eléctrica y el circuito.
 */

import { useEffect, useRef } from 'react';
import { avrSimulator } from '../core/avr/avrRunner';
import { solveCircuitPhysics } from '../core/analog/circuitSolver';
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

  // Función para re-evaluar la física eléctrica completa del circuito
  const evaluatePhysics = () => {
    const currentComponents = componentsRef.current;
    const currentWires = wiresRef.current;

    const { ledStates, servoAngles } = solveCircuitPhysics(
      currentComponents,
      currentWires,
      avrSimulator.pinStates
    );

    // Actualizar LEDs según diferencia de potencial real (Ánodo > Cátodo >= 1.8V)
    currentComponents.filter((c) => c.type === 'led').forEach((led) => {
      const shouldBeOn = Boolean(ledStates[led.id]);
      if (led.properties.isOn !== shouldBeOn) {
        updateComponentProperty(led.id, 'isOn', shouldBeOn);
      }
    });

    // Actualizar Servomotores
    currentComponents.filter((c) => c.type === 'servo-sg90').forEach((servo) => {
      if (servoAngles[servo.id] !== undefined) {
        updateComponentProperty(servo.id, 'angle', servoAngles[servo.id]);
      }
    });
  };

  useEffect(() => {
    // Escuchar salida serie del UART
    avrSimulator.setSerialListener((text) => {
      addSerialLog(text);
    });

    // Escuchar cambios de pines y resolver física de circuito en tiempo real
    avrSimulator.setPinListener(() => {
      evaluatePhysics();
    });
  }, [addSerialLog, updateComponentProperty]);

  // Si el usuario agrega o quita cables mientras corre la simulación, re-evaluar inmediatamente
  useEffect(() => {
    if (isRunning) {
      evaluatePhysics();
    }
  }, [wires, components, isRunning]);

  // Manejo de inicio, reinicio o cambio de código
  useEffect(() => {
    if (isRunning) {
      avrSimulator.startSketch(code);
      evaluatePhysics();
    } else {
      avrSimulator.stop();
      // Apagar todos los LEDs al detener
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
      components.forEach((c) => {
        if (c.type === 'led') updateComponentProperty(c.id, 'isOn', false);
      });
    },
  };
}
