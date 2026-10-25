/**
 * @file sketchRunner.ts
 * @description Planificador que avanza el generador del intérprete respetando `delay()`
 * con temporizadores reales del navegador y sin bloquear la interfaz.
 */

import { Interpreter } from './interpreter';
import type { Hardware, Signal } from './hardware';

/** Ejecuta un sketch sobre un {@link Hardware}. */
export class SketchRunner {
  private timer: ReturnType<typeof setTimeout> | null = null;
  private gen: Generator<Signal, void, undefined> | null = null;
  private onError: (message: string) => void;

  /** @param onError Se invoca con un mensaje en español si el sketch falla. */
  constructor(onError: (message: string) => void) {
    this.onError = onError;
  }

  /**
   * Parsea e inicia el sketch. Los errores de sintaxis se informan por `onError` y no se lanzan.
   * @returns `true` si el sketch arrancó.
   */
  start(source: string, hw: Hardware): boolean {
    this.stop();
    try {
      this.gen = new Interpreter(source, hw).run();
    } catch (err) {
      this.onError(err instanceof Error ? err.message : String(err));
      return false;
    }
    this.pump();
    return true;
  }

  /** Detiene la ejecución. */
  stop(): void {
    if (this.timer) clearTimeout(this.timer);
    this.timer = null;
    this.gen = null;
  }

  private pump(): void {
    const gen = this.gen;
    if (!gen) return;
    try {
      const r = gen.next();
      if (r.done) return;
      const delay = r.value.type === 'delay' ? r.value.ms : 0;
      this.timer = setTimeout(() => this.pump(), delay);
    } catch (err) {
      this.stop();
      this.onError(err instanceof Error ? err.message : String(err));
    }
  }
}
