/**
 * @file SwitchPart.tsx
 * @description Interruptor de palanca: un toque lo abre o lo cierra y mantiene su estado.
 */

import React from 'react';
import type { CircuitComponent } from '../../types/circuit';
import type { SelectedPinInfo } from '../../stores/useCircuitStore';
import { PinTerminal } from './PinTerminal';

interface SwitchPartProps {
  component: CircuitComponent;
  selectedPin: SelectedPinInfo | null;
  onPinTouch: (componentId: string, pinId: string) => void;
  onToggle: (closed: boolean) => void;
}

export const SwitchPart: React.FC<SwitchPartProps> = ({ component, selectedPin, onPinTouch, onToggle }) => {
  const closed = Boolean(component.properties.closed);
  const p1 = component.pins.find((p) => p.id === 'pin1')!;
  const p2 = component.pins.find((p) => p.id === 'pin2')!;
  const isSel = (id: string) => selectedPin?.componentId === component.id && selectedPin.pinId === id;

  return (
    <div className="relative select-none pointer-events-auto" style={{ width: '80px', height: '56px' }}>
      <svg viewBox="0 0 80 56" className="w-full h-full drop-shadow-md">
        <rect x="16" y="14" width="48" height="26" rx="4" fill="#1E293B" stroke="#0F172A" strokeWidth="1.5" />
        <line x1={p1.x} y1={p1.y} x2="24" y2="30" stroke="#94A3B8" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="56" y1="30" x2={p2.x} y2={p2.y} stroke="#94A3B8" strokeWidth="2.5" strokeLinecap="round" />
        <circle cx="24" cy="30" r="2.5" fill="#CBD5E1" />
        <circle cx="56" cy="30" r="2.5" fill="#CBD5E1" />
        <g onClick={() => onToggle(!closed)} className="cursor-pointer">
          <rect x="16" y="10" width="48" height="34" fill="transparent" />
          <line
            x1="24"
            y1="30"
            x2={closed ? 56 : 52}
            y2={closed ? 30 : 16}
            stroke={closed ? '#22C55E' : '#F59E0B'}
            strokeWidth="4"
            strokeLinecap="round"
          />
        </g>
        <text x="40" y="52" fill={closed ? '#4ADE80' : '#94A3B8'} fontSize="8" textAnchor="middle" fontFamily="sans-serif">
          {closed ? 'CERRADO' : 'ABIERTO'}
        </text>
        <PinTerminal x={p1.x} y={p1.y} selected={isSel('pin1')} onTouch={() => onPinTouch(component.id, 'pin1')} />
        <PinTerminal x={p2.x} y={p2.y} selected={isSel('pin2')} onTouch={() => onPinTouch(component.id, 'pin2')} />
      </svg>
    </div>
  );
};
