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
import type { BreadboardSize } from '../../core/breadboard';
import { ZoomIn, ZoomOut, RotateCcw, RotateCw, XCircle, CheckCircle2, AlertTriangle, MoreHorizontal, X, Plus, Trash2, SlidersHorizontal } from 'lucide-react';

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
    settleComponent,
    rotateComponent,
    updateComponentProperty,
    selectComponent,
    handlePinTouch,
    cancelPinSelection,
    removeWire,
  } = useCircuitStore();

  const warnings = useSimulationStore((s) => s.warnings);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const panRef = React.useRef<{ sx: number; sy: number; px: number; py: number; moved: boolean } | null>(null);
  const justPannedRef = React.useRef(false);

  /** Arrastrar el fondo desplaza la vista (necesario para protoboards grandes en pantallas chicas). */
  const onBgPointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    panRef.current = { sx: e.clientX, sy: e.clientY, px: pan.x, py: pan.y, moved: false };
  };
  const onBgPointerMove = (e: React.PointerEvent) => {
    const p = panRef.current;
    if (!p) return;
    const dx = e.clientX - p.sx;
    const dy = e.clientY - p.sy;
    if (!p.moved && Math.hypot(dx, dy) < 5) return;
    p.moved = true;
    setPan({ x: p.px + dx, y: p.py + dy });
  };
  const onBgPointerUp = () => {
    if (panRef.current?.moved) {
      justPannedRef.current = true;
      setTimeout(() => (justPannedRef.current = false), 0);
    }
    panRef.current = null;
  };
  const [panel, setPanel] = useState<'none' | 'menu' | 'add' | 'props'>('none');
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
      if ((e.key === 'r' || e.key === 'R') && selectedComponentId && !e.ctrlKey && !e.metaKey) {
        rotateComponent(selectedComponentId);
      }
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedComponentId) {
        removeComponent(selectedComponentId);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selectedComponentId, removeComponent, rotateComponent]);

  const handleAddComponent = (type: ComponentType, options?: { size?: BreadboardSize }) => {
    addComponent(type, undefined, undefined, options);
  };

  return (
    <div
      id="circuit-canvas-container"
      onClick={() => {
        if (justPannedRef.current) return;
        selectComponent(null);
      }}
      onPointerDown={onBgPointerDown}
      onPointerMove={onBgPointerMove}
      onPointerUp={onBgPointerUp}
      onPointerCancel={onBgPointerUp}
      style={{ touchAction: 'none' }}
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
            setZoom((prev) => Math.max(prev - 0.15, 0.3));
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
            setPan({ x: 0, y: 0 });
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
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
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
            onDrop={settleComponent}
            onRotate={rotateComponent}
          />
        ))}
      </div>

      {/* Menú flotante "⋯": acciones del componente seleccionado, agregar y restablecer vista */}
      <div
        className="absolute bottom-3 right-3 z-40 flex flex-col items-end gap-2 pointer-events-auto"
        onClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
      >
        {panel === 'add' && <ComponentPalette onAddComponent={handleAddComponent} onClose={() => setPanel('none')} />}
        {panel === 'props' && selectedProps && (
          <PropertiesPanel
            component={selectedProps}
            onChange={(prop, value) => updateComponentProperty(selectedProps.id, prop, value)}
            onDelete={() => {
              removeComponent(selectedProps.id);
              setPanel('none');
            }}
            onClose={() => setPanel('none')}
          />
        )}
        {panel === 'menu' && (
          <div className="w-56 bg-slate-900/95 backdrop-blur-md border border-slate-700 rounded-2xl shadow-2xl p-1.5 text-sm text-slate-200">
            {selectedProps && (
              <>
                <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-teal-400 truncate">
                  {selectedProps.name}
                </div>
                <MenuItem icon={SlidersHorizontal} label="Propiedades" onClick={() => setPanel('props')} />
                <MenuItem
                  icon={RotateCw}
                  label="Rotar 90° (R)"
                  onClick={() => {
                    rotateComponent(selectedProps.id);
                    setPanel('none');
                  }}
                />
                <MenuItem
                  icon={Trash2}
                  label="Eliminar"
                  danger
                  onClick={() => {
                    removeComponent(selectedProps.id);
                    setPanel('none');
                  }}
                />
                <div className="my-1 border-t border-slate-700" />
              </>
            )}
            <MenuItem icon={Plus} label="Agregar componente" onClick={() => setPanel('add')} />
            <MenuItem
              icon={RotateCcw}
              label="Restablecer vista"
              onClick={() => {
                setZoom(1);
                setPan({ x: 0, y: 0 });
                setPanel('none');
              }}
            />
          </div>
        )}
        <button
          onClick={() => setPanel((p) => (p === 'none' ? 'menu' : 'none'))}
          className="relative w-12 h-12 rounded-full bg-arduino-teal hover:brightness-110 text-white shadow-2xl border border-teal-300/30 flex items-center justify-center active:scale-95 transition"
          aria-label="Más opciones"
          aria-expanded={panel !== 'none'}
          title="Más opciones"
        >
          {panel === 'none' ? <MoreHorizontal className="w-6 h-6" /> : <X className="w-6 h-6" />}
          {selectedProps && panel === 'none' && (
            <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-amber-400 border-2 border-slate-950" />
          )}
        </button>
      </div>
    </div>
  );
};

interface MenuItemProps {
  icon: React.ElementType;
  label: string;
  onClick: () => void;
  danger?: boolean;
}

/** Fila táctil del menú flotante. */
const MenuItem: React.FC<MenuItemProps> = ({ icon: Icon, label, onClick, danger }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition active:scale-[0.98] ${
      danger ? 'text-red-300 hover:bg-red-500/15' : 'hover:bg-slate-800'
    }`}
  >
    <Icon className="w-4 h-4 shrink-0" />
    {label}
  </button>
);
