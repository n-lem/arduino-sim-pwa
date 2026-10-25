/**
 * @file App.tsx
 * @description Layout orquestador principal con IndexedDB, modales de exportación/importación y emulación AVR8js.
 */

import { useState } from 'react';
import { Header } from './components/layout/Header';
import { NavigationTabs } from './components/layout/NavigationTabs';
import { CircuitCanvas } from './components/canvas/CircuitCanvas';
import { EditorContainer } from './components/editor/EditorContainer';
import { PasswordGate } from './components/auth/PasswordGate';
import { ExportModal } from './components/ui/ExportModal';
import { ProjectModal } from './components/ui/ProjectModal';
import { useCircuitStore } from './stores/useCircuitStore';
import { useCodeStore } from './stores/useCodeStore';
import { useSimulationLoop } from './hooks/useSimulationLoop';
import { useAutoSave } from './hooks/useAutoSave';
import type { ViewMode } from './types/circuit';
import type { ArduinoProjectSchema } from './types/schema';

export function App() {
  const [activeView, setActiveView] = useState<ViewMode>('circuit');
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);

  const { components, wires, loadCircuit, resetCircuit } = useCircuitStore();
  const { code, setCode, blocklyXml, setBlocklyXml } = useCodeStore();
  const { isRunning, toggleRun, resetSimulation } = useSimulationLoop();
  const { isSaving } = useAutoSave();

  const currentProject: ArduinoProjectSchema = {
    metadata: {
      name: 'Circuito_Arduino',
      author: 'Estudiante',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      schemaVersion: '1.0.0',
    },
    components,
    wires,
    code,
    blocklyXml,
  };

  const handleLoadProject = (project: ArduinoProjectSchema) => {
    if (project.components && project.wires) {
      loadCircuit(project.components, project.wires);
    }
    if (project.code) {
      setCode(project.code);
    }
    if (project.blocklyXml) {
      setBlocklyXml(project.blocklyXml);
    }
  };

  const handleNewProject = () => {
    resetCircuit();
    setCode('// Nuevo circuito\nvoid setup() {\n  pinMode(13, OUTPUT);\n}\n\nvoid loop() {\n  digitalWrite(13, HIGH);\n  delay(1000);\n  digitalWrite(13, LOW);\n  delay(1000);\n}\n');
    setBlocklyXml(null);
  };

  return (
    <PasswordGate>
      <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-950 text-slate-100">
        {/* 1. Header Superior Táctil */}
        <Header
          isRunning={isRunning}
          onToggleRun={toggleRun}
          onReset={resetSimulation}
          onExport={() => setIsExportModalOpen(true)}
          onImport={() => setIsProjectModalOpen(true)}
          isSaving={isSaving}
        />

        {/* 2. Barra de Navegación por Pestañas */}
        <NavigationTabs
          activeView={activeView}
          onChangeView={setActiveView}
        />

        {/* 3. Área Principal de Contenido: Responsive */}
        <main className="flex-1 relative overflow-hidden flex flex-col md:flex-row">
          <div className={`h-full w-full ${activeView === 'circuit' ? 'block' : 'hidden md:block md:w-2/5 md:border-r md:border-slate-800'}`}>
            <CircuitCanvas isRunning={isRunning} />
          </div>

          <div className={`h-full w-full min-w-0 ${activeView !== 'circuit' ? 'block md:w-3/5' : 'hidden md:block md:w-3/5'}`}>
            <EditorContainer
              activeView={activeView === 'circuit' ? 'blocks' : activeView}
            />
          </div>
        </main>

        {/* 4. Modal Táctil de Exportación */}
        <ExportModal
          isOpen={isExportModalOpen}
          onClose={() => setIsExportModalOpen(false)}
          project={currentProject}
        />

        {/* 5. Modal Táctil de Gestión de Proyectos */}
        <ProjectModal
          isOpen={isProjectModalOpen}
          onClose={() => setIsProjectModalOpen(false)}
          onLoadProject={handleLoadProject}
          onNewProject={handleNewProject}
        />
      </div>
    </PasswordGate>
  );
}

export default App;
