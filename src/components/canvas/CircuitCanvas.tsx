/**
 * @file CircuitCanvas.tsx
 * @description Lienzo interactivo conectado al store global con soporte del sistema "Tocar y Tocar" y arrastre.
 */

import React, { useEffect, useState } from 'react';
import { ComponentPalette } from './ComponentPalette';
import { PropertiesPanel } from './PropertiesPanel';
import { WireLayer } from './WireLayer';
import { ComponentRenderer } from '../parts/ComponentRenderer';
import { useCircuitStore } from '../../stores/useCircuitStore';
import { useSimulationStore } from '../../stores/useSimulationStore';
import type { ComponentType } from '../../types/circuit';
import { ZoomIn, ZoomOut, RotateCcw, XCircle, CheckCircle2, AlertTriangle } from 'lucide-react';

interface CircuitCanvasProps {
  isRunning: boolean;
}

export const CircuitCanvas: React.FC<CircuitCanvasProps> = ({ isRunning }) => {
  const {
    components,
    wires,
    selectedPin,
    selectedComponentId,
    addComponent,
    removeComponent,
    updateComponentPosition,
    updateComponentProperty,
    selectComponent,
    handlePinTouch,
    cancelPinSelection,
    removeWire,
  } = useCircuitStore();

  const warnings = useSimulationStore((s) => s.warnings);
  const [zoom, setZoom] = useState(1);
  const [wireNotice, setWireNotice] = useState<string | null>(null);

  const selectedComponent = components.find((c) => c.id === selectedPin?.componentId);
  const selectedPinDef = selectedComponent?.pins.find((p) => p.id === selectedPin?.pinId);

  const handlePinTouchWithFeedback = (componentId: string, pinId: string) => {
    const connected = handlePinTouch(componentId, pinId);
    if (connected) {
      setWireNotice('¡Cable conectado exitosamente!');
      setTimeout(() => setWireNotice(null), 2500);
    }
  };

  const selectedProps = components.find((c) => c.id === selectedComponentId);

  // Supr/Retroceso elimina el componente seleccionado (salvo que se esté escribiendo en un campo).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t.closest('input, textarea, select, [contenteditable="true"], .cm-editor, .blocklyWidgetDiv')) return;
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedComponentId) {
        removeComponent(selectedComponentId);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selectedComponentId, removeComponent]);

  const handleAddComponent = (type: ComponentType) => {
    addComponent(type);
  };

  return (
    <div
      id="circuit-canvas-container"
      onClick={() => {
        selectComponent(null);
      }}
      className="relative w-full h-full bg-slate-950 overflow-hidden flex flex-col select-none"
    >
      {/* Fondo de Cuadrícula / Grid de ingeniería */}
      <div
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, #38bdf8 1px, transparent 0)`,
          backgroundSize: '24px 24px',
          transform: `scale(${zoom})`,
          transformOrigin: '0 0',
        }}
      />

      {/* Controles de Zoom Flotantes */}
      <div className="absolute top-3 right-3 z-30 flex flex-col gap-1.5 bg-slate-900/90 backdrop-blur border border-slate-800 p-1.5 rounded-xl shadow-xl">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setZoom((prev) => Math.min(prev + 0.15, 2));
          }}
          className="p-2 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition active:scale-95"
          title="Acercar (Zoom In)"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setZoom((prev) => Math.max(prev - 0.15, 0.5));
          }}
          className="p-2 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition active:scale-95"
          title="Alejar (Zoom Out)"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setZoom(1);
          }}
          className="p-2 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition active:scale-95"
          title="Restablecer vista 100%"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Indicador del Sistema "Tocar y Tocar" (Top Left) */}
      <div className="absolute top-3 left-3 z-30 flex flex-col gap-1.5 max-w-[85vw] sm:max-w-md pointer-events-none">
        {selectedPin ? (
          <div className="pointer-events-auto flex items-center gap-2.5 bg-amber-500/10 border border-amber-500/40 text-amber-300 px-3 py-2 rounded-xl text-xs shadow-lg backdrop-blur animate-pulse">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shrink-0" />
            <div className="flex-1 truncate">
              Pin origen: <span className="font-bold text-white">{selectedComponent?.name} ({selectedPinDef?.name})</span>. Toca otro pin para cablear.
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                cancelPinSelection();
              }}
              className="p-1 hover:bg-amber-500/20 rounded-md text-amber-200"
              title="Cancelar selección"
            >
              <XCircle className="w-4 h-4" />
            </button>
          </div>
        ) : wireNotice ? (
          <div className="pointer-events-auto flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/40 text-emerald-300 px-3 py-2 rounded-xl text-xs shadow-lg backdrop-blur">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{wireNotice}</span>
          </div>
        ) : (
          <div className="bg-slate-900/80 backdrop-blur border border-slate-800 px-3 py-1.5 rounded-xl text-xs text-slate-400 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-teal-400" />
            <span>Modo táctil: Toca un pin para comenzar un cable</span>
          </div>
        )}
      </div>

      {/* Avisos del solver eléctrico */}
      {warnings.length > 0 && (
        <div className="absolute top-14 left-3 z-30 max-w-[85vw] sm:max-w-md flex flex-col gap-1 pointer-events-none">
          {warnings.map((w) => (
            <div key={w} className="flex items-start gap-2 bg-red-500/15 border border-red-500/50 text-red-200 px-3 py-2 rounded-xl text-xs shadow-lg backdrop-blur">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-px" />
              <span>{w}</span>
            </div>
          ))}
        </div>
      )}

      {/* Contenedor del Lienzo escalable con Zoom */}
      <div
        className="w-full h-full relative"
        style={{
          transform: `scale(${zoom})`,
          transformOrigin: 'top left',
        }}
      >
        {/* Capa de Cables SVG */}
        <WireLayer
          wires={wires}
          components={components}
          onRemoveWire={removeWire}
        />

        {/* Componentes Electrónicos */}
        {components.map((comp) => (
          <ComponentRenderer
            key={comp.id}
            component={comp}
            selectedPin={selectedPin}
            isSelected={selectedComponentId === comp.id}
            isRunning={isRunning}
            onPinTouch={handlePinTouchWithFeedback}
            onSelect={selectComponent}
            onDelete={removeComponent}
            onPropertyChange={updateComponentProperty}
            onDrag={updateComponentPosition}
          />
        ))}
      </div>

      {/* Paleta Flotante de Componentes (Bottom Center) */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-30 pointer-events-auto flex flex-col items-center gap-2">
        {selectedProps && (
          <PropertiesPanel
            component={selectedProps}
            onChange={(prop, value) => updateComponentProperty(selectedProps.id, prop, value)}
            onDelete={() => removeComponent(selectedProps.id)}
            onClose={() => selectComponent(null)}
          />
        )}
        <ComponentPalette onAddComponent={handleAddComponent} />
      </div>
    </div>
  );
};
