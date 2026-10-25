/**
 * @file LedPart.tsx
 * @description Representación SVG de un Diodo Emisor de Luz (LED) con ánodo, cátodo y halo de luz.
 */

import React from 'react';
import type { CircuitComponent } from '../../types/circuit';
import type { SelectedPinInfo } from '../../stores/useCircuitStore';

interface LedPartProps {
  component: CircuitComponent;
  selectedPin: SelectedPinInfo | null;
  onPinTouch: (componentId: string, pinId: string) => void;
  isRunning?: boolean;
}

export const LedPart: React.FC<LedPartProps> = ({
  component,
  selectedPin,
  onPinTouch,
  isRunning = false,
}) => {
  const burned = Boolean(component.properties.burned);
  const isOn = Boolean(component.properties.isOn && isRunning && !burned);
  const glow = Math.min(1, 0.25 + (Number(component.properties.current) || 0) / 20);
  const color = component.properties.color || '#EF4444';

  const anodePin = component.pins.find((p) => p.id === 'anode') || { id: 'anode', x: 20, y: 56, name: '+' };
  const cathodePin = component.pins.find((p) => p.id === 'cathode') || { id: 'cathode', x: 38, y: 56, name: '-' };

  const isAnodeSelected = selectedPin?.componentId === component.id && selectedPin?.pinId === anodePin.id;
  const isCathodeSelected = selectedPin?.componentId === component.id && selectedPin?.pinId === cathodePin.id;

  return (
    <div className="relative select-none pointer-events-auto" style={{ width: '60px', height: '65px' }}>
      <svg viewBox="0 0 60 65" className="w-full h-full drop-shadow-md">
        {/* Patas metálicas del LED */}
        {/* Ánodo (pata larga con curva) */}
        <path d="M 20 35 L 20 45 L 22 50 L 22 56" fill="none" stroke="#94A3B8" strokeWidth="2.5" strokeLinecap="round" />
        {/* Cátodo (pata recta) */}
        <path d="M 38 35 L 38 56" fill="none" stroke="#94A3B8" strokeWidth="2.5" strokeLinecap="round" />

        {/* Resplandor cuando está encendido */}
        {isOn && (
          <circle cx="29" cy="22" r="24" fill={color} opacity={0.45 * glow} className="animate-pulse" />
        )}

        {/* LED quemado: cúpula negra con una cruz */}
        {burned && (
          <g>
            <path d="M 18 34 A 12 12 0 1 1 40 34 Z" fill="#111827" stroke="#000" strokeWidth="1.5" />
            <path d="M 23 14 L 35 26 M 35 14 L 23 26" stroke="#F87171" strokeWidth="2.5" strokeLinecap="round" />
          </g>
        )}

        {/* Cuerpo plástico del LED (Cúpula) */}
        <path
          d="M 18 34 A 12 12 0 1 1 40 34 Z"
          fill={isOn ? color : '#7F1D1D'}
          stroke="#450A0A"
          strokeWidth="1.5"
          className="transition-colors duration-200"
        />
        {/* Borde inferior del encapsulado de 5mm */}
        <rect x="16" y="32" width="26" height="4" rx="1.5" fill={isOn ? color : '#7F1D1D'} />

        {/* Reflejo blanco brillante de la cúpula */}
        <ellipse cx="24" cy="18" rx="4" ry="7" transform="rotate(-30 24 18)" fill="#FFFFFF" opacity="0.6" />

        {/* Pin Ánodo (+) Táctil */}
        <g
          onClick={(e) => {
            e.stopPropagation();
            onPinTouch(component.id, anodePin.id);
          }}
          className="cursor-pointer group"
        >
          <circle cx={anodePin.x} cy={anodePin.y} r="8" fill="transparent" />
          <circle
            cx={anodePin.x}
            cy={anodePin.y}
            r="4"
            fill={isAnodeSelected ? '#F59E0B' : '#E2E8F0'}
            stroke={isAnodeSelected ? '#FFFFFF' : '#64748B'}
            strokeWidth="1.5"
          />
          <text x={anodePin.x - 7} y={anodePin.y + 3} fill="#94A3B8" fontSize="7" fontWeight="bold">
            +
          </text>
        </g>

        {/* Pin Cátodo (-) Táctil */}
        <g
          onClick={(e) => {
            e.stopPropagation();
            onPinTouch(component.id, cathodePin.id);
          }}
          className="cursor-pointer group"
        >
          <circle cx={cathodePin.x} cy={cathodePin.y} r="8" fill="transparent" />
          <circle
            cx={cathodePin.x}
            cy={cathodePin.y}
            r="4"
            fill={isCathodeSelected ? '#F59E0B' : '#E2E8F0'}
            stroke={isCathodeSelected ? '#FFFFFF' : '#64748B'}
            strokeWidth="1.5"
          />
          <text x={cathodePin.x + 5} y={cathodePin.y + 3} fill="#94A3B8" fontSize="7" fontWeight="bold">
            -
          </text>
        </g>
      </svg>
    </div>
  );
};
