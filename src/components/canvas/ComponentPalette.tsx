/**
 * @file ComponentPalette.tsx
 * @description Paleta táctil de componentes electrónicos para inserción en el lienzo.
 */

import React from 'react';
import { Plus, Zap, CircleDot, Radio, Gauge, Sliders, Volume2, Cpu } from 'lucide-react';
import type { ComponentType } from '../../types/circuit';

interface ComponentPaletteProps {
  onAddComponent: (type: ComponentType) => void;
}

interface ComponentItem {
  type: ComponentType;
  label: string;
  icon: React.ElementType;
  badge?: string;
}

export const ComponentPalette: React.FC<ComponentPaletteProps> = ({ onAddComponent }) => {
  const items: ComponentItem[] = [
    { type: 'arduino-uno', label: 'Arduino Uno', icon: Cpu, badge: 'Core' },
    { type: 'led', label: 'LED', icon: Zap },
    { type: 'resistor', label: 'Resistencia', icon: Sliders },
    { type: 'pushbutton', label: 'Pulsador', icon: CircleDot },
    { type: 'servo-sg90', label: 'Servo SG90', icon: Gauge, badge: 'PWM' },
    { type: 'ultrasonic-hcsr04', label: 'HC-SR04', icon: Radio, badge: 'Sensor' },
    { type: 'potentiometer', label: 'Potenciómetro', icon: Sliders },
    { type: 'buzzer', label: 'Buzzer', icon: Volume2 },
  ];

  return (
    <div className="bg-slate-900/90 backdrop-blur border border-slate-800 rounded-2xl p-2 shadow-2xl flex items-center gap-1.5 overflow-x-auto max-w-[calc(100vw-1rem)] md:max-w-max">
      <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 px-2 shrink-0 hidden sm:inline">
        Componentes:
      </span>
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <button
            key={item.type}
            onClick={() => onAddComponent(item.type)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 active:bg-arduino-darkTeal text-slate-200 hover:text-white border border-slate-700/60 transition active:scale-95 text-xs font-medium shrink-0 group"
          >
            <Plus className="w-3.5 h-3.5 text-arduino-teal group-hover:scale-110 transition-transform" />
            <Icon className="w-4 h-4 text-slate-300" />
            <span>{item.label}</span>
          </button>
        );
      })}
    </div>
  );
};
