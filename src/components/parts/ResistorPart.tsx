/**
 * @file ResistorPart.tsx
 * @description Representación SVG de una resistencia pasiva con código de colores y terminales táctiles.
 */

import React from 'react';
import type { CircuitComponent } from '../../types/circuit';
import type { SelectedPinInfo } from '../../stores/useCircuitStore';

interface ResistorPartProps {
  component: CircuitComponent;
  selectedPin: SelectedPinInfo | null;
  onPinTouch: (componentId: string, pinId: string) => void;
}

export const ResistorPart: React.FC<ResistorPartProps> = ({
  component,
  selectedPin,
  onPinTouch,
}) => {
  const pin1 = component.pins.find((p) => p.id === 'pin1') || { id: 'pin1', x: 8, y: 15, name: '1' };
  const pin2 = component.pins.find((p) => p.id === 'pin2') || { id: 'pin2', x: 72, y: 15, name: '2' };

  const isPin1Selected = selectedPin?.componentId === component.id && selectedPin?.pinId === pin1.id;
  const isPin2Selected = selectedPin?.componentId === component.id && selectedPin?.pinId === pin2.id;
  const resistance = component.properties.resistance || 220;

  return (
    <div className="relative select-none pointer-events-auto" style={{ width: '80px', height: '32px' }}>
      <svg viewBox="0 0 80 32" className="w-full h-full drop-shadow-md">
        {/* Terminales metálicos axiales */}
        <line x1={pin1.x} y1={pin1.y} x2="25" y2="15" stroke="#94A3B8" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="55" y1="15" x2={pin2.x} y2={pin2.y} stroke="#94A3B8" strokeWidth="2.5" strokeLinecap="round" />

        {/* Cuerpo cerámico / beige de la resistencia */}
        <rect x="23" y="8" width="34" height="14" rx="4" fill="#D4B996" stroke="#92400E" strokeWidth="1" />

        {/* Bandas de colores (ejemplo 220 ohms: Rojo, Rojo, Marrón, Dorado) */}
        <rect x="28" y="8" width="3" height="14" fill="#EF4444" />
        <rect x="34" y="8" width="3" height="14" fill="#EF4444" />
        <rect x="40" y="8" width="3" height="14" fill="#78350F" />
        <rect x="48" y="8" width="3" height="14" fill="#F59E0B" />

        {/* Etiqueta de Valor */}
        <text x="40" y="30" fill="#94A3B8" fontSize="7" fontFamily="sans-serif" textAnchor="middle">
          {resistance >= 1000 ? `${resistance / 1000}kΩ` : `${resistance}Ω`}
        </text>

        {/* Terminal 1 Táctil */}
        <g
          onClick={(e) => {
            e.stopPropagation();
            onPinTouch(component.id, pin1.id);
          }}
          className="cursor-pointer group"
        >
          <circle cx={pin1.x} cy={pin1.y} r="8" fill="transparent" />
          <circle
            cx={pin1.x}
            cy={pin1.y}
            r="3.5"
            fill={isPin1Selected ? '#F59E0B' : '#E2E8F0'}
            stroke={isPin1Selected ? '#FFFFFF' : '#64748B'}
            strokeWidth="1.5"
          />
        </g>

        {/* Terminal 2 Táctil */}
        <g
          onClick={(e) => {
            e.stopPropagation();
            onPinTouch(component.id, pin2.id);
          }}
          className="cursor-pointer group"
        >
          <circle cx={pin2.x} cy={pin2.y} r="8" fill="transparent" />
          <circle
            cx={pin2.x}
            cy={pin2.y}
            r="3.5"
            fill={isPin2Selected ? '#F59E0B' : '#E2E8F0'}
            stroke={isPin2Selected ? '#FFFFFF' : '#64748B'}
            strokeWidth="1.5"
          />
        </g>
      </svg>
    </div>
  );
};
