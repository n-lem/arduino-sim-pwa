/**
 * @file UltrasonicPart.tsx
 * @description Representación SVG del sensor ultrasónico HC-SR04 con transductores T/R y 4 pines táctiles.
 */

import React from 'react';
import type { CircuitComponent } from '../../types/circuit';
import type { SelectedPinInfo } from '../../stores/useCircuitStore';

interface UltrasonicPartProps {
  component: CircuitComponent;
  selectedPin: SelectedPinInfo | null;
  onPinTouch: (componentId: string, pinId: string) => void;
  onDistanceChange?: (cm: number) => void;
}

export const UltrasonicPart: React.FC<UltrasonicPartProps> = ({
  component,
  selectedPin,
  onPinTouch,
  onDistanceChange,
}) => {
  const distance = typeof component.properties.distanceCm === 'number' ? component.properties.distanceCm : 25;

  const vccPin = component.pins.find((p) => p.id === 'vcc') || { id: 'vcc', x: 25, y: 65, name: 'VCC' };
  const trigPin = component.pins.find((p) => p.id === 'trig') || { id: 'trig', x: 40, y: 65, name: 'TRIG' };
  const echoPin = component.pins.find((p) => p.id === 'echo') || { id: 'echo', x: 55, y: 65, name: 'ECHO' };
  const gndPin = component.pins.find((p) => p.id === 'gnd') || { id: 'gnd', x: 70, y: 65, name: 'GND' };

  return (
    <div className="relative select-none pointer-events-auto flex flex-col items-center" style={{ width: '95px' }}>
      <svg viewBox="0 0 95 72" className="w-full drop-shadow-lg">
        {/* Placa PCB Azul */}
        <rect x="5" y="8" width="85" height="46" rx="4" fill="#0284C7" stroke="#0369A1" strokeWidth="1.5" />

        {/* Cristal oscilador central */}
        <rect x="42" y="24" width="10" height="15" rx="3" fill="#CBD5E1" stroke="#64748B" strokeWidth="0.8" />

        {/* Transductor Emisor 'T' (Cilindro Metálico Izquierdo) */}
        <g transform="translate(24, 31)">
          <circle cx="0" cy="0" r="14" fill="#94A3B8" stroke="#475569" strokeWidth="1.5" />
          <circle cx="0" cy="0" r="11" fill="#E2E8F0" />
          <circle cx="0" cy="0" r="7" fill="#64748B" opacity="0.3" />
          <text x="0" y="3" fill="#334155" fontSize="7" fontWeight="bold" fontFamily="sans-serif" textAnchor="middle">T</text>
        </g>

        {/* Transductor Receptor 'R' (Cilindro Metálico Derecho) */}
        <g transform="translate(70, 31)">
          <circle cx="0" cy="0" r="14" fill="#94A3B8" stroke="#475569" strokeWidth="1.5" />
          <circle cx="0" cy="0" r="11" fill="#E2E8F0" />
          <circle cx="0" cy="0" r="7" fill="#64748B" opacity="0.3" />
          <text x="0" y="3" fill="#334155" fontSize="7" fontWeight="bold" fontFamily="sans-serif" textAnchor="middle">R</text>
        </g>

        {/* Texto HC-SR04 */}
        <text x="47" y="18" fill="#FFFFFF" fontSize="7" fontWeight="bold" fontFamily="sans-serif" textAnchor="middle">
          HC-SR04
        </text>

        {/* Cabecera de pines inferior (4 pines) */}
        <rect x="18" y="50" width="58" height="8" rx="1.5" fill="#0F172A" />

        {/* Pines individuales */}
        {[vccPin, trigPin, echoPin, gndPin].map((pin) => {
          const isSelected = selectedPin?.componentId === component.id && selectedPin?.pinId === pin.id;
          return (
            <g
              key={pin.id}
              onClick={(e) => {
                e.stopPropagation();
                onPinTouch(component.id, pin.id);
              }}
              className="cursor-pointer group"
            >
              <circle cx={pin.x} cy={pin.y} r="7" fill="transparent" />
              <line x1={pin.x} y1="58" x2={pin.x} y2={pin.y} stroke="#94A3B8" strokeWidth="2" />
              <circle
                cx={pin.x}
                cy={pin.y}
                r="3"
                fill={isSelected ? '#F59E0B' : '#E2E8F0'}
                stroke={isSelected ? '#FFFFFF' : '#475569'}
                strokeWidth="1.2"
              />
              <text x={pin.x} y={pin.y - 10} fill="#CBD5E1" fontSize="5" fontFamily="monospace" textAnchor="middle">
                {pin.name}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Control interactivo deslizante de distancia para simular obstáculos */}
      <div className="w-full px-1 mt-1 bg-slate-900/90 rounded border border-slate-800 p-1 flex items-center gap-1 text-[9px] text-slate-300">
        <span className="font-mono text-cyan-400 shrink-0">{Math.round(distance)}cm</span>
        <input
          type="range"
          min="2"
          max="400"
          value={distance}
          onChange={(e) => onDistanceChange?.(Number(e.target.value))}
          className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-400"
        />
      </div>
    </div>
  );
};
