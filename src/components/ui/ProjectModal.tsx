/**
 * @file ProjectModal.tsx
 * @description Modal táctil para abrir proyectos desde archivo JSON o desde la base local IndexedDB.
 */

import React, { useEffect, useState } from 'react';
import { X, Upload, FolderOpen, Plus, Trash2, FileJson, Clock } from 'lucide-react';
import type { ArduinoProjectSchema } from '../../types/schema';
import { listSavedProjects, deleteSavedProject } from '../../services/storage';
import { deserializeProject } from '../../services/serializer';

interface ProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadProject: (project: ArduinoProjectSchema) => void;
  onNewProject: () => void;
}

export const ProjectModal: React.FC<ProjectModalProps> = ({
  isOpen,
  onClose,
  onLoadProject,
  onNewProject,
}) => {
  const [savedProjects, setSavedProjects] = useState<ArduinoProjectSchema[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadProjectsList();
    }
  }, [isOpen]);

  const loadProjectsList = async () => {
    const list = await listSavedProjects();
    setSavedProjects(list);
  };

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const project = deserializeProject(content);
        onLoadProject(project);
        onClose();
      } catch (err: any) {
        setErrorMsg(err.message || 'Error al leer el archivo JSON');
        setTimeout(() => setErrorMsg(null), 4000);
      }
    };
    reader.readAsText(file);
  };

  const handleDeleteSaved = async (e: React.MouseEvent, name: string) => {
    e.stopPropagation();
    await deleteSavedProject(name);
    loadProjectsList();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm select-none">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
        {/* Encabezado */}
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center">
              <FolderOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Gestión de Proyectos</h3>
              <p className="text-[11px] text-slate-400">Abrir archivos .json o proyectos locales</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Acciones Rápidas: Cargar Archivo y Nuevo Proyecto */}
        <div className="grid grid-cols-2 gap-2.5 mb-5">
          <label className="flex flex-col items-center justify-center p-3.5 rounded-2xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 hover:border-arduino-teal cursor-pointer transition active:scale-95 text-center group">
            <input
              type="file"
              accept=".json"
              onChange={handleFileUpload}
              className="hidden"
            />
            <Upload className="w-5 h-5 text-arduino-teal mb-1.5 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-semibold text-white">Importar .json</span>
            <span className="text-[10px] text-slate-400 mt-0.5">Desde el dispositivo</span>
          </label>

          <button
            onClick={() => {
              if (window.confirm('¿Deseas iniciar un nuevo circuito? Los cambios no guardados se reiniciarán.')) {
                onNewProject();
                onClose();
              }
            }}
            className="flex flex-col items-center justify-center p-3.5 rounded-2xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 hover:border-amber-400 transition active:scale-95 text-center group"
          >
            <Plus className="w-5 h-5 text-amber-400 mb-1.5 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-semibold text-white">Nuevo Circuito</span>
            <span className="text-[10px] text-slate-400 mt-0.5">Lienzo en blanco</span>
          </button>
        </div>

        {/* Mensaje de Error */}
        {errorMsg && (
          <div className="mb-4 p-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
            {errorMsg}
          </div>
        )}

        {/* Lista de Proyectos Guardados en IndexedDB */}
        <div>
          <span className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
            Proyectos Guardados en este Equipo:
          </span>

          {savedProjects.length === 0 ? (
            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 text-center text-xs text-slate-500">
              No hay proyectos guardados con nombre. Los cambios se guardan automáticamente en tu sesión activa.
            </div>
          ) : (
            <div className="max-h-48 overflow-y-auto space-y-2">
              {savedProjects.map((p) => (
                <div
                  key={p.metadata.name}
                  onClick={() => {
                    onLoadProject(p);
                    onClose();
                  }}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/50 hover:border-teal-500/50 cursor-pointer transition group"
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <FileJson className="w-4 h-4 text-teal-400 shrink-0" />
                    <div className="truncate">
                      <span className="text-xs font-medium text-white truncate block">{p.metadata.name}</span>
                      <span className="text-[10px] text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(p.metadata.updatedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={(e) => handleDeleteSaved(e, p.metadata.name)}
                    className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition"
                    title="Eliminar de la memoria"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
