/**
 * @file useSimulationStore.ts
 * @description Store de Zustand para el estado de ejecución, registros de simulación y logs del Monitor Serial.
 */

import { create } from 'zustand';

interface SimulationStoreState {
  isRunning: boolean;
  serialLogs: string[];
  fps: number;
  setIsRunning: (running: boolean) => void;
  addSerialLog: (text: string) => void;
  clearSerialLogs: () => void;
  setFps: (fps: number) => void;
}

export const useSimulationStore = create<SimulationStoreState>((set) => ({
  isRunning: false,
  serialLogs: [
    '// Monitor Serial iniciado a 9600 baudios.',
    '[AVR8js ATmega328P]: Emulador listo para ejecución de código.',
  ],
  fps: 60,
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
