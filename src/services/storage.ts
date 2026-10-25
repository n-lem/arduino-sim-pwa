/**
 * @file storage.ts
 * @description Servicio de persistencia local en IndexedDB con soporte 100% offline.
 */

import { openDB } from 'idb';
import type { DBSchema, IDBPDatabase } from 'idb';
import type { ArduinoProjectSchema } from '../types/schema';

interface ArduinoSimDB extends DBSchema {
  sessions: {
    key: string;
    value: ArduinoProjectSchema;
  };
  projects: {
    key: string;
    value: ArduinoProjectSchema;
    indexes: { 'by-date': string };
  };
}

const DB_NAME = 'arduino_sim_pwa_db';
const DB_VERSION = 1;
const SESSION_KEY = 'active_session';

let dbPromise: Promise<IDBPDatabase<ArduinoSimDB>> | null = null;

function getDB(): Promise<IDBPDatabase<ArduinoSimDB>> {
  if (!dbPromise) {
    dbPromise = openDB<ArduinoSimDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('sessions')) {
          db.createObjectStore('sessions');
        }
        if (!db.objectStoreNames.contains('projects')) {
          const projectStore = db.createObjectStore('projects', { keyPath: 'metadata.name' });
          projectStore.createIndex('by-date', 'metadata.updatedAt');
        }
      },
    });
  }
  return dbPromise;
}

/**
 * Guarda el estado actual de la sesión en IndexedDB.
 */
export async function saveActiveSession(project: ArduinoProjectSchema): Promise<void> {
  try {
    const db = await getDB();
    await db.put('sessions', project, SESSION_KEY);
  } catch (error) {
    console.warn('Error al guardar sesión activa en IndexedDB:', error);
  }
}

/**
 * Carga el estado de la última sesión guardada en IndexedDB.
 */
export async function loadActiveSession(): Promise<ArduinoProjectSchema | null> {
  try {
    const db = await getDB();
    const session = await db.get('sessions', SESSION_KEY);
    return session || null;
  } catch (error) {
    console.warn('Error al leer sesión activa de IndexedDB:', error);
    return null;
  }
}

/**
 * Guarda un proyecto con nombre en la base de datos de proyectos.
 */
export async function saveNamedProject(project: ArduinoProjectSchema): Promise<void> {
  const db = await getDB();
  await db.put('projects', project);
}

/**
 * Lista todos los proyectos guardados localmente.
 */
export async function listSavedProjects(): Promise<ArduinoProjectSchema[]> {
  try {
    const db = await getDB();
    return await db.getAll('projects');
  } catch (error) {
    console.warn('Error al listar proyectos de IndexedDB:', error);
    return [];
  }
}

/**
 * Elimina un proyecto guardado por su nombre.
 */
export async function deleteSavedProject(name: string): Promise<void> {
  const db = await getDB();
  await db.delete('projects', name);
}
