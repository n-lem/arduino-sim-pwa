/**
 * @file Esp32Part.tsx
 * @description Placa ESP32 DevKit (30 pines) en SVG con pines táctiles. Lógica de 3,3 V y ADC de 12 bits.
 */

import React from 'react';
import type { CircuitComponent, PinDefinition } from '../../types/circuit';
import type { SelectedPinInfo } from '../../stores/useCircuitStore';
import { ESP32_SIZE } from '../../core/componentsRegistry';

interface Esp32PartProps {
  component: CircuitComponent;
  selectedPin: SelectedPinInfo | null;
  onPinTouch: (componentId: string, pinId: string) => void;
  isRunning?: boolean;
}

const pinColor = (pin: PinDefinition): string =>
  pin.type === 'ground' ? '#94A3B8' : pin.type === 'power' ? '#FCA5A5' : '#E2E8F0';

export const Esp32Part: React.FC<Esp32PartProps> = ({ component, selectedPin, onPinTouch, isRunning = false }) => {
  const { width, height } = ESP32_SIZE;
  return (
    <div className="relative select-none pointer-events-auto" style={{ width, height }}>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full drop-shadow-2xl">
        <rect x="0" y="0" width={width} height={height} rx="8" fill="#111827" stroke="#374151" strokeWidth="2" />
        {/* Módulo WROOM con antena */}
        <rect x="30" y="12" width="70" height="92" rx="4" fill="#9CA3AF" stroke="#6B7280" strokeWidth="1.5" />
        <rect x="36" y="16" width="58" height="22" fill="#D1D5DB" />
        <path d="M 40 20 h 50 M 40 26 h 50 M 40 32 h 50" stroke="#6B7280" strokeWidth="1.5" />
        <text x="65" y="72" fill="#1F2937" fontSize="9" fontWeight="bold" fontFamily="monospace" textAnchor="middle">ESP32</text>
        <text x="65" y="84" fill="#374151" fontSize="6" fontFamily="monospace" textAnchor="middle">WROOM-32</text>
        {/* USB y botones */}
        <rect x="44" y={height - 22} width="42" height="26" rx="3" fill="#94A3B8" stroke="#475569" strokeWidth="1.5" />
        <rect x="52" y={height - 100} width="9" height="9" rx="2" fill="#374151" />
        <rect x="70" y={height - 100} width="9" height="9" rx="2" fill="#374151" />
        <text x="56" y={height - 104} fill="#9CA3AF" fontSize="5" textAnchor="middle" fontFamily="sans-serif">EN</text>
        <text x="75" y={height - 104} fill="#9CA3AF" fontSize="5" textAnchor="middle" fontFamily="sans-serif">BOOT</text>
        <circle cx="65" cy={height - 118} r="3" fill={isRunning ? '#38BDF8' : '#0C4A6E'} className={isRunning ? 'animate-pulse' : ''} />
        <text x="65" y="122" fill="#F8FAFC" fontSize="8" fontWeight="bold" fontFamily="sans-serif" textAnchor="middle">3.3V LÓGICA</text>

        {component.pins.map((pin) => {
          const isSelected = selectedPin?.componentId === component.id && selectedPin?.pinId === pin.id;
          const onLeft = pin.x < width / 2;
          return (
            <g
              key={pin.id}
              onClick={(e) => {
                e.stopPropagation();
                onPinTouch(component.id, pin.id);
              }}
              className="cursor-pointer group"
            >
              <circle cx={pin.x} cy={pin.y} r="8" fill="transparent" />
              {isSelected && (
                <circle cx={pin.x} cy={pin.y} r="8" fill="none" stroke="#F59E0B" strokeWidth="2" className="animate-ping" />
              )}
              <circle
                cx={pin.x}
                cy={pin.y}
                r="3.5"
                fill={isSelected ? '#F59E0B' : '#1E293B'}
                stroke={isSelected ? '#FFFFFF' : '#64748B'}
                strokeWidth="1.5"
                className="group-hover:stroke-teal-300"
              />
              <circle cx={pin.x} cy={pin.y} r="1.3" fill={isSelected ? '#FFFFFF' : '#E2E8F0'} />
              <text
                x={onLeft ? pin.x + 8 : pin.x - 8}
                y={pin.y + 2.5}
                fill={isSelected ? '#F59E0B' : pinColor(pin)}
                fontSize="7"
                fontFamily="monospace"
                textAnchor={onLeft ? 'start' : 'end'}
                className="pointer-events-none select-none"
              >
                {pin.name}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};
