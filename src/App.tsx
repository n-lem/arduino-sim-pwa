/**
 * @file App.tsx
 * @description Layout orquestador principal responsivo protegido con PasswordGate y emulación AVR8js.
 */

import { useState } from 'react';
import { Header } from './components/layout/Header';
import { NavigationTabs } from './components/layout/NavigationTabs';
import { CircuitCanvas } from './components/canvas/CircuitCanvas';
import { EditorContainer } from './components/editor/EditorContainer';
import { PasswordGate } from './components/auth/PasswordGate';
import { useCircuitStore } from './stores/useCircuitStore';
import { useCodeStore } from './stores/useCodeStore';
import { useSimulationLoop } from './hooks/useSimulationLoop';
import type { ViewMode } from './types/circuit';

export function App() {
  const [activeView, setActiveView] = useState<ViewMode>('circuit');
  const { components, wires, loadCircuit } = useCircuitStore();
  const { code, setCode, blocklyXml, setBlocklyXml } = useCodeStore();
  const { isRunning, toggleRun, resetSimulation } = useSimulationLoop();

  const handleExport = () => {
    const projectData = {
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      code,
      blocklyXml,
      components,
      wires,
    };
    const blob = new Blob([JSON.stringify(projectData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'proyecto_arduino.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e: any) => {
      const file = e.target.files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            const data = JSON.parse(event.target?.result as string);
            if (data.code) {
              setCode(data.code);
            }
            if (data.blocklyXml) {
              setBlocklyXml(data.blocklyXml);
            }
            if (data.components && data.wires) {
              loadCircuit(data.components, data.wires);
            }
          } catch (err) {
            console.error('Error al importar archivo JSON:', err);
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  return (
    <PasswordGate>
      <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-950 text-slate-100">
        {/* 1. Header Superior Táctil con controles de simulación AVR8js */}
        <Header
          isRunning={isRunning}
          onToggleRun={toggleRun}
          onReset={resetSimulation}
          onExport={handleExport}
          onImport={handleImport}
        />

        {/* 2. Barra de Navegación por Pestañas */}
        <NavigationTabs
          activeView={activeView}
          onChangeView={setActiveView}
        />

        {/* 3. Área Principal de Contenido: Responsive */}
        <main className="flex-1 relative overflow-hidden flex flex-col md:flex-row">
          {/* En móvil muestra la pestaña seleccionada; en pantallas medianas/grandes permite split view */}
          <div className={`h-full w-full ${activeView === 'circuit' ? 'block' : 'hidden md:block md:w-1/2 md:border-r md:border-slate-800'}`}>
            <CircuitCanvas isRunning={isRunning} />
          </div>

          <div className={`h-full w-full ${activeView !== 'circuit' ? 'block' : 'hidden md:block md:w-1/2'}`}>
            <EditorContainer
              activeView={activeView === 'circuit' ? 'blocks' : activeView}
            />
          </div>
        </main>
      </div>
    </PasswordGate>
  );
}

export default App;
