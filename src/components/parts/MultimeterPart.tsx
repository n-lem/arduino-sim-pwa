/**
 * @file MultimeterPart.tsx
 * @description Multímetro en modo voltímetro: la punta roja (V+) y la negra (COM) miden la tensión entre dos puntos
 * del circuito con impedancia muy alta, sin alterarlo. Requiere la simulación en marcha.
 */

import React from 'react';
import type { CircuitComponent } from '../../types/circuit';
import type { SelectedPinInfo } from '../../stores/useCircuitStore';
import { useSimulationStore } from '../../stores/useSimulationStore';
import { PinTerminal } from './PinTerminal';

interface MultimeterPartProps {
  component: CircuitComponent;
  selectedPin: SelectedPinInfo | null;
  onPinTouch: (componentId: string, pinId: string) => void;
}

export const MultimeterPart: React.FC<MultimeterPartProps> = ({ component, selectedPin, onPinTouch }) => {
  const m = useSimulationStore((s) => s.measurements[component.id]);
  const red = component.pins.find((p) => p.id === 'red')!;
  const black = component.pins.find((p) => p.id === 'black')!;
  const isSel = (id: string) => selectedPin?.componentId === component.id && selectedPin.pinId === id;

  return (
    <div className="relative select-none pointer-events-auto" style={{ width: '100px', height: '106px' }}>
      <svg viewBox="0 0 100 106" className="w-full h-full drop-shadow-md">
        <rect x="8" y="2" width="84" height="84" rx="10" fill="#EAB308" stroke="#A16207" strokeWidth="2" />
        <rect x="16" y="10" width="68" height="28" rx="3" fill="#A7F3D0" stroke="#065F46" strokeWidth="1.5" />
        <text x="80" y="31" fill="#064E3B" fontSize="16" fontFamily="monospace" fontWeight="bold" textAnchor="end">
          {m ? m.volts.toFixed(2) : '--.--'}
        </text>
        <text x="82" y="18" fill="#065F46" fontSize="6" fontFamily="sans-serif" textAnchor="end">V DC</text>
        <circle cx="50" cy="60" r="14" fill="#1F2937" stroke="#111827" strokeWidth="2" />
        <line x1="50" y1="60" x2="58" y2="52" stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round" />
        <text x="50" y="82" fill="#422006" fontSize="6" fontWeight="bold" fontFamily="sans-serif" textAnchor="middle">
          MULTÍMETRO
        </text>
        <line x1={red.x} y1="86" x2={red.x} y2={red.y} stroke="#DC2626" strokeWidth="3" />
        <line x1={black.x} y1="86" x2={black.x} y2={black.y} stroke="#111827" strokeWidth="3" />
        <text x={red.x} y="105" fill="#FCA5A5" fontSize="7" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">V+</text>
        <text x={black.x} y="105" fill="#CBD5E1" fontSize="7" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">COM</text>
        <PinTerminal x={red.x} y={red.y} selected={isSel('red')} onTouch={() => onPinTouch(component.id, 'red')} />
        <PinTerminal x={black.x} y={black.y} selected={isSel('black')} onTouch={() => onPinTouch(component.id, 'black')} />
      </svg>
    </div>
  );
};
