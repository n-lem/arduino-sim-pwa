/**
 * @file PinTerminal.tsx
 * @description Terminal táctil reutilizable (círculo con hitbox amplio) para las partes SVG.
 */

import React from 'react';

interface PinTerminalProps {
  x: number;
  y: number;
  selected: boolean;
  /** Etiqueta corta opcional (+, -, etc.) dibujada junto al terminal. */
  label?: string;
  onTouch: () => void;
}

export const PinTerminal: React.FC<PinTerminalProps> = ({ x, y, selected, label, onTouch }) => (
  <g
    onClick={(e) => {
      e.stopPropagation();
      onTouch();
    }}
    className="cursor-pointer"
  >
    <circle cx={x} cy={y} r="9" fill="transparent" />
    <circle
      cx={x}
      cy={y}
      r="3.5"
      fill={selected ? '#F59E0B' : '#E2E8F0'}
      stroke={selected ? '#FFFFFF' : '#64748B'}
      strokeWidth="1.5"
    />
    {label && (
      <text x={x} y={y - 7} fill="#CBD5E1" fontSize="8" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">
        {label}
      </text>
    )}
  </g>
);
