/**
 * @file ExportModal.tsx
 * @description Modal táctil para exportar proyectos en formato JSON, sketch .ino o imagen del circuito.
 */

import React, { useState } from 'react';
import { X, FileJson, Code2, Image, Download, Check } from 'lucide-react';
import type { ArduinoProjectSchema } from '../../types/schema';
import { downloadProjectJson, downloadSketchIno, downloadCanvasImage } from '../../services/exporter';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: ArduinoProjectSchema;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  project,
}) => {
  const [projectName, setProjectName] = useState(project.metadata.name || 'Mi_Circuito_Arduino');
  const [authorName, setAuthorName] = useState(project.metadata.author || 'Estudiante');
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleDownloadJson = () => {
    const projectToExport: ArduinoProjectSchema = {
      ...project,
      metadata: {
        ...project.metadata,
        name: projectName.trim() || 'Proyecto_Arduino',
        author: authorName.trim(),
        updatedAt: new Date().toISOString(),
      },
    };
    downloadProjectJson(projectToExport, `${projectName.trim() || 'proyecto'}.json`);
    showFeedback('JSON del Proyecto descargado');
  };

  const handleDownloadIno = () => {
    downloadSketchIno(project.code, `${projectName.trim() || 'sketch'}.ino`);
    showFeedback('Archivo .ino descargado');
  };

  const handleDownloadPng = () => {
    const canvasElement = document.getElementById('circuit-canvas-container');
    downloadCanvasImage(canvasElement, `${projectName.trim() || 'circuito'}.png`);
    showFeedback('Imagen PNG descargada');
  };

  const showFeedback = (msg: string) => {
    setDownloadSuccess(msg);
    setTimeout(() => setDownloadSuccess(null), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm select-none">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
        {/* Encabezado */}
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-arduino-teal/20 text-arduino-teal flex items-center justify-center">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Exportar Proyecto</h3>
              <p className="text-[11px] text-slate-400">Elegí el formato de descarga para tu trabajo</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Campos de Nombre y Autor */}
        <div className="space-y-3 mb-5">
          <div>
            <label className="block text-[11px] font-medium text-slate-300 mb-1">Nombre del Proyecto</label>
            <input
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-arduino-teal"
              placeholder="Ej: Alarma_Distancia"
            />
          </div>
          <div>
            <label className="block text-[11px] font-medium text-slate-300 mb-1">Autor / Estudiante</label>
            <input
              type="text"
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-arduino-teal"
              placeholder="Nombre y Apellido"
            />
          </div>
        </div>

        {/* Opciones de Descarga */}
        <div className="space-y-2.5">
          {/* Opción 1: JSON */}
          <button
            onClick={handleDownloadJson}
            className="w-full flex items-center justify-between p-3 rounded-2xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 hover:border-arduino-teal text-left transition group active:scale-98"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center shrink-0">
                <FileJson className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-bold text-white group-hover:text-arduino-teal transition">
                  Proyecto Completo (.json)
                </span>
                <p className="text-[10px] text-slate-400">Guarda circuito, cables, bloques y código para evaluación</p>
              </div>
            </div>
            <Download className="w-4 h-4 text-slate-400 group-hover:text-teal-400 shrink-0 ml-2" />
          </button>

          {/* Opción 2: INO */}
          <button
            onClick={handleDownloadIno}
            className="w-full flex items-center justify-between p-3 rounded-2xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 hover:border-cyan-400 text-left transition group active:scale-98"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center shrink-0">
                <Code2 className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-bold text-white group-hover:text-cyan-400 transition">
                  Código Fuente (.ino)
                </span>
                <p className="text-[10px] text-slate-400">Listo para abrir y subir con el Arduino IDE físico</p>
              </div>
            </div>
            <Download className="w-4 h-4 text-slate-400 group-hover:text-cyan-400 shrink-0 ml-2" />
          </button>

          {/* Opción 3: PNG */}
          <button
            onClick={handleDownloadPng}
            className="w-full flex items-center justify-between p-3 rounded-2xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 hover:border-amber-400 text-left transition group active:scale-98"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0">
                <Image className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-bold text-white group-hover:text-amber-400 transition">
                  Imagen del Circuito (.png)
                </span>
                <p className="text-[10px] text-slate-400">Captura limpia en alta calidad para informes escolares</p>
              </div>
            </div>
            <Download className="w-4 h-4 text-slate-400 group-hover:text-amber-400 shrink-0 ml-2" />
          </button>
        </div>

        {/* Feedback de Descarga */}
        {downloadSuccess && (
          <div className="mt-4 p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center justify-center gap-2 animate-pulse">
            <Check className="w-4 h-4 text-emerald-400" />
            <span>{downloadSuccess}</span>
          </div>
        )}
      </div>
    </div>
  );
};
