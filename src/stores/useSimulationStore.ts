/**
 * @file useSimulationStore.ts
 * @description Store de Zustand para el estado de ejecución, registros de simulación y logs del Monitor Serial.
 */

import { create } from 'zustand';

interface SimulationStoreState {
  isRunning: boolean;
  serialLogs: string[];
  /** Avisos del solver (cortocircuitos, LED quemado...). */
  warnings: string[];
  /** Tensión (V) y corriente (mA) por componente, calculadas por el solver. */
  measurements: Record<string, { volts: number; milliamps: number }>;
  /** Buzzers sonando. */
  buzzerOn: Record<string, boolean>;
  setMeasurements: (m: Record<string, { volts: number; milliamps: number }>, buzzers: Record<string, boolean>) => void;
  /** Frecuencia activa de tone() en Hz (0 = sin tono). */
  toneFreq: number;
  setToneFreq: (freq: number) => void;
  fps: number;
  setIsRunning: (running: boolean) => void;
  setWarnings: (warnings: string[]) => void;
  addSerialLog: (text: string) => void;
  clearSerialLogs: () => void;
  setFps: (fps: number) => void;
}

export const useSimulationStore = create<SimulationStoreState>((set) => ({
  isRunning: false,
  serialLogs: [
    '// Monitor Serial iniciado a 9600 baudios.',
    '[Intérprete]: Listo. Presioná Iniciar para ejecutar el código.',
  ],
  fps: 60,
  toneFreq: 0,
  setToneFreq: (toneFreq) => set((state) => (state.toneFreq === toneFreq ? state : { toneFreq })),
  warnings: [],
  measurements: {},
  buzzerOn: {},
  setMeasurements: (measurements, buzzerOn) => {
    // Se redondea para no re-renderizar por cambios imperceptibles.
    const round = (n: number) => Math.round(n * 100) / 100;
    const next: Record<string, { volts: number; milliamps: number }> = {};
    for (const [id, m] of Object.entries(measurements)) next[id] = { volts: round(m.volts), milliamps: round(m.milliamps) };
    set((state) =>
      JSON.stringify(state.measurements) === JSON.stringify(next) && JSON.stringify(state.buzzerOn) === JSON.stringify(buzzerOn)
        ? state
        : { measurements: next, buzzerOn }
    );
  },
  setWarnings: (warnings) =>
    set((state) => (state.warnings.join('|') === warnings.join('|') ? state : { warnings })),
  setIsRunning: (isRunning) => set({ isRunning }),
  addSerialLog: (text) =>
    set((state) => ({
      serialLogs: [...state.serialLogs, text].slice(-100), // Mantener últimos 100 logs
    })),
  clearSerialLogs: () =>
    set({
      serialLogs: ['// Monitor Serial reiniciado.'],
    }),
  setFps: (fps) => set({ fps }),
}));
