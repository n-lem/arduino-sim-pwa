/**
 * @file serializer.ts
 * @description Serializador y validador de archivos JSON de proyectos de Arduino Sim.
 */

import type { ArduinoProjectSchema } from '../types/schema';

/**
 * Convierte un proyecto en una cadena JSON formateada con sangría.
 */
export function serializeProject(project: ArduinoProjectSchema): string {
  return JSON.stringify(project, null, 2);
}

/**
 * Analiza y valida una cadena JSON para garantizar que cumpla con el contrato del simulador.
 * Lanza un error descriptivo si el formato es inválido.
 */
export function deserializeProject(jsonContent: string): ArduinoProjectSchema {
  let parsed: any;
  try {
    parsed = JSON.parse(jsonContent);
  } catch (err: any) {
    throw new Error(`El archivo no es un JSON válido: ${err.message}`);
  }

  // Validación de campos esenciales
  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Estructura de proyecto inválida: el contenido raíz debe ser un objeto.');
  }

  if (!Array.isArray(parsed.components)) {
    throw new Error('El archivo no contiene una lista de componentes válida.');
  }

  if (!Array.isArray(parsed.wires)) {
    throw new Error('El archivo no contiene una lista de cables válida.');
  }

  // Normalización y valores por defecto seguros
  const project: ArduinoProjectSchema = {
    metadata: {
      name: parsed.metadata?.name || 'Proyecto Importado',
      author: parsed.metadata?.author || 'Estudiante',
      createdAt: parsed.metadata?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      schemaVersion: '1.0.0',
      description: parsed.metadata?.description || '',
    },
    components: parsed.components.map((c: any) => ({
      id: c.id || `comp-${Math.random().toString(36).substring(2, 6)}`,
      type: c.type || 'arduino-uno',
      name: c.name || c.type,
      x: typeof c.x === 'number' ? c.x : 100,
      y: typeof c.y === 'number' ? c.y : 100,
      rotation: c.rotation || 0,
      pins: Array.isArray(c.pins) ? c.pins : [],
      properties: c.properties || {},
    })),
    wires: parsed.wires.map((w: any) => ({
      id: w.id || `wire-${Math.random().toString(36).substring(2, 6)}`,
      fromComponentId: w.fromComponentId,
      fromPinId: w.fromPinId,
      toComponentId: w.toComponentId,
      toPinId: w.toPinId,
      color: w.color || '#3B82F6',
    })),
    code: typeof parsed.code === 'string' ? parsed.code : '// Código importado\nvoid setup() {}\nvoid loop() {}',
    blocklyXml: typeof parsed.blocklyXml === 'string' ? parsed.blocklyXml : null,
  };

  return project;
}
