/**
 * @file App.tsx
 * @description Layout orquestador principal responsivo (mobile-first & desktop split view).
 */

import { useState } from 'react';
import { Header } from './components/layout/Header';
import { NavigationTabs } from './components/layout/NavigationTabs';
import { CircuitCanvas } from './components/canvas/CircuitCanvas';
import { EditorContainer } from './components/editor/EditorContainer';
import type { ViewMode } from './types/circuit';

const DEFAULT_ARDUINO_SKETCH = `// Sketch básico de Arduino Uno
// Parpadeo de LED en pin 13

void setup() {
  pinMode(13, OUTPUT);
  Serial.begin(9600);
  Serial.println("Arduino inicializado!");
}

void loop() {
  digitalWrite(13, HIGH);
  delay(1000);
  digitalWrite(13, LOW);
  delay(1000);
}
`;

export function App() {
  const [isRunning, setIsRunning] = useState(false);
  const [activeView, setActiveView] = useState<ViewMode>('circuit');
  const [code, setCode] = useState(DEFAULT_ARDUINO_SKETCH);

  const handleToggleRun = () => {
    setIsRunning(prev => !prev);
  };

  const handleReset = () => {
    setIsRunning(false);
  };

  const handleExport = () => {
    const projectData = {
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      code,
      components: [
        { id: 'arduino-1', type: 'arduino-uno', x: 120, y: 80 }
      ],
      wires: []
    };
    const blob = new Blob([JSON.stringify(projectData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'arduino_circuito.json';
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
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-950 text-slate-100">
      {/* 1. Header Superior Táctil */}
      <Header
        isRunning={isRunning}
        onToggleRun={handleToggleRun}
        onReset={handleReset}
        onExport={handleExport}
        onImport={handleImport}
      />

      {/* 2. Barra de Navegación por Pestañas (Visible en móviles o para seleccionar vista activa) */}
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
            activeView={activeView === 'circuit' ? 'code' : activeView}
            code={code}
            onChangeCode={setCode}
          />
        </div>
      </main>
    </div>
  );
}

export default App;
