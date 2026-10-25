/**
 * @file EditorContainer.tsx
 * @description Contenedor responsivo que integra Google Blockly, CodeMirror y Monitor Serial.
 */

import React from 'react';
import type { ViewMode } from '../../types/circuit';
import { BlocklyWorkspace } from './BlocklyWorkspace';
import { CodeMirrorEditor } from './CodeMirrorEditor';
import { Terminal } from 'lucide-react';

interface EditorContainerProps {
  activeView: ViewMode;
}

export const EditorContainer: React.FC<EditorContainerProps> = ({ activeView }) => {
  if (activeView === 'blocks') {
    return (
      <div className="w-full h-full relative">
        <BlocklyWorkspace />
      </div>
    );
  }

  if (activeView === 'code') {
    return (
      <div className="w-full h-full relative">
        <CodeMirrorEditor />
      </div>
    );
  }

  if (activeView === 'serial') {
    return (
      <div className="w-full h-full bg-slate-950 flex flex-col font-mono text-xs text-emerald-400 p-4">
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800 text-slate-400">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-emerald-400" />
            <span className="text-slate-200">Monitor Serial (UART)</span>
          </div>
          <span className="text-[11px] bg-slate-900 px-2 py-0.5 rounded border border-slate-800 text-teal-400">
            9600 baud
          </span>
        </div>
        <div className="flex-1 overflow-y-auto space-y-1">
          <p className="text-slate-500">// Monitor Serial listo.</p>
          <p className="text-slate-400">[AVR8js UART]: Esperando ejecución de la simulación para transmitir datos...</p>
        </div>
      </div>
    );
  }

  return null;
};
