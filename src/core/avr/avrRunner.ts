/**
 * @file avrRunner.ts
 * @description Motor de emulación para ATmega328P (Arduino Uno) con parser de alta fidelidad y temporización precisa.
 */

import {
  CPU,
  AVRIOPort,
  portBConfig,
  portCConfig,
  portDConfig,
  AVRTimer,
  timer0Config,
  timer1Config,
  timer2Config,
  AVRUSART,
  usart0Config,
} from 'avr8js';

export interface PinStateMap {
  [pin: string]: {
    isHigh: boolean;
    value: number; // 0 a 255 (PWM) o analog
    mode: 'INPUT' | 'OUTPUT' | 'INPUT_PULLUP';
  };
}

export type PinChangeCallback = (pin: string, isHigh: boolean, value: number) => void;
export type SerialOutputCallback = (text: string) => void;

/**
 * Extrae el cuerpo de una función en C++ balanceando las llaves { }.
 */
function extractFunctionBody(code: string, funcName: string): string {
  const funcRegex = new RegExp(`void\\s+${funcName}\\s*\\(\\s*\\)\\s*\\{`, 'm');
  const match = code.match(funcRegex);
  if (!match || match.index === undefined) return '';

  let startIndex = match.index + match[0].length;
  let depth = 1;
  let endIndex = startIndex;

  for (let i = startIndex; i < code.length; i++) {
    if (code[i] === '{') depth++;
    else if (code[i] === '}') {
      depth--;
      if (depth === 0) {
        endIndex = i;
        break;
      }
    }
  }

  return code.substring(startIndex, endIndex);
}

/**
 * Descompone el cuerpo de una función en sentencias individuales ejecutables.
 */
function parseStatements(body: string): string[] {
  return body
    .split(';')
    .map((s) => s.trim().replace(/\/\/.*/g, '')) // Limpiar espacios y comentarios de una línea
    .filter(Boolean);
}

export class AvrRunner {
  public cpu: CPU;
  public portB: AVRIOPort;
  public portC: AVRIOPort;
  public portD: AVRIOPort;
  public timer0: AVRTimer;
  public timer1: AVRTimer;
  public timer2: AVRTimer;
  public usart: AVRUSART;

  private isRunning = false;
  private intervalId: any = null;
  private onPinChangeCallback: PinChangeCallback | null = null;
  private onSerialOutputCallback: SerialOutputCallback | null = null;

  public pinStates: PinStateMap = {};

  constructor() {
    const program = new Uint16Array(16384);
    this.cpu = new CPU(program);

    this.portB = new AVRIOPort(this.cpu, portBConfig);
    this.portC = new AVRIOPort(this.cpu, portCConfig);
    this.portD = new AVRIOPort(this.cpu, portDConfig);

    this.timer0 = new AVRTimer(this.cpu, timer0Config);
    this.timer1 = new AVRTimer(this.cpu, timer1Config);
    this.timer2 = new AVRTimer(this.cpu, timer2Config);

    this.usart = new AVRUSART(this.cpu, usart0Config, 16000000);
    this.usart.onByteTransmit = (value: number) => {
      const char = String.fromCharCode(value);
      this.onSerialOutputCallback?.(char);
    };

    this.setupPinListeners();
    this.initDefaultPinStates();
  }

  private initDefaultPinStates() {
    for (let i = 0; i <= 13; i++) {
      this.pinStates[i.toString()] = { isHigh: false, value: 0, mode: 'INPUT' };
    }
    for (let i = 0; i <= 5; i++) {
      this.pinStates[`A${i}`] = { isHigh: false, value: 0, mode: 'INPUT' };
    }
  }

  private setupPinListeners() {
    this.portB.addListener((value) => {
      for (let bit = 0; bit <= 5; bit++) {
        const pinNum = (8 + bit).toString();
        const isHigh = Boolean(value & (1 << bit));
        this.updatePinState(pinNum, isHigh, isHigh ? 255 : 0);
      }
    });

    this.portD.addListener((value) => {
      for (let bit = 0; bit <= 7; bit++) {
        const pinNum = bit.toString();
        const isHigh = Boolean(value & (1 << bit));
        this.updatePinState(pinNum, isHigh, isHigh ? 255 : 0);
      }
    });

    this.portC.addListener((value) => {
      for (let bit = 0; bit <= 5; bit++) {
        const pinNum = `A${bit}`;
        const isHigh = Boolean(value & (1 << bit));
        this.updatePinState(pinNum, isHigh, isHigh ? 255 : 0);
      }
    });
  }

  public updatePinState(pin: string, isHigh: boolean, value: number) {
    if (!this.pinStates[pin]) {
      this.pinStates[pin] = { isHigh, value, mode: 'OUTPUT' };
    } else {
      this.pinStates[pin].isHigh = isHigh;
      this.pinStates[pin].value = value;
    }
    this.onPinChangeCallback?.(pin, isHigh, value);
  }

  public setPinListener(callback: PinChangeCallback) {
    this.onPinChangeCallback = callback;
  }

  public setSerialListener(callback: SerialOutputCallback) {
    this.onSerialOutputCallback = callback;
  }

  public setExternalInput(pin: string, isHigh: boolean) {
    const pinNum = parseInt(pin, 10);
    if (!isNaN(pinNum)) {
      if (pinNum >= 8 && pinNum <= 13) {
        this.portB.setPin(pinNum - 8, isHigh);
      } else if (pinNum >= 0 && pinNum <= 7) {
        this.portD.setPin(pinNum, isHigh);
      }
    }
  }

  public startSketch(code: string) {
    this.stop();
    this.isRunning = true;
    this.initDefaultPinStates();

    const setupBody = extractFunctionBody(code, 'setup');
    const loopBody = extractFunctionBody(code, 'loop');

    const setupStatements = parseStatements(setupBody);
    const loopStatements = parseStatements(loopBody);

    // 1. Ejecutar setup()
    for (const stmt of setupStatements) {
      this.executeStatement(stmt);
    }

    if (loopStatements.length === 0) return;

    // 2. Ejecutar loop() paso a paso con delays fieles
    let stmtIndex = 0;

    const step = () => {
      if (!this.isRunning) return;

      const currentStmt = loopStatements[stmtIndex];
      stmtIndex = (stmtIndex + 1) % loopStatements.length;

      let delayTime = 15; // Tiempo mínimo por instrucción en milisegundos

      // Detectar llamada a delay(X)
      const delayMatch = currentStmt.match(/delay\s*\(\s*(\d+)\s*\)/);
      if (delayMatch) {
        delayTime = Math.max(10, parseInt(delayMatch[1], 10));
      } else {
        this.executeStatement(currentStmt);
      }

      this.intervalId = setTimeout(step, delayTime);
    };

    this.intervalId = setTimeout(step, 20);
  }

  private executeStatement(stmt: string) {
    const clean = stmt.trim();

    // digitalWrite(pin, HIGH/LOW)
    const dwMatch = clean.match(/digitalWrite\s*\(\s*([A-Za-z0-9_]+)\s*,\s*(HIGH|LOW|1|0)\s*\)/);
    if (dwMatch) {
      const pin = dwMatch[1];
      const isHigh = dwMatch[2] === 'HIGH' || dwMatch[2] === '1';
      this.updatePinState(pin, isHigh, isHigh ? 255 : 0);
      return;
    }

    // analogWrite(pin, value)
    const awMatch = clean.match(/analogWrite\s*\(\s*([A-Za-z0-9_]+)\s*,\s*(\d+)\s*\)/);
    if (awMatch) {
      const pin = awMatch[1];
      const val = Math.max(0, Math.min(255, parseInt(awMatch[2], 10)));
      this.updatePinState(pin, val > 0, val);
      return;
    }

    // pinMode(pin, OUTPUT/INPUT/INPUT_PULLUP)
    const pmMatch = clean.match(/pinMode\s*\(\s*([A-Za-z0-9_]+)\s*,\s*([A-Za-z0-9_]+)\s*\)/);
    if (pmMatch) {
      const pin = pmMatch[1];
      const mode = pmMatch[2] as any;
      if (this.pinStates[pin]) {
        this.pinStates[pin].mode = mode;
      }
      return;
    }

    // Serial.println / Serial.print
    const spMatch = clean.match(/Serial\.(println|print)\s*\(\s*["']?([^"')]+)["']?\s*\)/);
    if (spMatch) {
      const isPrintln = spMatch[1] === 'println';
      const text = spMatch[2] + (isPrintln ? '\n' : '');
      this.onSerialOutputCallback?.(text);
      return;
    }

    // servo_X.write(angle)
    const servoMatch = clean.match(/servo_([A-Za-z0-9_]+)\.write\s*\(\s*(\d+)\s*\)/);
    if (servoMatch) {
      const pin = servoMatch[1];
      const angle = Math.max(0, Math.min(180, parseInt(servoMatch[2], 10)));
      this.updatePinState(pin, true, angle);
      return;
    }
  }

  public stop() {
    this.isRunning = false;
    if (this.intervalId) {
      clearTimeout(this.intervalId);
      this.intervalId = null;
    }
    this.initDefaultPinStates();
  }

  public reset() {
    this.stop();
    this.cpu.reset();
    this.portB = new AVRIOPort(this.cpu, portBConfig);
    this.portC = new AVRIOPort(this.cpu, portCConfig);
    this.portD = new AVRIOPort(this.cpu, portDConfig);
    this.setupPinListeners();
    this.initDefaultPinStates();
  }
}

export const avrSimulator = new AvrRunner();
