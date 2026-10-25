/**
 * @file schema.ts
 * @description Contratos y especificaciones para el archivo JSON de proyecto y evaluación docente.
 */

import type { CircuitComponent, WireConnection } from './circuit';

export interface ProjectMetadata {
  name: string;
  author?: string;
  createdAt: string;
  updatedAt: string;
  schemaVersion: '1.0.0';
  description?: string;
}

export interface ArduinoProjectSchema {
  metadata: ProjectMetadata;
  components: CircuitComponent[];
  wires: WireConnection[];
  code: string;
  blocklyXml: string | null;
}
