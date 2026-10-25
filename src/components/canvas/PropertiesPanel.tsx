/**
 * @file PropertiesPanel.tsx
 * @description Panel de propiedades del componente seleccionado: permite editar valores (resistencia, tensión,
 * color, etc.), ver mediciones en vivo (ley de Ohm) y eliminar el componente.
 */

import React from 'react';
import { Trash2, X } from 'lucide-react';
import type { CircuitComponent } from '../../types/circuit';
import { useSimulationStore } from '../../stores/useSimulationStore';
import {
  BATTERY_PRESETS,
  RESISTOR_PRESETS,
  formatCurrent,
  formatOhms,
  parseOhms,
} from '../../core/electronics';

interface PropertiesPanelProps {
  component: CircuitComponent;
  onChange: (property: string, value: unknown) => void;
  onDelete: () => void;
  onClose: () => void;
}

const LED_COLORS = [
  { label: 'Rojo', color: '#EF4444', vf: 2.0 },
  { label: 'Amarillo', color: '#EAB308', vf: 2.1 },
  { label: 'Verde', color: '#22C55E', vf: 2.2 },
  { label: 'Azul', color: '#3B82F6', vf: 3.0 },
  { label: 'Blanco', color: '#F1F5F9', vf: 3.2 },
];

const POT_VALUES = [1000, 5000, 10000, 50000, 100000];

const chipClass = (active: boolean) =>
  `px-2.5 py-1 rounded-full text-xs border transition active:scale-95 ${
    active
      ? 'bg-teal-500/20 border-teal-400 text-teal-200'
      : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
  }`;

/** Campo de texto que valida y aplica el valor al salir o al presionar Enter. */
const CommitInput: React.FC<{
  value: string;
  suffix?: string;
  inputMode?: 'text' | 'decimal';
  onCommit: (text: string) => void;
  label: string;
}> = ({ value, suffix, inputMode = 'text', onCommit, label }) => {
  const [draft, setDraft] = React.useState(value);
  React.useEffect(() => setDraft(value), [value]);
  return (
    <label className="flex items-center gap-1.5 text-xs text-slate-400">
      {label}
      <input
        value={draft}
        inputMode={inputMode}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => onCommit(draft)}
        onKeyDown={(e) => {
          e.stopPropagation();
          if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
        }}
        className="w-24 bg-slate-950 border border-slate-600 focus:border-teal-400 outline-none rounded-lg px-2 py-1 text-sm text-white"
      />
      {suffix}
    </label>
  );
};

export const PropertiesPanel: React.FC<PropertiesPanelProps> = ({ component, onChange, onDelete, onClose }) => {
  const measurement = useSimulationStore((s) => s.measurements[component.id]);
  const props = component.properties;
  const isArduino = component.type === 'arduino-uno';

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
      className="w-[94vw] max-w-lg bg-slate-900/95 backdrop-blur-md border border-slate-700 rounded-2xl shadow-2xl p-3 text-slate-200"
    >
      <div className="flex items-center gap-2 mb-2">
        <h3 className="text-sm font-semibold flex-1 truncate">{component.name}</h3>
        {measurement && (
          <span className="text-[11px] font-mono text-sky-300 bg-sky-500/10 border border-sky-500/30 rounded-md px-2 py-0.5">
            {measurement.volts.toFixed(2)} V · {formatCurrent(measurement.milliamps)}
          </span>
        )}
        {!isArduino && (
          <button
            onClick={onDelete}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-medium active:scale-95"
            title="Eliminar componente (Supr)"
          >
            <Trash2 className="w-3.5 h-3.5" /> Eliminar
          </button>
        )}
        <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400" title="Cerrar">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex flex-col gap-2">
        {component.type === 'resistor' && (
          <>
            <div className="flex flex-wrap gap-1.5">
              {RESISTOR_PRESETS.map((r) => (
                <button key={r} className={chipClass(Number(props.resistance) === r)} onClick={() => onChange('resistance', r)}>
                  {formatOhms(r)}
                </button>
              ))}
            </div>
            <CommitInput
              label="Valor"
              value={formatOhms(Number(props.resistance) || 220).replace('Ω', '')}
              suffix="Ω (ej: 4.7k, 330)"
              onCommit={(t) => {
                const v = parseOhms(t);
                if (v !== null) onChange('resistance', v);
              }}
            />
          </>
        )}

        {component.type === 'battery' && (
          <>
            <div className="flex flex-wrap gap-1.5">
              {BATTERY_PRESETS.map((v) => (
                <button key={v} className={chipClass(Number(props.voltage) === v)} onClick={() => onChange('voltage', v)}>
                  {v} V
                </button>
              ))}
            </div>
            <CommitInput
              label="Tensión"
              inputMode="decimal"
              value={String(props.voltage ?? 9)}
              suffix="V"
              onCommit={(t) => {
                const v = parseFloat(t.replace(',', '.'));
                if (Number.isFinite(v) && v > 0 && v <= 48) onChange('voltage', v);
              }}
            />
          </>
        )}

        {component.type === 'led' && (
          <div className="flex flex-wrap gap-1.5">
            {LED_COLORS.map((c) => (
              <button
                key={c.color}
                className={chipClass(props.color === c.color)}
                onClick={() => {
                  onChange('color', c.color);
                  onChange('forwardVoltage', c.vf);
                }}
              >
                <span className="inline-block w-2.5 h-2.5 rounded-full mr-1.5 align-middle" style={{ background: c.color }} />
                {c.label} ({c.vf} V)
              </button>
            ))}
            {props.burned && (
              <button className="px-2.5 py-1 rounded-full text-xs bg-amber-500/20 border border-amber-400 text-amber-200" onClick={() => onChange('burned', false)}>
                Reparar LED quemado
              </button>
            )}
          </div>
        )}

        {component.type === 'potentiometer' && (
          <>
            <label className="flex items-center gap-2 text-xs text-slate-400">
              Posición
              <input
                type="range"
                min={0}
                max={1023}
                value={Number(props.value) || 0}
                onChange={(e) => onChange('value', Number(e.target.value))}
                className="flex-1 accent-teal-400"
              />
              <span className="w-10 text-right text-slate-200 font-mono">{Number(props.value) || 0}</span>
            </label>
            <div className="flex flex-wrap gap-1.5 items-center text-xs text-slate-400">
              Resistencia total:
              {POT_VALUES.map((r) => (
                <button key={r} className={chipClass(Number(props.maxResistance) === r)} onClick={() => onChange('maxResistance', r)}>
                  {formatOhms(r)}
                </button>
              ))}
            </div>
          </>
        )}

        {component.type === 'ultrasonic-hcsr04' && (
          <label className="flex items-center gap-2 text-xs text-slate-400">
            Distancia al objeto
            <input
              type="range"
              min={2}
              max={400}
              value={Number(props.distanceCm) || 25}
              onChange={(e) => onChange('distanceCm', Number(e.target.value))}
              className="flex-1 accent-teal-400"
            />
            <span className="w-14 text-right text-slate-200 font-mono">{Number(props.distanceCm) || 25} cm</span>
          </label>
        )}

        {component.type === 'servo-sg90' && (
          <p className="text-xs text-slate-400">
            Ángulo actual: <span className="text-slate-200 font-mono">{Math.round(Number(props.angle) || 0)}°</span>
            {' · '}Conectá GND, 5V y la señal PWM a un pin del Arduino.
          </p>
        )}

        {component.type === 'pushbutton' && (
          <p className="text-xs text-slate-400">Mantené apretado el botón rojo para cerrar el circuito.</p>
        )}

        {component.type === 'buzzer' && (
          <p className="text-xs text-slate-400">Suena cuando recibe 2 V o más entre + y −.</p>
        )}

        {isArduino && <p className="text-xs text-slate-400">La placa no se puede eliminar. Tocá un pin para empezar un cable.</p>}
      </div>
    </div>
  );
};
