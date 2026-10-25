/**
 * @file LdrPart.tsx
 * @description Fotorresistencia (LDR): su resistencia baja con la luz. El nivel de luz se ajusta en el panel.
 */

import React from 'react';
import type { CircuitComponent } from '../../types/circuit';
import type { SelectedPinInfo } from '../../stores/useCircuitStore';
import { useSimulationStore } from '../../stores/useSimulationStore';
import { PinTerminal } from './PinTerminal';

interface LdrPartProps {
  component: CircuitComponent;
  selectedPin: SelectedPinInfo | null;
  onPinTouch: (componentId: string, pinId: string) => void;
}

export const LdrPart: React.FC<LdrPartProps> = ({ component, selectedPin, onPinTouch }) => {
  const light = Number(component.properties.light) || 0;
  const m = useSimulationStore((s) => s.measurements[component.id]);
  const p1 = component.pins.find((p) => p.id === 'pin1')!;
  const p2 = component.pins.find((p) => p.id === 'pin2')!;
  const isSel = (id: string) => selectedPin?.componentId === component.id && selectedPin.pinId === id;

  return (
    <div className="relative select-none pointer-events-auto" style={{ width: '70px', height: '76px' }}>
      <svg viewBox="0 0 70 76" className="w-full h-full drop-shadow-md">
        <line x1={p1.x} y1={p1.y} x2={p1.x} y2="46" stroke="#94A3B8" strokeWidth="2.5" />
        <line x1={p2.x} y1={p2.y} x2={p2.x} y2="46" stroke="#94A3B8" strokeWidth="2.5" />
        <circle cx="35" cy="26" r="22" fill="#92400E" stroke="#78350F" strokeWidth="2" />
        <path
          d="M 18 20 H 52 M 18 28 H 52 M 18 36 H 52"
          stroke="#FBBF24"
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
          opacity={0.35 + light / 160}
        />
        <text x="35" y="11" fill="#FDE68A" fontSize="8" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">
          LDR
        </text>
        <text x="35" y="52" fill="#FDE68A" fontSize="7" textAnchor="middle" fontFamily="sans-serif">
          {Math.round(light)}% luz
        </text>
        {m && (
          <text x="35" y="46" fill="#7DD3FC" fontSize="6.5" textAnchor="middle" fontFamily="monospace">
            {m.volts.toFixed(2)}V
          </text>
        )}
        <PinTerminal x={p1.x} y={p1.y} selected={isSel('pin1')} onTouch={() => onPinTouch(component.id, 'pin1')} />
        <PinTerminal x={p2.x} y={p2.y} selected={isSel('pin2')} onTouch={() => onPinTouch(component.id, 'pin2')} />
      </svg>
    </div>
  );
};
