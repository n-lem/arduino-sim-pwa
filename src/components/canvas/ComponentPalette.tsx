/**
 * @file ComponentPalette.tsx
 * @description Menú desplegable de componentes electrónicos, agrupado por categoría. Táctil y responsive.
 */

import React from 'react';
import { X, Battery, Zap, CircleDot, Radio, Gauge, Sliders, Volume2, Cpu, Sun, ToggleLeft, Grid3x3 } from 'lucide-react';
import type { ComponentType } from '../../types/circuit';
import type { BreadboardSize } from '../../core/breadboard';

interface ComponentPaletteProps {
  onAddComponent: (type: ComponentType, options?: { size?: BreadboardSize }) => void;
  onClose: () => void;
}

interface ComponentItem {
  type: ComponentType;
  label: string;
  hint: string;
  icon: React.ElementType;
  size?: BreadboardSize;
}

interface Category {
  title: string;
  items: ComponentItem[];
}

const CATEGORIES: Category[] = [
  {
    title: 'Placas (reemplazan a la actual)',
    items: [
      { type: 'arduino-uno', label: 'Arduino Uno', hint: '5 V · 14 pines digitales · 6 analógicos', icon: Cpu },
      { type: 'esp32', label: 'ESP32', hint: '3,3 V · GPIO · ADC de 12 bits', icon: Cpu },
    ],
  },
  {
    title: 'Protoboard',
    items: [
      {
        type: 'breadboard' as ComponentType,
        label: 'Protoboard (mediana)',
        hint: 'Tamaño editable desde Propiedades',
        icon: Grid3x3,
        size: 'medium' as BreadboardSize,
      },
    ],
  },
  {
    title: 'Fuentes de energía',
    items: [{ type: 'battery', label: 'Batería', hint: 'Pila o batería de 1,5 a 12 V', icon: Battery }],
  },
  {
    title: 'Componentes pasivos',
    items: [
      { type: 'resistor', label: 'Resistencia', hint: 'Valor editable (ley de Ohm)', icon: Cpu },
      { type: 'potentiometer', label: 'Potenciómetro', hint: 'Divisor de tensión variable', icon: Sliders },
      { type: 'ldr', label: 'Fotorresistencia (LDR)', hint: 'Resistencia según la luz', icon: Sun },
    ],
  },
  {
    title: 'Entradas',
    items: [
      { type: 'pushbutton', label: 'Pulsador', hint: 'Cierra el circuito al apretarlo', icon: CircleDot },
      { type: 'switch', label: 'Interruptor', hint: 'Queda abierto o cerrado', icon: ToggleLeft },
    ],
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
    title: 'Instrumentos',
    items: [{ type: 'multimeter', label: 'Multímetro', hint: 'Mide tensión entre dos puntos', icon: Gauge }],
  },
  {
    title: 'Sensores',
    items: [{ type: 'ultrasonic-hcsr04', label: 'HC-SR04', hint: 'Distancia por ultrasonido', icon: Radio }],
  },
];

export const ComponentPalette: React.FC<ComponentPaletteProps> = ({ onAddComponent, onClose }) => {
  return (
    <div
      className="w-[94vw] max-w-lg max-h-[60vh] overflow-y-auto bg-slate-900/95 backdrop-blur-md border border-slate-700 rounded-2xl shadow-2xl p-3"
      onClick={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-bold text-white">Agregar componente</h3>
        <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400" title="Cerrar">
          <X className="w-4 h-4" />
        </button>
      </div>
      {CATEGORIES.map((cat) => (
        <section key={cat.title} className="mb-3 last:mb-0">
          <h4 className="text-[10px] font-bold uppercase tracking-wider text-teal-400 mb-1.5">{cat.title}</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            {cat.items.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.size ? `${item.type}-${item.size}` : item.type}
                  onClick={() => {
                    onAddComponent(item.type, item.size ? { size: item.size } : undefined);
                    onClose();
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
  );
};
