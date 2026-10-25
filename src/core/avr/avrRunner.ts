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
import { SketchRunner } from '../interpreter/sketchRunner';
import type { Hardware } from '../interpreter/hardware';
import { BOARD_PROFILES, type BoardProfile } from '../boards';

export interface PinStateMap {
  [pin: string]: {
    isHigh: boolean;
    value: number; // 0 a 255 (PWM) o analog
    mode: 'INPUT' | 'OUTPUT' | 'INPUT_PULLUP';
  };
}

export type PinChangeCallback = (pin: string, isHigh: boolean, value: number) => void;
/** freq = 0 significa silencio. */
export type ToneCallback = (pin: string, freq: number, durationMs: number) => void;
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

  private sketch = new SketchRunner((msg) => this.onErrorCallback?.(msg));
  private onErrorCallback: ((message: string) => void) | null = null;
  private inputLevels: Record<string, number> = {};
  private analogInputs: Record<string, number> = {};
  private pulseInputs: Record<string, number> = {};
  private onPinChangeCallback: PinChangeCallback | null = null;
  private onSerialOutputCallback: SerialOutputCallback | null = null;
  private onToneCallback: ToneCallback | null = null;
  private serialInput: number[] = [];
  private profile: BoardProfile = BOARD_PROFILES['arduino-uno'];

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

  /** Perfil de la placa activa: define los pines, la tensión lógica y la resolución del ADC. */
  public setBoard(profile: BoardProfile) {
    this.profile = profile;
    this.initDefaultPinStates();
  }

  private initDefaultPinStates() {
    this.pinStates = {};
    for (const p of this.profile.pins) {
      this.pinStates[p.key] = { isHigh: false, value: 0, mode: 'INPUT' };
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

  /** Registra el nivel eléctrico de un pin de entrada (calculado por el solver) para digitalRead. */
  public setExternalInput(pin: string, isHigh: boolean) {
    this.inputLevels[pin] = isHigh ? 1 : 0;
  }

  /** Fija la lectura analógica (0..adcMax de la placa) de un pin analógico. */
  public setAnalogInput(pin: string, value: number) {
    this.analogInputs[pin] = Math.max(0, Math.min(this.profile.adcMax, Math.round(value)));
  }

  /** Fija la duración (µs) que devolverá pulseIn() para un pin (p. ej. eco de un HC-SR04). */
  public setPulseInput(pin: string, micros: number) {
    this.pulseInputs[pin] = micros;
  }

  /** Borra las entradas externas (al detener o reiniciar la simulación). */
  public clearExternalInputs() {
    this.inputLevels = {};
    this.analogInputs = {};
    this.pulseInputs = {};
  }

  public setErrorListener(callback: (message: string) => void) {
    this.onErrorCallback = callback;
  }

  private pinKey(pin: number): string {
    if (this.profile.type === 'esp32') return String(pin);
    return pin >= 14 ? `A${pin - 14}` : String(pin);
  }

  /** Encola texto escrito por el usuario en el monitor serial para Serial.read()/available(). */
  public pushSerialInput(text: string) {
    for (const ch of text) this.serialInput.push(ch.charCodeAt(0));
  }

  /** Registra quién reproduce el sonido de tone()/noTone(). */
  public setToneListener(callback: ToneCallback) {
    this.onToneCallback = callback;
  }

  /** Adaptador entre el intérprete y los pines/serie simulados. */
  private createHardware(): Hardware {
    const startedAt = performance.now();
    return {
      constants: { LED_BUILTIN: this.profile.ledBuiltin },
      pinMode: (pin, mode) => {
        const key = this.pinKey(pin);
        const s = this.pinStates[key];
        if (!s) return;
        s.mode = mode === 1 ? 'OUTPUT' : mode === 2 ? 'INPUT_PULLUP' : 'INPUT';
        this.onPinChangeCallback?.(key, s.isHigh, s.value);
      },
      digitalWrite: (pin, v) => this.updatePinState(this.pinKey(pin), v === 1, v === 1 ? 255 : 0),
      analogWrite: (pin, v) => this.updatePinState(this.pinKey(pin), v > 0, v),
      digitalRead: (pin) => {
        const key = this.pinKey(pin);
        const st = this.pinStates[key];
        if (st?.mode === 'OUTPUT') return st.isHigh ? 1 : 0;
        return this.inputLevels[key] ?? (st?.mode === 'INPUT_PULLUP' ? 1 : 0);
      },
      analogRead: (pin) => this.analogInputs[this.pinKey(pin)] ?? 0,
      serialWrite: (text) => this.onSerialOutputCallback?.(text),
      serialAvailable: () => this.serialInput.length,
      serialRead: () => this.serialInput.shift() ?? -1,
      servoWrite: (pin, angle) => {
        const key = this.pinKey(pin);
        if (this.pinStates[key]) this.pinStates[key].mode = 'OUTPUT';
        this.updatePinState(key, true, angle);
      },
      millis: () => Math.floor(performance.now() - startedAt),
      micros: () => Math.floor((performance.now() - startedAt) * 1000),
      pulseIn: (pin) => this.pulseInputs[this.pinKey(pin)] ?? 0,
      tone: (pin, freq, durationMs) => this.onToneCallback?.(this.pinKey(pin), freq, durationMs),
      noTone: (pin) => this.onToneCallback?.(this.pinKey(pin), 0, 0),
    };
  }

  /**
   * Ejecuta el sketch con el intérprete C++. Los errores se informan por el listener de errores.
   * @param code Código fuente del sketch.
   */
  public startSketch(code: string) {
    this.stop();
    this.initDefaultPinStates();
    this.sketch.start(code, this.createHardware());
  }

  public stop() {
    this.sketch.stop();
    this.serialInput = [];
    this.onToneCallback?.('', 0, 0);
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
