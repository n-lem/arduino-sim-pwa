/**
 * @file ArduinoUnoPart.tsx
 * @description Representación visual e interactiva de la placa Arduino Uno R3 en SVG con pines táctiles.
 */

import React from 'react';
import type { CircuitComponent, PinDefinition } from '../../types/circuit';
import type { SelectedPinInfo } from '../../stores/useCircuitStore';

interface ArduinoUnoPartProps {
  component: CircuitComponent;
  selectedPin: SelectedPinInfo | null;
  onPinTouch: (componentId: string, pinId: string) => void;
  isRunning?: boolean;
}

export const ArduinoUnoPart: React.FC<ArduinoUnoPartProps> = ({
  component,
  selectedPin,
  onPinTouch,
  isRunning = false,
}) => {
  return (
    <div
      className="relative select-none pointer-events-auto"
      style={{
        width: '300px',
        height: '200px',
      }}
    >
      <svg
        viewBox="0 0 300 200"
        className="w-full h-full drop-shadow-2xl"
      >
        {/* Placa PCB Azul Arduino */}
        <rect
          x="0"
          y="0"
          width="300"
          height="200"
          rx="12"
          fill="#008184"
          stroke="#005f62"
          strokeWidth="3"
        />

        {/* Conector USB Metálico (Izquierda) */}
        <rect x="-8" y="25" width="48" height="42" rx="4" fill="#94A3B8" stroke="#475569" strokeWidth="2" />
        <rect x="2" y="32" width="30" height="28" rx="2" fill="#334155" />

        {/* Jack de Alimentación DC (Inferior Izquierda) */}
        <rect x="-8" y="125" width="45" height="48" rx="3" fill="#1E293B" stroke="#0F172A" strokeWidth="2" />

        {/* Microcontrolador ATmega328P DIP-28 */}
        <g transform="translate(130, 85)">
          <rect x="0" y="0" width="110" height="34" rx="4" fill="#0F172A" stroke="#334155" strokeWidth="1.5" />
          <circle cx="8" cy="17" r="3" fill="#334155" />
          <text x="55" y="21" fill="#94A3B8" fontSize="9" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
            ATmega328P
          </text>
        </g>

        {/* Cristal Oscilador 16MHz */}
        <rect x="85" y="88" width="18" height="28" rx="6" fill="#CBD5E1" stroke="#64748B" strokeWidth="1" />
        <text x="94" y="105" fill="#475569" fontSize="6" fontFamily="sans-serif" textAnchor="middle">16M</text>

        {/* LED 'L' (Pin 13) Integrado */}
        <g transform="translate(112, 52)">
          <rect x="0" y="0" width="8" height="6" rx="1" fill="#334155" />
          <circle cx="4" cy="3" r="2.5" fill={isRunning ? "#FBBF24" : "#78350F"} className={isRunning ? "animate-pulse" : ""} />
          <text x="4" y="-2" fill="#E2E8F0" fontSize="7" fontWeight="bold" textAnchor="middle">L</text>
        </g>

        {/* LED 'ON' */}
        <g transform="translate(126, 52)">
          <rect x="0" y="0" width="8" height="6" rx="1" fill="#334155" />
          <circle cx="4" cy="3" r="2.5" fill={isRunning ? "#10B981" : "#065F46"} />
          <text x="4" y="-2" fill="#E2E8F0" fontSize="7" fontWeight="bold" textAnchor="middle">ON</text>
        </g>

        {/* Textos y Etiquetas Oficiales */}
        <text x="150" y="45" fill="#FFFFFF" fontSize="12" fontWeight="bold" fontFamily="sans-serif">
          ARDUINO
        </text>
        <text x="212" y="45" fill="#E2E8F0" fontSize="9" fontFamily="sans-serif">
          UNO
        </text>

        {/* Cabecera de Pines Digitales (Barra negra superior) */}
        <rect x="100" y="6" width="192" height="18" rx="2" fill="#0F172A" />
        <text x="195" y="2" fill="#94A3B8" fontSize="7" fontFamily="sans-serif" textAnchor="middle">
          DIGITAL (PWM~)
        </text>

        {/* Cabecera de Pines Power y Analog (Barras negras inferiores) */}
        <rect x="102" y="176" width="90" height="18" rx="2" fill="#0F172A" />
        <text x="145" y="173" fill="#94A3B8" fontSize="7" fontFamily="sans-serif" textAnchor="middle">
          POWER
        </text>

        <rect x="207" y="176" width="82" height="18" rx="2" fill="#0F172A" />
        <text x="248" y="173" fill="#94A3B8" fontSize="7" fontFamily="sans-serif" textAnchor="middle">
          ANALOG IN
        </text>

        {/* Pines Táctiles Interactivos */}
        {component.pins.map((pin: PinDefinition) => {
          const isSelected = selectedPin?.componentId === component.id && selectedPin?.pinId === pin.id;
          return (
            <g
              key={pin.id}
              onClick={(e) => {
                e.stopPropagation();
                onPinTouch(component.id, pin.id);
              }}
              className="cursor-pointer group"
            >
              {/* Área de toque agrandada invisible para facilitar interacción en móviles (Hitbox táctil) */}
              <circle cx={pin.x} cy={pin.y} r="10" fill="transparent" />

              {/* Halo de selección animado cuando el pin está activo en "Tocar y Tocar" */}
              {isSelected && (
                <circle
                  cx={pin.x}
                  cy={pin.y}
                  r="9"
                  fill="none"
                  stroke="#F59E0B"
                  strokeWidth="2.5"
                  className="animate-ping"
                />
              )}

              {/* Agujero / Socket del pin */}
              <circle
                cx={pin.x}
                cy={pin.y}
                r="4"
                fill={isSelected ? "#F59E0B" : "#1E293B"}
                stroke={isSelected ? "#FFFFFF" : "#64748B"}
                strokeWidth="1.5"
                className="transition-colors group-hover:stroke-teal-300"
              />

              {/* Centro de contacto metálico */}
              <circle cx={pin.x} cy={pin.y} r="1.5" fill={isSelected ? "#FFFFFF" : "#E2E8F0"} />

              {/* Etiqueta visible del pin */}
              <text
                x={pin.x}
                y={pin.y > 100 ? pin.y - 8 : pin.y + 14}
                fill={isSelected ? "#F59E0B" : "#CBD5E1"}
                fontSize="6.5"
                fontFamily="monospace"
                fontWeight={isSelected ? "bold" : "normal"}
                textAnchor="middle"
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
