/**
 * @file ServoPart.tsx
 * @description Representación SVG de un micro servomotor SG90 con brazo orientable y conector de 3 pines.
 */

import React from 'react';
import type { CircuitComponent } from '../../types/circuit';
import type { SelectedPinInfo } from '../../stores/useCircuitStore';

interface ServoPartProps {
  component: CircuitComponent;
  selectedPin: SelectedPinInfo | null;
  onPinTouch: (componentId: string, pinId: string) => void;
}

export const ServoPart: React.FC<ServoPartProps> = ({
  component,
  selectedPin,
  onPinTouch,
}) => {
  const angle = typeof component.properties.angle === 'number' ? component.properties.angle : 90;

  const gndPin = component.pins.find((p) => p.id === 'gnd') || { id: 'gnd', x: 20, y: 84, name: 'GND' };
  const vccPin = component.pins.find((p) => p.id === 'vcc') || { id: 'vcc', x: 35, y: 84, name: '5V' };
  const pwmPin = component.pins.find((p) => p.id === 'pwm') || { id: 'pwm', x: 50, y: 84, name: 'PWM' };

  return (
    <div className="relative select-none pointer-events-auto" style={{ width: '70px', height: '95px' }}>
      <svg viewBox="0 0 70 95" className="w-full h-full drop-shadow-lg">
        {/* Carcasa plástica azul SG90 */}
        <rect x="12" y="18" width="46" height="52" rx="4" fill="#0284C7" stroke="#0369A1" strokeWidth="1.5" />

        {/* Pestañas de montaje con orificios */}
        <rect x="6" y="32" width="6" height="24" rx="1.5" fill="#0284C7" />
        <circle cx="9" cy="44" r="1.5" fill="#0369A1" />
        <rect x="58" y="32" width="6" height="24" rx="1.5" fill="#0284C7" />
        <circle cx="61" cy="44" r="1.5" fill="#0369A1" />

        {/* Eje / Torre superior */}
        <circle cx="35" cy="24" r="14" fill="#0369A1" />

        {/* Brazo giratorio blanco (Horns) animado según ángulo */}
        <g
          transform={`translate(35, 24) rotate(${angle - 90})`}
          className="transition-transform duration-300 ease-out"
        >
          {/* Brazo alargado */}
          <path d="M -5 -3 L 26 -2 A 4 4 0 0 1 26 2 L -5 3 Z" fill="#F8FAFC" stroke="#94A3B8" strokeWidth="1" />
          <circle cx="0" cy="0" r="5" fill="#E2E8F0" stroke="#64748B" strokeWidth="1" />
          <circle cx="0" cy="0" r="2" fill="#0F172A" />
          <circle cx="20" cy="0" r="1.2" fill="#64748B" />
          <circle cx="14" cy="0" r="1.2" fill="#64748B" />
        </g>

        {/* Etiqueta SG90 */}
        <text x="35" y="58" fill="#FFFFFF" fontSize="7" fontWeight="bold" fontFamily="sans-serif" textAnchor="middle">
          SG90
        </text>
        <text x="35" y="66" fill="#BAE6FD" fontSize="6" fontFamily="sans-serif" textAnchor="middle">
          {Math.round(angle)}°
        </text>

        {/* Cables salientes hacia el conector */}
        <line x1="20" y1="70" x2={gndPin.x} y2={gndPin.y} stroke="#78350F" strokeWidth="2.5" />
        <line x1="35" y1="70" x2={vccPin.x} y2={vccPin.y} stroke="#EF4444" strokeWidth="2.5" />
        <line x1="50" y1="70" x2={pwmPin.x} y2={pwmPin.y} stroke="#F59E0B" strokeWidth="2.5" />

        {/* Pin GND (Marrón) */}
        <g
          onClick={(e) => {
            e.stopPropagation();
            onPinTouch(component.id, gndPin.id);
          }}
          className="cursor-pointer group"
        >
          <circle cx={gndPin.x} cy={gndPin.y} r="8" fill="transparent" />
          <circle
            cx={gndPin.x}
            cy={gndPin.y}
            r="3.5"
            fill={selectedPin?.componentId === component.id && selectedPin?.pinId === gndPin.id ? '#F59E0B' : '#78350F'}
            stroke="#FFFFFF"
            strokeWidth="1.2"
          />
        </g>

        {/* Pin VCC (Rojo) */}
        <g
          onClick={(e) => {
            e.stopPropagation();
            onPinTouch(component.id, vccPin.id);
          }}
          className="cursor-pointer group"
        >
          <circle cx={vccPin.x} cy={vccPin.y} r="8" fill="transparent" />
          <circle
            cx={vccPin.x}
            cy={vccPin.y}
            r="3.5"
            fill={selectedPin?.componentId === component.id && selectedPin?.pinId === vccPin.id ? '#F59E0B' : '#EF4444'}
            stroke="#FFFFFF"
            strokeWidth="1.2"
          />
        </g>

        {/* Pin PWM (Naranja) */}
        <g
          onClick={(e) => {
            e.stopPropagation();
            onPinTouch(component.id, pwmPin.id);
          }}
          className="cursor-pointer group"
        >
          <circle cx={pwmPin.x} cy={pwmPin.y} r="8" fill="transparent" />
          <circle
            cx={pwmPin.x}
            cy={pwmPin.y}
            r="3.5"
            fill={selectedPin?.componentId === component.id && selectedPin?.pinId === pwmPin.id ? '#F59E0B' : '#F59E0B'}
            stroke="#FFFFFF"
            strokeWidth="1.2"
          />
        </g>
      </svg>
    </div>
  );
};
