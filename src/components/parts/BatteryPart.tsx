/**
 * @file BatteryPart.tsx
 * @description Batería / fuente de tensión. Dibuja un bloque con terminales + y − y la tensión configurada.
 */

import React from 'react';
import type { CircuitComponent } from '../../types/circuit';
import type { SelectedPinInfo } from '../../stores/useCircuitStore';
import { PinTerminal } from './PinTerminal';

interface BatteryPartProps {
  component: CircuitComponent;
  selectedPin: SelectedPinInfo | null;
  onPinTouch: (componentId: string, pinId: string) => void;
}

export const BatteryPart: React.FC<BatteryPartProps> = ({ component, selectedPin, onPinTouch }) => {
  const pos = component.pins.find((p) => p.id === 'pos')!;
  const neg = component.pins.find((p) => p.id === 'neg')!;
  const isSel = (id: string) => selectedPin?.componentId === component.id && selectedPin.pinId === id;
  const volts = Number(component.properties.voltage) || 0;

  return (
    <div className="relative select-none pointer-events-auto" style={{ width: '60px', height: '96px' }}>
      <svg viewBox="0 0 60 96" className="w-full h-full drop-shadow-md">
        <rect x="6" y="20" width="48" height="72" rx="5" fill="#1E293B" stroke="#475569" strokeWidth="1.5" />
        <rect x="6" y="20" width="48" height="18" rx="5" fill="#F59E0B" />
        <rect x="14" y="8" width="8" height="12" rx="2" fill="#CBD5E1" />
        <rect x="38" y="8" width="8" height="12" rx="2" fill="#CBD5E1" />
        <text x="30" y="33" fill="#1E293B" fontSize="9" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">
          {+volts.toFixed(2)} V
        </text>
        <text x="30" y="62" fill="#94A3B8" fontSize="9" textAnchor="middle" fontFamily="sans-serif">BATERÍA</text>
        <text x="18" y="80" fill="#EF4444" fontSize="14" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">+</text>
        <text x="42" y="80" fill="#94A3B8" fontSize="14" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">−</text>
        <PinTerminal x={pos.x} y={pos.y} selected={isSel('pos')} onTouch={() => onPinTouch(component.id, 'pos')} />
        <PinTerminal x={neg.x} y={neg.y} selected={isSel('neg')} onTouch={() => onPinTouch(component.id, 'neg')} />
      </svg>
    </div>
  );
};
