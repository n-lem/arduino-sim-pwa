/**
 * @file useAutoSave.ts
 * @description Hook de autoguardado en IndexedDB con debouncing y restauración de sesión activa.
 */

import { useEffect, useState, useRef } from 'react';
import { useCircuitStore } from '../stores/useCircuitStore';
import { useCodeStore } from '../stores/useCodeStore';
import { saveActiveSession, loadActiveSession } from '../services/storage';
import type { ArduinoProjectSchema } from '../types/schema';

export function useAutoSave() {
  const { components, wires, loadCircuit } = useCircuitStore();
  const { code, blocklyXml, setCode, setBlocklyXml } = useCodeStore();

  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const isInitialMount = useRef(true);

  // 1. Restaurar sesión previa al montar
  useEffect(() => {
    async function restoreSession() {
      try {
        const savedSession = await loadActiveSession();
        if (savedSession) {
          if (savedSession.components && savedSession.wires) {
            loadCircuit(savedSession.components, savedSession.wires);
          }
          if (savedSession.code) {
            setCode(savedSession.code);
          }
          if (savedSession.blocklyXml) {
            setBlocklyXml(savedSession.blocklyXml);
          }
          setLastSaved(new Date(savedSession.metadata.updatedAt));
        }
      } catch (err) {
        console.warn('No se pudo restaurar la sesión previa:', err);
      } finally {
        isInitialMount.current = false;
      }
    }

    restoreSession();
  }, []);

  // 2. Autoguardado con debouncing al detectar cambios
  useEffect(() => {
    if (isInitialMount.current) return;

    setIsSaving(true);
    const timeout = setTimeout(async () => {
      const projectData: ArduinoProjectSchema = {
        metadata: {
          name: 'Proyecto Autoguardado',
          schemaVersion: '1.0.0',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        components,
        wires,
        code,
        blocklyXml,
      };

      await saveActiveSession(projectData);
      setIsSaving(false);
      setLastSaved(new Date());
    }, 1200);

    return () => clearTimeout(timeout);
  }, [components, wires, code, blocklyXml]);

  return { isSaving, lastSaved };
}
