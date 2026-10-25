/**
 * @file useCodeStore.ts
 * @description Store de Zustand para la sincronización de código C++ y bloques de Blockly.
 */

import { create } from 'zustand';

interface CodeStoreState {
  code: string;
  blocklyXml: string | null;
  isSyncedWithBlocks: boolean;
  setCode: (code: string) => void;
  setBlocklyXml: (xml: string) => void;
  setSyncedWithBlocks: (synced: boolean) => void;
}

const DEFAULT_INITIAL_SKETCH = `// Sketch de Arduino Uno
void setup() {
  pinMode(13, OUTPUT);
}

void loop() {
  digitalWrite(13, HIGH);
  delay(1000);
  digitalWrite(13, LOW);
  delay(1000);
}
`;

export const useCodeStore = create<CodeStoreState>((set) => ({
  code: DEFAULT_INITIAL_SKETCH,
  blocklyXml: null,
  isSyncedWithBlocks: true,
  setCode: (code) => set({ code }),
  setBlocklyXml: (blocklyXml) => set({ blocklyXml }),
  setSyncedWithBlocks: (isSyncedWithBlocks) => set({ isSyncedWithBlocks }),
}));
