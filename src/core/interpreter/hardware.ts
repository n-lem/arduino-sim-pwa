/**
 * @file hardware.ts
 * @description Contrato entre el intérprete y la placa simulada. Permite probar el intérprete
 * sin DOM y cambiar la placa (Uno, Nano...) sin tocar el lenguaje.
 */

/** Señales que el intérprete cede al planificador del runner. */
export type Signal = { type: 'delay'; ms: number } | { type: 'yield' };

/** Operaciones de hardware disponibles para un sketch. Los pines son numéricos (A0 = 14). */
export interface Hardware {
  pinMode(pin: number, mode: number): void;
  digitalWrite(pin: number, value: number): void;
  digitalRead(pin: number): number;
  analogWrite(pin: number, value: number): void;
  /** Devuelve 0..1023. */
  analogRead(pin: number): number;
  serialWrite(text: string): void;
  serialAvailable(): number;
  serialRead(): number;
  servoWrite(pin: number, angle: number): void;
  millis(): number;
  micros(): number;
  /** Duración del pulso en microsegundos (0 si no hay). */
  pulseIn(pin: number, level: number, timeoutUs: number): number;
  tone(pin: number, freq: number, durationMs: number): void;
  noTone(pin: number): void;
}

/** Objeto instanciable desde C++ (p. ej. Servo). Sus métodos se invocan por nombre. */
export type LibraryObject = Record<string, (...args: any[]) => unknown>;

/** Fábrica de una clase de librería. */
export type LibraryFactory = (args: unknown[], hw: Hardware) => LibraryObject;

const registry = new Map<string, LibraryFactory>();

/**
 * Registra una clase de librería (p. ej. "Servo"). Es el punto de extensión para librerías adicionales.
 * @param className Nombre de la clase tal como se usa en C++.
 * @param factory Crea la instancia a partir de los argumentos del constructor.
 */
export function registerLibrary(className: string, factory: LibraryFactory): void {
  registry.set(className, factory);
}

/** Obtiene la fábrica de una librería registrada. */
export function getLibrary(className: string): LibraryFactory | undefined {
  return registry.get(className);
}

registerLibrary('Servo', (_args, hw) => {
  let pin = -1;
  let angle = 0;
  return {
    attach: (p: number) => { pin = p; return 1; },
    detach: () => { pin = -1; },
    attached: () => (pin >= 0 ? 1 : 0),
    write: (a: number) => {
      angle = Math.max(0, Math.min(180, Math.round(a)));
      if (pin >= 0) hw.servoWrite(pin, angle);
    },
    writeMicroseconds: (us: number) => {
      angle = Math.max(0, Math.min(180, Math.round(((us - 544) * 180) / (2400 - 544))));
      if (pin >= 0) hw.servoWrite(pin, angle);
    },
    read: () => angle,
  };
});
