/**
 * @file PotentiometerPart.tsx
 * @description Potenciómetro rotativo. La perilla se arrastra/gira tocándola; el valor (0–1023) vive en las propiedades.
 */

import React from 'react';
import type { CircuitComponent } from '../../types/circuit';
import type { SelectedPinInfo } from '../../stores/useCircuitStore';
import { PinTerminal } from './PinTerminal';

interface PotentiometerPartProps {
  component: CircuitComponent;
  selectedPin: SelectedPinInfo | null;
  onPinTouch: (componentId: string, pinId: string) => void;
  onValueChange: (value: number) => void;
}

/** Recorrido de la perilla: de −135° a +135°. */
const SWEEP_DEG = 270;

export const PotentiometerPart: React.FC<PotentiometerPartProps> = ({ component, selectedPin, onPinTouch, onValueChange }) => {
  const value = Math.max(0, Math.min(1023, Number(component.properties.value) || 0));
  const angle = (value / 1023) * SWEEP_DEG - SWEEP_DEG / 2;
  const svgRef = React.useRef<SVGSVGElement>(null);
  const dragging = React.useRef(false);

  const pins = ['vcc', 'wiper', 'gnd'].map((id) => component.pins.find((p) => p.id === id)!);
  const isSel = (id: string) => selectedPin?.componentId === component.id && selectedPin.pinId === id;

  /** Convierte la posición del puntero en un valor según el ángulo respecto al centro de la perilla. */
  const updateFromPointer = (e: React.PointerEvent) => {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + (rect.height * 32) / 80;
    let deg = (Math.atan2(e.clientX - cx, -(e.clientY - cy)) * 180) / Math.PI;
    deg = Math.max(-SWEEP_DEG / 2, Math.min(SWEEP_DEG / 2, deg));
    onValueChange(Math.round(((deg + SWEEP_DEG / 2) / SWEEP_DEG) * 1023));
  };

  return (
    <div className="relative select-none pointer-events-auto" style={{ width: '70px', height: '80px' }}>
      <svg ref={svgRef} viewBox="0 0 70 80" className="w-full h-full drop-shadow-md">
        <rect x="6" y="4" width="58" height="58" rx="8" fill="#1D4ED8" stroke="#1E3A8A" strokeWidth="1.5" />
        <circle cx="35" cy="32" r="20" fill="#E2E8F0" stroke="#64748B" strokeWidth="2" />
        <g
          className="cursor-pointer"
          style={{ touchAction: 'none' }}
          onPointerDown={(e) => {
            e.stopPropagation();
            dragging.current = true;
            (e.target as Element).setPointerCapture(e.pointerId);
            updateFromPointer(e);
          }}
          onPointerMove={(e) => dragging.current && updateFromPointer(e)}
          onPointerUp={() => (dragging.current = false)}
        >
          <circle cx="35" cy="32" r="20" fill="transparent" />
          <g transform={`rotate(${angle} 35 32)`}>
            <circle cx="35" cy="32" r="14" fill="#CBD5E1" stroke="#475569" strokeWidth="1.5" />
            <rect x="33.5" y="14" width="3" height="14" rx="1.5" fill="#1E293B" />
          </g>
        </g>
        {pins.map((p) => (
          <PinTerminal
            key={p.id}
            x={p.x}
            y={p.y}
            selected={isSel(p.id)}
            onTouch={() => onPinTouch(component.id, p.id)}
          />
        ))}
        <text x="35" y="77" fill="#94A3B8" fontSize="7" textAnchor="middle" fontFamily="sans-serif">
          {Math.round((component.properties.maxResistance || 10000) / 1000)}k · {value}
        </text>
      </svg>
    </div>
  );
};
