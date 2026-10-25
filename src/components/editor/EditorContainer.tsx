/**
 * @file EditorContainer.tsx
 * @description Contenedor responsivo para Blockly, CodeMirror y Monitor Serial.
 */

import React from 'react';
import type { ViewMode } from '../../types/circuit';
import { Puzzle, Code2, Terminal, Copy, Check } from 'lucide-react';

interface EditorContainerProps {
  activeView: ViewMode;
  code: string;
  onChangeCode: (newCode: string) => void;
}

export const EditorContainer: React.FC<EditorContainerProps> = ({
  activeView,
  code,
  onChangeCode,
}) => {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (activeView === 'blocks') {
    return (
      <div className="w-full h-full bg-slate-900 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-4">
          <Puzzle className="w-8 h-8 text-amber-400" />
        </div>
        <h3 className="text-base font-semibold text-white mb-2">Entorno de Programación por Bloques</h3>
        <p className="text-xs text-slate-400 max-w-sm mb-4">
          Google Blockly offline se integrará en el <span className="text-amber-400 font-medium">Sprint 3</span> con traducción automática a código C++ de Arduino.
        </p>
        <div className="px-3 py-1.5 rounded-lg bg-slate-800 text-[11px] text-slate-300 font-mono">
          Listo para sincronización en tiempo real
        </div>
      </div>
    );
  }

  if (activeView === 'code') {
    return (
      <div className="w-full h-full bg-slate-950 flex flex-col font-mono text-xs">
        {/* Barra superior del editor */}
        <div className="h-10 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-4 text-slate-400 select-none">
          <div className="flex items-center gap-2">
            <Code2 className="w-4 h-4 text-teal-400" />
            <span className="text-white font-medium">sketch.ino</span>
            <span className="text-[10px] text-slate-500 bg-slate-800 px-1.5 py-0.5 rounded">C++ Arduino</span>
          </div>

          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 text-xs text-slate-300 hover:text-white px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 transition"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copiado' : 'Copiar'}</span>
          </button>
        </div>

        {/* Área de texto / editor C++ */}
        <textarea
          value={code}
          onChange={(e) => onChangeCode(e.target.value)}
          spellCheck={false}
          className="flex-1 w-full bg-slate-950 text-emerald-300 p-4 font-mono text-xs resize-none focus:outline-none focus:ring-1 focus:ring-teal-500/50 leading-relaxed"
          placeholder="// Escribe aquí tu código Arduino..."
        />
      </div>
    );
  }

  if (activeView === 'serial') {
    return (
      <div className="w-full h-full bg-black flex flex-col font-mono text-xs text-emerald-400 p-4">
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800 text-slate-400">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-emerald-400" />
            <span className="text-slate-200">Monitor Serial (UART)</span>
          </div>
          <span className="text-[11px] bg-slate-900 px-2 py-0.5 rounded border border-slate-800">9600 baud</span>
        </div>
        <div className="flex-1 overflow-y-auto space-y-1">
          <p className="text-slate-500">// Monitor Serial conectado a 9600 baudios.</p>
          <p className="text-slate-400">[AVR8js]: Simulador inicializado listo para recepción de datos.</p>
        </div>
      </div>
    );
  }

  return null;
};
