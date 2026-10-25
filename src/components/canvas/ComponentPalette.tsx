/**
 * @file ComponentPalette.tsx
 * @description Paleta táctil de componentes electrónicos con diseño aesthetic y responsive.
 */

import React from 'react';
import { Plus, Zap, CircleDot, Radio, Gauge, Sliders, Volume2 } from 'lucide-react';
import type { ComponentType } from '../../types/circuit';

interface ComponentPaletteProps {
  onAddComponent: (type: ComponentType) => void;
}

interface ComponentItem {
  type: ComponentType;
  label: string;
  icon: React.ElementType;
}

export const ComponentPalette: React.FC<ComponentPaletteProps> = ({ onAddComponent }) => {
  const items: ComponentItem[] = [
    { type: 'led', label: 'LED', icon: Zap },
    { type: 'resistor', label: 'Resistencia', icon: Sliders },
    { type: 'pushbutton', label: 'Pulsador', icon: CircleDot },
    { type: 'servo-sg90', label: 'Servo SG90', icon: Gauge },
    { type: 'ultrasonic-hcsr04', label: 'HC-SR04', icon: Radio },
    { type: 'potentiometer', label: 'Potenciómetro', icon: Sliders },
    { type: 'buzzer', label: 'Buzzer', icon: Volume2 },
  ];

  return (
    <div className="bg-slate-900/95 backdrop-blur-md border border-slate-700/80 rounded-full px-3 py-1.5 shadow-2xl flex items-center gap-1.5 overflow-x-auto max-w-[95vw] md:max-w-max scrollbar-none">
      <span className="text-[10px] font-bold uppercase tracking-wider text-teal-400 px-2 shrink-0 hidden sm:inline">
        + Componentes
      </span>
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <button
            key={item.type}
            onClick={() => onAddComponent(item.type)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-800/90 hover:bg-slate-700 active:bg-arduino-darkTeal text-slate-200 hover:text-white border border-slate-700/60 transition active:scale-95 text-xs font-medium shrink-0 group shadow-sm"
          >
            <Plus className="w-3.5 h-3.5 text-arduino-teal group-hover:scale-125 transition-transform" />
            <Icon className="w-3.5 h-3.5 text-slate-400 group-hover:text-white" />
            <span className="text-[11px]">{item.label}</span>
          </button>
        );
      })}
    </div>
  );
};
