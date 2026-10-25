/**
 * @file WireLayer.tsx
 * @description Capa SVG para el trazado de cables con curvas Bézier realistas y eliminación interactiva.
 */

import React from 'react';
import type { CircuitComponent, WireConnection } from '../../types/circuit';
import { getPinPosition } from '../../core/geometry';

interface WireLayerProps {
  wires: WireConnection[];
  components: CircuitComponent[];
  onRemoveWire: (wireId: string) => void;
}

export const WireLayer: React.FC<WireLayerProps> = ({
  wires,
  components,
  onRemoveWire,
}) => {
  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
      <defs>
        {/* Filtro de sombra suave para dar tridimensionalidad a los cables */}
        <filter id="wire-shadow" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="2" stdDeviation="2" floodOpacity="0.45" floodColor="#000000" />
        </filter>
      </defs>

      {wires.filter((w) => !w.plug).map((wire) => {
        const fromComp = components.find((c) => c.id === wire.fromComponentId);
        const toComp = components.find((c) => c.id === wire.toComponentId);
        if (!fromComp || !toComp) return null;

        const fromPin = fromComp.pins.find((p) => p.id === wire.fromPinId);
        const toPin = toComp.pins.find((p) => p.id === wire.toPinId);
        if (!fromPin || !toPin) return null;

        const p1 = getPinPosition(fromComp, fromPin);
        const p2 = getPinPosition(toComp, toPin);
        const { x: x1, y: y1 } = p1;
        const { x: x2, y: y2 } = p2;

        // Cálculo de curvatura Bézier natural (estilo protoboard / cable con peso)
        const dx = Math.abs(x2 - x1);
        const dy = Math.abs(y2 - y1);
        const offset = Math.max(30, Math.min(100, Math.hypot(dx, dy) * 0.35));

        // Curvatura orientada hacia abajo por defecto (gravedad del cable)
        const cp1x = x1;
        const cp1y = y1 > y2 ? y1 - offset : y1 + offset;
        const cp2x = x2;
        const cp2y = y2 > y1 ? y2 - offset : y2 + offset;

        const pathData = `M ${x1} ${y1} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${x2} ${y2}`;

        return (
          <g key={wire.id} className="pointer-events-auto group cursor-pointer">
            {/* Hitbox amplio transparente para facilitar tocar con el dedo en pantallas táctiles */}
            <path
              d={pathData}
              fill="none"
              stroke="transparent"
              strokeWidth="20"
              onClick={() => onRemoveWire(wire.id)}
            />

            {/* Cable visible con color dinámico */}
            <path
              d={pathData}
              fill="none"
              stroke={wire.color}
              strokeWidth="3.5"
              strokeLinecap="round"
              filter="url(#wire-shadow)"
              className="transition-all group-hover:stroke-red-400 group-hover:stroke-[4.5px]"
              onClick={() => onRemoveWire(wire.id)}
            />

            {/* Núcleo de brillo del cable */}
            <path
              d={pathData}
              fill="none"
              stroke="#FFFFFF"
              strokeWidth="1"
              strokeOpacity="0.25"
              strokeLinecap="round"
              className="pointer-events-none"
            />

            {/* Puntos de conexión en los extremos */}
            <circle cx={x1} cy={y1} r="3" fill={wire.color} stroke="#FFFFFF" strokeWidth="1" />
            <circle cx={x2} cy={y2} r="3" fill={wire.color} stroke="#FFFFFF" strokeWidth="1" />
          </g>
        );
      })}
    </svg>
  );
};
