/**
 * @file useSimulationLoop.ts
 * @description Hook de negocio que acopla el intérprete del sketch con el solver eléctrico y el circuito.
 * Los pines de salida del sketch alimentan al solver; las tensiones resultantes vuelven al sketch
 * como lecturas de digitalRead/analogRead/pulseIn y a los componentes como estado visual.
 */

import { useEffect, useRef } from 'react';
import { avrSimulator } from '../core/avr/avrRunner';
import { solveCircuitPhysics } from '../core/analog/circuitSolver';
import { useCircuitStore } from '../stores/useCircuitStore';
import { useSimulationStore } from '../stores/useSimulationStore';
import { useCodeStore } from '../stores/useCodeStore';

import { activeProfile } from '../core/boards';
import { playTone, stopTone, unlockAudio } from '../core/audio';

/** Fracción de la tensión lógica a partir de la cual una entrada se lee como HIGH. */
const LOGIC_HIGH_FRACTION = 0.5;

export function useSimulationLoop() {
  const { isRunning, setIsRunning, addSerialLog, setWarnings, setMeasurements, setToneFreq } = useSimulationStore();
  const { components, wires, updateComponentProperty } = useCircuitStore();
  const { code } = useCodeStore();
  const buzzerOn = useSimulationStore((s) => s.buzzerOn);
  const toneFreq = useSimulationStore((s) => s.toneFreq);

  // Sonido: el buzzer suena con tone() si lo hay o, si no, con un tono fijo de buzzer activo.
  useEffect(() => {
    const anyOn = Object.values(buzzerOn).some(Boolean);
    if (isRunning && anyOn) playTone(toneFreq > 0 ? toneFreq : 2000);
    else stopTone();
    return () => stopTone();
  }, [isRunning, buzzerOn, toneFreq]);

  const componentsRef = useRef(components);
  const wiresRef = useRef(wires);

  useEffect(() => {
    componentsRef.current = components;
    wiresRef.current = wires;
  }, [components, wires]);

  /** Resuelve el circuito y propaga el resultado a los componentes y al microcontrolador. */
  const evaluatePhysics = () => {
    const current = componentsRef.current;
    const profile = activeProfile(current);
    const result = solveCircuitPhysics(current, wiresRef.current, avrSimulator.pinStates);

    const setIfChanged = (id: string, prop: string, value: unknown) => {
      const comp = current.find((c) => c.id === id);
      if (comp && comp.properties[prop] !== value) updateComponentProperty(id, prop, value);
    };

    for (const led of current.filter((c) => c.type === 'led')) {
      setIfChanged(led.id, 'isOn', Boolean(result.ledStates[led.id]));
      setIfChanged(led.id, 'current', Math.round(result.ledCurrents[led.id] ?? 0));
      if (result.burnedLeds.includes(led.id)) setIfChanged(led.id, 'burned', true);
    }

    for (const servo of current.filter((c) => c.type === 'servo-sg90')) {
      setIfChanged(servo.id, 'powered', Boolean(result.servoPowered[servo.id]));
      if (result.servoAngles[servo.id] !== undefined) setIfChanged(servo.id, 'angle', result.servoAngles[servo.id]);
    }

    for (const [pin, state] of Object.entries(avrSimulator.pinStates)) {
      if (state.mode === 'OUTPUT') continue;
      const volts = result.pinVoltages[pin] ?? 0;
      avrSimulator.setExternalInput(pin, volts >= profile.logicVolts * LOGIC_HIGH_FRACTION);
      avrSimulator.setAnalogInput(pin, (volts / profile.logicVolts) * profile.adcMax);
    }
    for (const [pin, micros] of Object.entries(result.pulseMicros)) avrSimulator.setPulseInput(pin, micros);

    setWarnings(result.warnings);
    setMeasurements(result.measurements, result.buzzerOn);
  };

  useEffect(() => {
    avrSimulator.setSerialListener((text) => addSerialLog(text));
    avrSimulator.setErrorListener((msg) => {
      addSerialLog(`⚠ ${msg}\n`);
      setIsRunning(false);
    });
    avrSimulator.setPinListener(() => evaluatePhysics());
    let toneTimer: ReturnType<typeof setTimeout> | undefined;
    avrSimulator.setToneListener((_pin, freq, durationMs) => {
      clearTimeout(toneTimer);
      setToneFreq(freq);
      if (freq > 0 && durationMs > 0) toneTimer = setTimeout(() => setToneFreq(0), durationMs);
    });
  }, [addSerialLog, updateComponentProperty, setIsRunning, setToneFreq]);

  // Si el usuario cambia cables o componentes (p. ej. presiona un pulsador) mientras corre, re-evaluar.
  useEffect(() => {
    if (isRunning) evaluatePhysics();
  }, [wires, components, isRunning]);

  // Inicio, detención o cambio de código
  useEffect(() => {
    if (isRunning) {
      // Una nueva corrida repara los componentes quemados en la corrida anterior.
      const burned = componentsRef.current.filter((c) => c.type === 'led' && c.properties.burned);
      burned.forEach((c) => updateComponentProperty(c.id, 'burned', false));
      componentsRef.current = componentsRef.current.map((c) =>
        burned.includes(c) ? { ...c, properties: { ...c.properties, burned: false } } : c
      );
      avrSimulator.clearExternalInputs();
      avrSimulator.setBoard(activeProfile(componentsRef.current));
      avrSimulator.startSketch(code);
      evaluatePhysics();
    } else {
      avrSimulator.stop();
      setWarnings([]);
      setMeasurements({}, {});
      componentsRef.current.forEach((c) => {
        if (c.type !== 'led') return;
        if (c.properties.isOn) updateComponentProperty(c.id, 'isOn', false);
        if (c.properties.current) updateComponentProperty(c.id, 'current', 0);
      });
    }

    return () => {
      avrSimulator.stop();
    };
  }, [isRunning, code]);

  return {
    isRunning,
    toggleRun: () => {
      if (!isRunning) unlockAudio();
      setIsRunning(!isRunning);
    },
    resetSimulation: () => {
      setIsRunning(false);
      avrSimulator.reset();
      avrSimulator.clearExternalInputs();
      setWarnings([]);
      componentsRef.current.forEach((c) => {
        if (c.type !== 'led') return;
        updateComponentProperty(c.id, 'isOn', false);
        updateComponentProperty(c.id, 'current', 0);
        updateComponentProperty(c.id, 'burned', false);
      });
    },
  };
}
