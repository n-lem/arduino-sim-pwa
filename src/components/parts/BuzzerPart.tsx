/**
 * @file BuzzerPart.tsx
 * @description Buzzer piezoeléctrico: cuando el solver indica que tiene tensión suficiente, muestra ondas de sonido.
 */

import React from 'react';
import type { CircuitComponent } from '../../types/circuit';
import type { SelectedPinInfo } from '../../stores/useCircuitStore';
import { useSimulationStore } from '../../stores/useSimulationStore';
import { PinTerminal } from './PinTerminal';

interface BuzzerPartProps {
  component: CircuitComponent;
  selectedPin: SelectedPinInfo | null;
  onPinTouch: (componentId: string, pinId: string) => void;
  isRunning: boolean;
}

export const BuzzerPart: React.FC<BuzzerPartProps> = ({ component, selectedPin, onPinTouch, isRunning }) => {
  const sounding = useSimulationStore((s) => Boolean(s.buzzerOn[component.id])) && isRunning;
  const pos = component.pins.find((p) => p.id === 'pos')!;
  const neg = component.pins.find((p) => p.id === 'neg')!;
  const isSel = (id: string) => selectedPin?.componentId === component.id && selectedPin.pinId === id;

  return (
    <div className="relative select-none pointer-events-auto" style={{ width: '60px', height: '72px' }}>
      <svg viewBox="0 0 60 72" className="w-full h-full drop-shadow-md">
        <line x1={pos.x} y1={pos.y} x2={pos.x} y2="50" stroke="#94A3B8" strokeWidth="2.5" />
        <line x1={neg.x} y1={neg.y} x2={neg.x} y2="50" stroke="#94A3B8" strokeWidth="2.5" />
        <circle cx="30" cy="28" r="22" fill="#111827" stroke="#374151" strokeWidth="2" />
        <circle cx="30" cy="28" r="14" fill="none" stroke="#1F2937" strokeWidth="1.5" />
        <circle cx="30" cy="28" r="4" fill="#030712" />
        <text x="12" y="16" fill="#9CA3AF" fontSize="9" fontWeight="bold" fontFamily="sans-serif">+</text>
        {sounding && (
          <g fill="none" stroke="#38BDF8" strokeWidth="2" strokeLinecap="round" className="animate-pulse">
            <path d="M 55 18 Q 59 28 55 38" />
            <path d="M 59 12 Q 66 28 59 44" opacity="0.6" />
          </g>
        )}
        <PinTerminal x={pos.x} y={pos.y} selected={isSel('pos')} onTouch={() => onPinTouch(component.id, 'pos')} />
        <PinTerminal x={neg.x} y={neg.y} selected={isSel('neg')} onTouch={() => onPinTouch(component.id, 'neg')} />
      </svg>
    </div>
  );
};
