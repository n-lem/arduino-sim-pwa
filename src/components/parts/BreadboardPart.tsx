/**
 * @file BreadboardPart.tsx
 * @description Protoboard en SVG de tamaño configurable. Cada agujero es un pin táctil; las tiras internas
 * (columnas a–e, f–j y rieles) se unen en el solver mediante `breadboardGroups`.
 */

import React from 'react';
import type { CircuitComponent } from '../../types/circuit';
import type { SelectedPinInfo } from '../../stores/useCircuitStore';
import { BREADBOARD_SIZES, BREADBOARD_HEIGHT, ROW_Y, breadboardGroups, breadboardWidth, columnX, isBreadboardSize } from '../../core/breadboard';

interface BreadboardPartProps {
  component: CircuitComponent;
  selectedPin: SelectedPinInfo | null;
  onPinTouch: (componentId: string, pinId: string) => void;
}

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];

export const BreadboardPart: React.FC<BreadboardPartProps> = React.memo(({ component, selectedPin, onPinTouch }) => {
  const size = isBreadboardSize(component.properties.size) ? component.properties.size : 'medium';
  const { columns } = BREADBOARD_SIZES[size];
  const width = breadboardWidth(columns);
  const selectedId = selectedPin?.componentId === component.id ? selectedPin.pinId : null;

  // Tira (pines conectados entre sí) del agujero bajo el mouse o, en pantallas táctiles, del seleccionado.
  const [hoverId, setHoverId] = React.useState<string | null>(null);
  const groups = React.useMemo(() => breadboardGroups(component), [component]);
  const activeId = hoverId ?? selectedId;
  const stripIds = React.useMemo(() => {
    const g = activeId ? groups.find((grp) => grp.includes(activeId)) : undefined;
    return g ? new Set(g) : null;
  }, [groups, activeId]);

  const labelCols = Array.from({ length: columns }, (_, i) => i + 1).filter((c) => c === 1 || c % 5 === 0);

  return (
    <div className="relative select-none pointer-events-auto" style={{ width, height: BREADBOARD_HEIGHT }}>
      <svg viewBox={`0 0 ${width} ${BREADBOARD_HEIGHT}`} className="w-full h-full drop-shadow-xl">
        <rect x="0" y="0" width={width} height={BREADBOARD_HEIGHT} rx="6" fill="#E7E5E4" stroke="#A8A29E" strokeWidth="2" />
        {/* Canal central */}
        <rect x="6" y="124" width={width - 12} height="10" fill="#D6D3D1" stroke="#A8A29E" strokeWidth="0.8" />
        {/* Líneas de rieles */}
        <line x1="8" x2={width - 8} y1={ROW_Y.tp - 8} y2={ROW_Y.tp - 8} stroke="#DC2626" strokeWidth="1.2" />
        <line x1="8" x2={width - 8} y1={ROW_Y.tn + 8} y2={ROW_Y.tn + 8} stroke="#2563EB" strokeWidth="1.2" />
        <line x1="8" x2={width - 8} y1={ROW_Y.bp - 8} y2={ROW_Y.bp - 8} stroke="#DC2626" strokeWidth="1.2" />
        <line x1="8" x2={width - 8} y1={ROW_Y.bn + 8} y2={ROW_Y.bn + 8} stroke="#2563EB" strokeWidth="1.2" />

        {/* Rótulos de filas y columnas */}
        {LETTERS.map((l, i) => (
          <text key={l} x="11" y={ROW_Y.rows[i] + 2.5} fontSize="7" fill="#57534E" textAnchor="middle" fontFamily="sans-serif">{l}</text>
        ))}
        {labelCols.map((c) => (
          <React.Fragment key={c}>
            <text x={columnX(c)} y={ROW_Y.rows[0] - 8} fontSize="6" fill="#57534E" textAnchor="middle" fontFamily="sans-serif">{c}</text>
            <text x={columnX(c)} y={ROW_Y.rows[9] + 13} fontSize="6" fill="#57534E" textAnchor="middle" fontFamily="sans-serif">{c}</text>
          </React.Fragment>
        ))}
        <text x="4" y={ROW_Y.tp + 2.5} fontSize="7" fill="#DC2626" fontWeight="bold" fontFamily="sans-serif">+</text>
        <text x="4" y={ROW_Y.tn + 2.5} fontSize="7" fill="#2563EB" fontWeight="bold" fontFamily="sans-serif">−</text>
        <text x="4" y={ROW_Y.bp + 2.5} fontSize="7" fill="#DC2626" fontWeight="bold" fontFamily="sans-serif">+</text>
        <text x="4" y={ROW_Y.bn + 2.5} fontSize="7" fill="#2563EB" fontWeight="bold" fontFamily="sans-serif">−</text>

        {component.pins.map((pin) => {
          const selected = selectedId === pin.id;
          const inStrip = stripIds?.has(pin.id) ?? false;
          return (
            <g
              key={pin.id}
              className="cursor-pointer"
              onPointerEnter={() => setHoverId(pin.id)}
              onPointerLeave={() => setHoverId((h) => (h === pin.id ? null : h))}
              onClick={(e) => {
                e.stopPropagation();
                onPinTouch(component.id, pin.id);
              }}
            >
              <title>{pin.name}</title>
              <circle cx={pin.x} cy={pin.y} r="6.5" fill="transparent" />
              {inStrip && <circle cx={pin.x} cy={pin.y} r="5" fill="#2DD4BF" fillOpacity="0.55" stroke="#0D9488" strokeWidth="1" />}
              <circle
                cx={pin.x}
                cy={pin.y}
                r={selected ? 3.8 : 2.6}
                fill={selected ? '#F59E0B' : '#292524'}
                stroke={selected ? '#FFFFFF' : 'none'}
                strokeWidth="1.2"
              />
            </g>
          );
        })}
      </svg>
    </div>
  );
});
BreadboardPart.displayName = 'BreadboardPart';
