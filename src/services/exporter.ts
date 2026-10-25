/**
 * @file exporter.ts
 * @description Utilidades de exportación para archivos .json, .ino y captura gráfica de circuitos.
 */

import type { ArduinoProjectSchema } from '../types/schema';
import { serializeProject } from './serializer';

/**
 * Descarga el proyecto completo en formato .json.
 */
export function downloadProjectJson(project: ArduinoProjectSchema, filename?: string): void {
  const json = serializeProject(project);
  const blob = new Blob([json], { type: 'application/json;charset=utf-8' });
  triggerDownload(blob, filename || `${sanitizeFilename(project.metadata.name)}.json`);
}

/**
 * Descarga el código Arduino en formato .ino.
 */
export function downloadSketchIno(code: string, filename?: string): void {
  const blob = new Blob([code], { type: 'text/plain;charset=utf-8' });
  triggerDownload(blob, filename || 'sketch.ino');
}

/**
 * Captura y descarga el lienzo actual como imagen PNG o SVG.
 */
export function downloadCanvasImage(canvasElement: HTMLElement | null, filename = 'circuito_arduino.png'): void {
  if (!canvasElement) return;

  // Si hay un SVG principal o el contenedor, renderizar a un Canvas de HTML5 y descargar PNG
  const svgElement = canvasElement.querySelector('svg');
  if (svgElement) {
    const svgData = new XMLSerializer().serializeToString(svgElement);
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 1200;
      canvas.height = 800;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#020617'; // Fondo oscuro slate-950
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        canvas.toBlob((blob) => {
          if (blob) {
            triggerDownload(blob, filename);
          }
          URL.revokeObjectURL(url);
        }, 'image/png');
      }
    };
    img.src = url;
  }
}

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9_\-]/g, '_').toLowerCase();
}
