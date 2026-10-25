/**
 * @file avrRunner.ts
 * @description Motor de emulación para microcontrolador ATmega328P (Arduino Uno) basado en AVR8js.
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
  private animFrameId: number | null = null;
  private intervalId: any = null;
  private onPinChangeCallback: PinChangeCallback | null = null;
  private onSerialOutputCallback: SerialOutputCallback | null = null;

  // Estado lógico de los pines mapeados
  public pinStates: PinStateMap = {};

  constructor() {
    // Memoria Flash de 32KB para ATmega328P
    const program = new Uint16Array(16384);
    this.cpu = new CPU(program);

    // Inicializar puertos de E/S
    this.portB = new AVRIOPort(this.cpu, portBConfig);
    this.portC = new AVRIOPort(this.cpu, portCConfig);
    this.portD = new AVRIOPort(this.cpu, portDConfig);

    // Inicializar temporizadores de hardware
    this.timer0 = new AVRTimer(this.cpu, timer0Config);
    this.timer1 = new AVRTimer(this.cpu, timer1Config);
    this.timer2 = new AVRTimer(this.cpu, timer2Config);

    // Inicializar USART / Monitor Serial
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
    // Port B: Pines 8 al 13 (PB0 = Pin 8, PB5 = Pin 13 / LED L)
    this.portB.addListener((value) => {
      for (let bit = 0; bit <= 5; bit++) {
        const pinNum = (8 + bit).toString();
        const isHigh = Boolean(value & (1 << bit));
        this.updatePinState(pinNum, isHigh, isHigh ? 255 : 0);
      }
    });

    // Port D: Pines 0 al 7 (PD0 = RX, PD1 = TX, etc.)
    this.portD.addListener((value) => {
      for (let bit = 0; bit <= 7; bit++) {
        const pinNum = bit.toString();
        const isHigh = Boolean(value & (1 << bit));
        this.updatePinState(pinNum, isHigh, isHigh ? 255 : 0);
      }
    });

    // Port C: Pines Analógicos A0 al A5
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

  /**
   * Envía un valor digital o analógico simulado desde un componente exterior hacia el Arduino.
   */
  public setExternalInput(pin: string, isHigh: boolean) {
    const pinNum = parseInt(pin, 10);
    if (!isNaN(pinNum)) {
      if (pinNum >= 8 && pinNum <= 13) {
        const bit = pinNum - 8;
        this.portB.setPin(bit, isHigh);
      } else if (pinNum >= 0 && pinNum <= 7) {
        this.portD.setPin(pinNum, isHigh);
      }
    }
  }

  /**
   * Ejecuta un sketch interpretado de Arduino con sincronización de estado y temporización.
   */
  public startSketch(code: string) {
    this.stop();
    this.isRunning = true;
    this.initDefaultPinStates();

    // Interpretar las instrucciones del sketch para simulación de alta respuesta
    this.runParsedSketch(code);
  }

  private runParsedSketch(code: string) {
    // Extraer comandos setup y loop
    const setupLines: string[] = [];
    const loopLines: string[] = [];

    const setupMatch = code.match(/void\s+setup\s*\(\)\s*\{([\s\S]*?)\n\}/);
    const loopMatch = code.match(/void\s+loop\s*\(\)\s*\{([\s\S]*?)\n\}/);

    if (setupMatch) {
      setupLines.push(...setupMatch[1].split('\n').map((l) => l.trim()).filter(Boolean));
    }
    if (loopMatch) {
      loopLines.push(...loopMatch[1].split('\n').map((l) => l.trim()).filter(Boolean));
    }

    // 1. Ejecutar Setup una sola vez
    this.executeLines(setupLines);

    // 2. Loop continuo asíncrono con temporizador no bloqueante
    let loopIndex = 0;

    const executeNextLoopStep = () => {
      if (!this.isRunning) return;

      if (loopLines.length === 0) {
        this.intervalId = setTimeout(executeNextLoopStep, 100);
        return;
      }

      const line = loopLines[loopIndex];
      loopIndex = (loopIndex + 1) % loopLines.length;

      let waitTime = 20; // Tiempo por defecto entre instrucciones rápidas

      if (line.includes('delay(')) {
        const match = line.match(/delay\s*\(\s*(\d+)\s*\)/);
        if (match) {
          waitTime = Math.max(10, parseInt(match[1], 10));
        }
      } else {
        this.executeLine(line);
      }

      this.intervalId = setTimeout(executeNextLoopStep, waitTime);
    };

    this.intervalId = setTimeout(executeNextLoopStep, 50);
  }

  private executeLines(lines: string[]) {
    for (const line of lines) {
      this.executeLine(line);
    }
  }

  private executeLine(line: string) {
    // digitalWrite(pin, HIGH/LOW)
    const dwMatch = line.match(/digitalWrite\s*\(\s*([A-Za-z0-9_]+)\s*,\s*(HIGH|LOW|1|0)\s*\)/);
    if (dwMatch) {
      const pin = dwMatch[1];
      const isHigh = dwMatch[2] === 'HIGH' || dwMatch[2] === '1';
      this.updatePinState(pin, isHigh, isHigh ? 255 : 0);
      return;
    }

    // analogWrite(pin, value) (PWM)
    const awMatch = line.match(/analogWrite\s*\(\s*([A-Za-z0-9_]+)\s*,\s*(\d+)\s*\)/);
    if (awMatch) {
      const pin = awMatch[1];
      const val = parseInt(awMatch[2], 10);
      this.updatePinState(pin, val > 0, val);
      return;
    }

    // pinMode(pin, OUTPUT/INPUT)
    const pmMatch = line.match(/pinMode\s*\(\s*([A-Za-z0-9_]+)\s*,\s*([A-Za-z0-9_]+)\s*\)/);
    if (pmMatch) {
      const pin = pmMatch[1];
      const mode = pmMatch[2] as any;
      if (this.pinStates[pin]) {
        this.pinStates[pin].mode = mode;
      }
      return;
    }

    // Serial.println / Serial.print
    const spMatch = line.match(/Serial\.(println|print)\s*\(\s*["']?([^"')]+)["']?\s*\)/);
    if (spMatch) {
      const isPrintln = spMatch[1] === 'println';
      const text = spMatch[2] + (isPrintln ? '\n' : '');
      this.onSerialOutputCallback?.(text);
      return;
    }

    // servo_X.write(angle)
    const servoMatch = line.match(/servo_([A-Za-z0-9_]+)\.write\s*\(\s*(\d+)\s*\)/);
    if (servoMatch) {
      const pin = servoMatch[1];
      const angle = parseInt(servoMatch[2], 10);
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
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
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

// Instancia singleton para el ciclo de emulación de la aplicación
export const avrSimulator = new AvrRunner();
