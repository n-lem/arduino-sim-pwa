/**
 * @file PushbuttonPart.tsx
 * @description Representación SVG de un pulsador táctil (Push Button) interactivo.
 */

import React from 'react';
import type { CircuitComponent } from '../../types/circuit';
import type { SelectedPinInfo } from '../../stores/useCircuitStore';

interface PushbuttonPartProps {
  component: CircuitComponent;
  selectedPin: SelectedPinInfo | null;
  onPinTouch: (componentId: string, pinId: string) => void;
  onTogglePress?: (isPressed: boolean) => void;
}

export const PushbuttonPart: React.FC<PushbuttonPartProps> = ({
  component,
  selectedPin,
  onPinTouch,
  onTogglePress,
}) => {
  const pin1 = component.pins.find((p) => p.id === 'pin1') || { id: 'pin1', x: 12, y: 24, name: '1' };
  const pin2 = component.pins.find((p) => p.id === 'pin2') || { id: 'pin2', x: 48, y: 24, name: '2' };

  const isPin1Selected = selectedPin?.componentId === component.id && selectedPin?.pinId === pin1.id;
  const isPin2Selected = selectedPin?.componentId === component.id && selectedPin?.pinId === pin2.id;
  const isPressed = Boolean(component.properties.isPressed);

  return (
    <div className="relative select-none pointer-events-auto" style={{ width: '60px', height: '48px' }}>
      <svg viewBox="0 0 60 48" className="w-full h-full drop-shadow-md">
        {/* Patas metálicas laterales */}
        <line x1={pin1.x} y1={pin1.y} x2="18" y2={pin1.y} stroke="#94A3B8" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="42" y1={pin2.y} x2={pin2.x} y2={pin2.y} stroke="#94A3B8" strokeWidth="2.5" strokeLinecap="round" />

        {/* Base plástica del botón */}
        <rect x="18" y="10" width="24" height="28" rx="3" fill="#1E293B" stroke="#0F172A" strokeWidth="1.5" />

        {/* Botón pulsable central */}
        <g
          onMouseDown={() => onTogglePress?.(true)}
          onMouseUp={() => onTogglePress?.(false)}
          onTouchStart={() => onTogglePress?.(true)}
          onTouchEnd={() => onTogglePress?.(false)}
          className="cursor-pointer active:scale-95 transition-transform"
        >
          <circle
            cx="30"
            cy="24"
            r={isPressed ? "8" : "9"}
            fill={isPressed ? "#DC2626" : "#EF4444"}
            stroke="#991B1B"
            strokeWidth="1.5"
            className="transition-all"
          />
          <circle cx="30" cy="24" r="5" fill={isPressed ? "#B91C1C" : "#F87171"} />
        </g>

        {/* Terminal 1 */}
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

        {/* Terminal 2 */}
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
