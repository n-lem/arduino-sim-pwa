/**
 * @file ComponentPalette.tsx
 * @description Menú desplegable de componentes electrónicos, agrupado por categoría. Táctil y responsive.
 */

import React from 'react';
import { Plus, X, Battery, Zap, CircleDot, Radio, Gauge, Sliders, Volume2, Cpu } from 'lucide-react';
import type { ComponentType } from '../../types/circuit';

interface ComponentPaletteProps {
  onAddComponent: (type: ComponentType) => void;
}

interface ComponentItem {
  type: ComponentType;
  label: string;
  hint: string;
  icon: React.ElementType;
}

interface Category {
  title: string;
  items: ComponentItem[];
}

const CATEGORIES: Category[] = [
  {
    title: 'Fuentes de energía',
    items: [{ type: 'battery', label: 'Batería', hint: 'Pila o batería de 1,5 a 12 V', icon: Battery }],
  },
  {
    title: 'Componentes pasivos',
    items: [
      { type: 'resistor', label: 'Resistencia', hint: 'Valor editable (ley de Ohm)', icon: Cpu },
      { type: 'potentiometer', label: 'Potenciómetro', hint: 'Divisor de tensión variable', icon: Sliders },
    ],
  },
  {
    title: 'Entradas',
    items: [{ type: 'pushbutton', label: 'Pulsador', hint: 'Cierra el circuito al apretarlo', icon: CircleDot }],
  },
  {
    title: 'Salidas',
    items: [
      { type: 'led', label: 'LED', hint: 'Se quema sin resistencia', icon: Zap },
      { type: 'buzzer', label: 'Buzzer', hint: 'Suena con 2 V o más', icon: Volume2 },
      { type: 'servo-sg90', label: 'Servo SG90', hint: 'Motor de posición 0–180°', icon: Gauge },
    ],
  },
  {
    title: 'Sensores',
    items: [{ type: 'ultrasonic-hcsr04', label: 'HC-SR04', hint: 'Distancia por ultrasonido', icon: Radio }],
  },
];

export const ComponentPalette: React.FC<ComponentPaletteProps> = ({ onAddComponent }) => {
  const [open, setOpen] = React.useState(false);

  return (
    <div className="flex flex-col items-center gap-2" onClick={(e) => e.stopPropagation()} onPointerDown={(e) => e.stopPropagation()}>
      {open && (
        <div className="w-[94vw] max-w-lg max-h-[55vh] overflow-y-auto bg-slate-900/95 backdrop-blur-md border border-slate-700 rounded-2xl shadow-2xl p-3">
          {CATEGORIES.map((cat) => (
            <section key={cat.title} className="mb-3 last:mb-0">
              <h4 className="text-[10px] font-bold uppercase tracking-wider text-teal-400 mb-1.5">{cat.title}</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {cat.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.type}
                      onClick={() => {
                        onAddComponent(item.type);
                        setOpen(false);
                      }}
                      className="flex items-center gap-3 px-3 py-2 rounded-xl bg-slate-800/90 hover:bg-slate-700 border border-slate-700/60 text-left transition active:scale-[0.98]"
                    >
                      <Icon className="w-5 h-5 text-teal-300 shrink-0" />
                      <span className="min-w-0">
                        <span className="block text-sm text-white">{item.label}</span>
                        <span className="block text-[11px] text-slate-400 truncate">{item.hint}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}

      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-arduino-teal hover:bg-arduino-darkTeal text-white text-sm font-semibold shadow-2xl border border-teal-300/30 active:scale-95 transition"
        aria-expanded={open}
      >
        {open ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
        {open ? 'Cerrar' : 'Agregar componente'}
      </button>
    </div>
  );
};
