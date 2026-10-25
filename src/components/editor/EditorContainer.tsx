/**
 * @file EditorContainer.tsx
 * @description Contenedor responsivo que integra Google Blockly, CodeMirror y Monitor Serial interactivo.
 */

import React, { useRef, useEffect } from 'react';
import type { ViewMode } from '../../types/circuit';
import { BlocklyWorkspace } from './BlocklyWorkspace';
import { CodeMirrorEditor } from './CodeMirrorEditor';
import { useSimulationStore } from '../../stores/useSimulationStore';
import { Terminal, Trash2 } from 'lucide-react';

interface EditorContainerProps {
  activeView: ViewMode;
}

export const EditorContainer: React.FC<EditorContainerProps> = ({ activeView }) => {
  const { serialLogs, clearSerialLogs } = useSimulationStore();
  const serialEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (activeView === 'serial') {
      serialEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [serialLogs, activeView]);

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
      <div className="w-full h-full bg-slate-950 flex flex-col font-mono text-xs text-emerald-400 p-3 md:p-4">
        {/* Barra de cabecera del Monitor Serial */}
        <div className="flex items-center justify-between pb-3 mb-2 border-b border-slate-800 text-slate-400 select-none shrink-0">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-emerald-400" />
            <span className="text-slate-200 font-medium">Monitor Serial (UART)</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] bg-slate-900 px-2 py-0.5 rounded border border-slate-800 text-teal-400">
              9600 baud
            </span>
            <button
              onClick={clearSerialLogs}
              className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-white px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 transition"
              title="Limpiar salida serial"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Limpiar</span>
            </button>
          </div>
        </div>

        {/* Consola de Logs */}
        <div className="flex-1 overflow-y-auto space-y-1 font-mono text-xs leading-relaxed">
          {serialLogs.map((log, index) => (
            <div key={index} className="text-emerald-300 whitespace-pre-wrap break-all">
              {log}
            </div>
          ))}
          <div ref={serialEndRef} />
        </div>
      </div>
    );
  }

  return null;
};
