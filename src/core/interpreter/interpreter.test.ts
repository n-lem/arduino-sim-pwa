import { describe, it, expect } from 'vitest';
import { Interpreter } from './interpreter';
import type { Hardware, Signal } from './hardware';

/** Hardware falso con reloj virtual que avanza con cada delay. */
function fakeHw() {
  let now = 0;
  const log: string[] = [];
  let out = '';
  const hw: Hardware = {
    pinMode: (p, m) => log.push(`mode ${p} ${m}`),
    digitalWrite: (p, v) => log.push(`dw ${p} ${v}`),
    digitalRead: () => 0,
    analogWrite: (p, v) => log.push(`aw ${p} ${v}`),
    analogRead: () => 512,
    serialWrite: (t) => { out += t; },
    serialAvailable: () => 0,
    serialRead: () => -1,
    servoWrite: (p, a) => log.push(`servo ${p} ${a}`),
    millis: () => Math.floor(now / 1000),
    micros: () => now,
    pulseIn: () => 0,
    tone: () => {},
    noTone: () => {},
  };
  return { hw, log, out: () => out, advance: (ms: number) => { now += ms * 1000; } };
}

/** Ejecuta hasta `maxDelays` delays y devuelve el hardware falso. */
function runSketch(src: string, maxDelays = 3) {
  const f = fakeHw();
  const gen = new Interpreter(src, f.hw).run();
  let delays = 0;
  while (delays < maxDelays) {
    const r = gen.next();
    if (r.done) break;
    const s = r.value as Signal;
    if (s.type === 'delay') { delays++; f.advance(s.ms); }
  }
  return f;
}

describe('Interpreter', () => {
  it('parpadea un LED', () => {
    const f = runSketch(`
      #define LED 13
      void setup() { pinMode(LED, OUTPUT); }
      void loop() { digitalWrite(LED, HIGH); delay(1000); digitalWrite(LED, LOW); delay(1000); }`, 2);
    expect(f.log).toEqual(['mode 13 1', 'dw 13 1', 'dw 13 0']);
  });

  it('soporta variables, for, arrays y Serial', () => {
    const f = runSketch(`
      int v[3] = {10, 20, 30};
      void setup() { Serial.begin(9600); int s = 0; for (int i = 0; i < 3; i++) { s += v[i]; } Serial.println(s); }
      void loop() { delay(1); }`, 1);
    expect(f.out()).toBe('60\n');
  });

  it('división entera vs flotante', () => {
    const f = runSketch(`
      void setup() { float x = 7 / 2; float y = 7 / 2.0; Serial.println(x); Serial.println(y); }
      void loop() { delay(1); }`, 1);
    expect(f.out()).toBe('3.00\n3.50\n');
  });

  it('funciones de usuario, switch y while', () => {
    const f = runSketch(`
      int doble(int n) { return n * 2; }
      void setup() {
        int k = 0;
        while (k < 3) k++;
        switch (doble(k)) { case 6: Serial.print("seis"); break; default: Serial.print("otro"); }
      }
      void loop() { delay(1); }`, 1);
    expect(f.out()).toBe('seis');
  });

  it('Servo y desbordamiento de byte', () => {
    const f = runSketch(`
      Servo s;
      void setup() { s.attach(9); byte b = 255; b++; s.write(b + 90); }
      void loop() { delay(1); }`, 1);
    expect(f.log).toContain('servo 9 90');
  });

  it('strings', () => {
    const f = runSketch(`
      void setup() { String a = "Hola"; a += " mundo"; Serial.println(a.length()); Serial.println(a + 1); }
      void loop() { delay(1); }`, 1);
    expect(f.out()).toBe('10\nHola mundo1\n');
  });

  it('informa errores de sintaxis con línea', () => {
    expect(() => new Interpreter('void setup() {\n int x = ;\n}\nvoid loop(){}', fakeHw().hw)).toThrow(/Línea 2/);
  });

  it('exige setup y loop', () => {
    expect(() => new Interpreter('void setup() {}', fakeHw().hw)).toThrow(/loop/);
  });
});
