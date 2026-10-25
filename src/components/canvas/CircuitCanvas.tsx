/**
 * @file CircuitCanvas.tsx
 * @description Lienzo interactivo optimizado para móviles y pantallas táctiles con sistema grid.
 */

import React, { useState } from 'react';
import { ComponentPalette } from './ComponentPalette';
import type { CircuitComponent, ComponentType } from '../../types/circuit';
import { ZoomIn, ZoomOut, RotateCcw, Info } from 'lucide-react';

interface CircuitCanvasProps {
  isRunning: boolean;
}

export const CircuitCanvas: React.FC<CircuitCanvasProps> = ({ isRunning }) => {
  // Lista inicial con un Arduino Uno colocado en el centro del lienzo
  const [components, setComponents] = useState<CircuitComponent[]>([
    {
      id: 'arduino-1',
      type: 'arduino-uno',
      name: 'Arduino Uno R3',
      x: 120,
      y: 80,
      rotation: 0,
      pins: [],
      properties: {}
    }
  ]);

  const [zoom, setZoom] = useState(1);

  const handleAddComponent = (type: ComponentType) => {
    const newComp: CircuitComponent = {
      id: `${type}-${Date.now()}`,
      type,
      name: type.toUpperCase(),
      x: 100 + (components.length * 20) % 200,
      y: 120 + (components.length * 20) % 200,
      rotation: 0,
      pins: [],
      properties: {}
    };
    setComponents([...components, newComp]);
  };

  return (
    <div className="relative w-full h-full bg-slate-950 overflow-hidden flex flex-col">
      {/* Fondo de Cuadrícula / Grid de ingeniería */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage: `
            radial-gradient(circle at 1px 1px, #38bdf8 1px, transparent 0)
          `,
          backgroundSize: '24px 24px',
          transform: `scale(${zoom})`,
          transformOrigin: '0 0'
        }}
      />

      {/* Barra de herramientas flotante del lienzo (Zoom y Centrado) */}
      <div className="absolute top-3 right-3 z-20 flex flex-col gap-1.5 bg-slate-900/80 backdrop-blur border border-slate-800 p-1.5 rounded-xl shadow-lg">
        <button
          onClick={() => setZoom(prev => Math.min(prev + 0.15, 2))}
          className="p-2 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition active:scale-95"
          title="Acercar (Zoom In)"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={() => setZoom(prev => Math.max(prev - 0.15, 0.5))}
          className="p-2 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition active:scale-95"
          title="Alejar (Zoom Out)"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          onClick={() => setZoom(1)}
          className="p-2 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition active:scale-95"
          title="Restablecer vista"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Banner de Estado Táctil Informativo */}
      <div className="absolute top-3 left-3 z-20 flex items-center gap-2 bg-slate-900/90 backdrop-blur border border-slate-800/80 px-3 py-1.5 rounded-xl text-xs text-slate-300 shadow-md">
        <Info className="w-3.5 h-3.5 text-arduino-teal shrink-0" />
        <span className="hidden sm:inline">Modo Táctil: </span>
        <span className="text-teal-400 font-medium">Tocar un pin de origen y luego tocar el destino para cablear</span>
      </div>

      {/* Espacio de Renderizado de Componentes (Placeholder interactivo) */}
      <div 
        className="w-full h-full relative"
        style={{ transform: `scale(${zoom})`, transformOrigin: 'top left' }}
      >
        {components.map((comp) => (
          <div
            key={comp.id}
            style={{ left: `${comp.x}px`, top: `${comp.y}px` }}
            className={`absolute select-none p-4 rounded-xl border-2 transition-shadow shadow-xl flex flex-col items-center justify-center cursor-pointer ${
              comp.type === 'arduino-uno'
                ? 'w-72 h-48 bg-teal-900/40 border-arduino-teal text-white'
                : 'w-24 h-24 bg-slate-800/80 border-slate-600 text-slate-200'
            }`}
          >
            {comp.type === 'arduino-uno' ? (
              <div className="flex flex-col items-center justify-between h-full w-full py-1">
                <div className="w-full flex justify-between items-center text-[10px] text-teal-300 font-mono">
                  <span>DIGITAL (PWM ~)</span>
                  <span className="font-bold">ARDUINO UNO</span>
                </div>
                
                <div className="flex items-center gap-2 my-2">
                  <div className={`w-3 h-3 rounded-full ${isRunning ? 'bg-emerald-400 animate-ping' : 'bg-emerald-700'}`} />
                  <span className="text-xs font-bold tracking-wider">ATmega328P</span>
                </div>

                <div className="w-full flex justify-between items-center text-[10px] text-teal-300 font-mono">
                  <span>POWER / ANALOG IN</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded ${isRunning ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-700 text-slate-400'}`}>
                    {isRunning ? 'EJECUTANDO' : 'DETENIDO'}
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-center">
                <span className="text-xs font-semibold uppercase">{comp.type}</span>
                <p className="text-[10px] text-slate-400 mt-1">{comp.id.slice(0, 8)}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Paleta de Componentes Flotante Inferior */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20">
        <ComponentPalette onAddComponent={handleAddComponent} />
      </div>
    </div>
  );
};
