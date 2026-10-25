/**
 * @file Header.tsx
 * @description Barra superior táctil con controles principales de simulación, estado offline y guardado.
 */

import React from 'react';
import { Play, Square, Download, FolderOpen, WifiOff, Cpu, RefreshCw } from 'lucide-react';

interface HeaderProps {
  isRunning: boolean;
  onToggleRun: () => void;
  onReset: () => void;
  onExport: () => void;
  onImport: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  isRunning,
  onToggleRun,
  onReset,
  onExport,
  onImport,
}) => {
  return (
    <header className="h-14 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-3 md:px-5 select-none shrink-0 z-30">
      {/* Logotipo e Identidad */}
      <div className="flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-xl bg-arduino-teal flex items-center justify-center shadow-lg shadow-teal-500/20">
          <Cpu className="w-5 h-5 text-white" />
        </div>
        <div className="hidden sm:block">
          <h1 className="text-sm font-bold tracking-tight text-white flex items-center gap-1.5">
            Arduino Sim <span className="text-[10px] bg-teal-500/20 text-teal-300 px-1.5 py-0.5 rounded-full font-mono uppercase font-semibold">PWA</span>
          </h1>
          <p className="text-[11px] text-slate-400">Simulador de Circuitos & Código</p>
        </div>
      </div>

      {/* Controles de Simulación (Centro) */}
      <div className="flex items-center gap-2">
        <button
          onClick={onToggleRun}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg font-medium text-xs md:text-sm transition-all shadow-md active:scale-95 ${
            isRunning
              ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-600/30'
              : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30'
          }`}
          title={isRunning ? "Pausar Simulación" : "Iniciar Simulación"}
        >
          {isRunning ? <Square className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
          <span>{isRunning ? 'Detener' : 'Iniciar'}</span>
        </button>

        <button
          onClick={onReset}
          className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition active:scale-95 border border-slate-700"
          title="Reiniciar Simulación"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Acciones Secundarias y Estado Offline */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800/80 border border-slate-700 text-[11px] text-teal-400 font-mono">
          <WifiOff className="w-3.5 h-3.5 text-teal-400" />
          <span>Offline Listo</span>
        </div>

        <button
          onClick={onImport}
          className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition active:scale-95 border border-slate-700"
          title="Abrir Proyecto (.json)"
        >
          <FolderOpen className="w-4 h-4" />
        </button>

        <button
          onClick={onExport}
          className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition active:scale-95 border border-slate-700"
          title="Exportar Proyecto (.json / .ino)"
        >
          <Download className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
