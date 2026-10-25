/**
 * @file NavigationTabs.tsx
 * @description Pestañas de navegación responsive adaptadas a touch y pantallas de notebook y móvil.
 */

import React from 'react';
import { Cpu, Puzzle, Code2, Terminal } from 'lucide-react';
import type { ViewMode } from '../../types/circuit';

interface NavigationTabsProps {
  activeView: ViewMode;
  onChangeView: (view: ViewMode) => void;
  className?: string;
}

export const NavigationTabs: React.FC<NavigationTabsProps> = ({
  activeView,
  onChangeView,
  className = '',
}) => {
  const tabs = [
    { id: 'circuit' as ViewMode, label: 'Circuito', icon: Cpu, badge: 'Táctil' },
    { id: 'blocks' as ViewMode, label: 'Bloques', icon: Puzzle, badge: 'Blockly' },
    { id: 'code' as ViewMode, label: 'Código C++', icon: Code2, badge: '.ino' },
    { id: 'serial' as ViewMode, label: 'Monitor Serial', icon: Terminal, badge: 'UART' },
  ];

  return (
    <nav className={`bg-slate-900 border-b border-slate-800 flex items-center px-2 select-none overflow-x-auto ${className}`}>
      <div className="flex gap-1 w-full max-w-2xl">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeView === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onChangeView(tab.id)}
              className={`flex-1 min-w-[90px] py-2.5 px-2 flex items-center justify-center gap-1.5 text-xs font-medium border-b-2 transition-all relative ${
                isActive
                  ? 'border-arduino-teal text-white bg-slate-800/60 shadow-sm'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
              }`}
            >
              <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-arduino-teal' : 'text-slate-400'}`} />
              <span className="truncate">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
