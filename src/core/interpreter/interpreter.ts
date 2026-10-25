/**
 * @file interpreter.ts
 * @description Intérprete cooperativo (basado en generadores) de un subconjunto de C++ Arduino.
 * `delay()` y los bucles largos ceden el control con `yield`, de modo que la UI nunca se congela.
 */

import { SketchError } from './lexer';
import { parseSketch, isFloatType, type Expr, type Stmt, type Program, type FuncDef } from './parser';
import { getLibrary, type Hardware, type Signal, type LibraryObject } from './hardware';

type Value = number | string | Value[] | LibraryObject;
type Completion = undefined | 'break' | 'continue' | { ret: Value };
type Gen<T> = Generator<Signal, T, undefined>;

interface Variable { type: string; value: Value }

class Scope {
  private vars = new Map<string, Variable>();
  parent: Scope | null;
  constructor(parent: Scope | null = null) { this.parent = parent; }
  find(name: string): Variable | undefined {
    return this.vars.get(name) ?? this.parent?.find(name);
  }
  declare(name: string, v: Variable): void { this.vars.set(name, v); }
}

const CONSTANTS: Record<string, number> = {
  HIGH: 1, LOW: 0, INPUT: 0, OUTPUT: 1, INPUT_PULLUP: 2, LED_BUILTIN: 13, true: 1, false: 0, TRUE: 1, FALSE: 0,
  PI: Math.PI, HALF_PI: Math.PI / 2, TWO_PI: Math.PI * 2, DEG_TO_RAD: Math.PI / 180, RAD_TO_DEG: 180 / Math.PI,
  A0: 14, A1: 15, A2: 16, A3: 17, A4: 18, A5: 19, A6: 20, A7: 21,
  DEC: 10, HEX: 16, OCT: 8, BIN: 2, NULL: 0, MSBFIRST: 1, LSBFIRST: 0, SERIAL_8N1: 0,
  CHANGE: 1, RISING: 3, FALLING: 2,
};

const FLOAT_FUNCS = new Set(['sqrt', 'pow', 'sin', 'cos', 'tan', 'atan', 'atan2', 'log', 'log10', 'exp', 'radians', 'degrees', 'float', 'double']);
const MAX_CALL_DEPTH = 120;

/** Convierte un valor al tipo declarado imitando el desbordamiento de enteros del AVR. */
export function coerce(type: string, v: Value): Value {
  if (type === 'String') return typeof v === 'string' ? v : formatValue(v);
  if (typeof v !== 'number') return v;
  if (isFloatType(type)) return v;
  const n = Math.trunc(Number.isFinite(v) ? v : 0);
  switch (type) {
    case 'bool': case 'boolean': return v ? 1 : 0;
    case 'byte': case 'uint8_t': case 'unsigned char': return n & 0xff;
    case 'char': case 'int8_t': return (n << 24) >> 24;
    case 'int': case 'short': case 'int16_t': return (n << 16) >> 16;
    case 'unsigned int': case 'unsigned short': case 'uint16_t': case 'word': return n & 0xffff;
    case 'unsigned long': case 'uint32_t': case 'size_t': return n >>> 0;
    case 'long': case 'int32_t': return n | 0;
    default: return n;
  }
}

/** Formatea un número como lo haría Serial.print (enteros sin decimales, flotantes con 2). */
export function formatValue(v: Value, decimals?: number): string {
  if (typeof v === 'string') return v;
  if (typeof v === 'number') {
    if (decimals !== undefined) return v.toFixed(decimals);
    return Number.isInteger(v) ? String(v) : v.toFixed(2);
  }
  return '';
}

function toNum(v: Value, line?: number): number {
  if (typeof v === 'number') return v;
  if (typeof v === 'string') { const n = parseFloat(v); return Number.isNaN(n) ? 0 : n; }
  throw new SketchError('Se esperaba un número', line);
}

/** Intérprete de un programa Arduino ya parseado. */
export class Interpreter {
  private prog: Program;
  private globals = new Scope();
  private steps = 0;
  private lastYield = 0;
  private depth = 0;
  private rngState = 1;
  private serialTimeout = 1000;

  private hw: Hardware;

  constructor(source: string, hw: Hardware) {
    this.hw = hw;
    this.prog = parseSketch(source);
    if (!this.prog.funcs.setup) throw new SketchError('Falta la función void setup()');
    if (!this.prog.funcs.loop) throw new SketchError('Falta la función void loop()');
  }

  /** Ejecuta globales, `setup()` y `loop()` indefinidamente, cediendo señales al planificador. */
  *run(): Gen<void> {
    this.lastYield = this.hw.micros();
    for (const g of this.prog.globals) yield* this.exec(g, this.globals);
    yield* this.callUser(this.prog.funcs.setup, []);
    for (;;) {
      yield* this.callUser(this.prog.funcs.loop, []);
      // Garantiza progreso del reloj aunque loop() no tenga delay.
      yield { type: 'yield' };
    }
  }

  private *tick(): Gen<void> {
    if ((++this.steps & 255) === 0) {
      const now = this.hw.micros();
      if (now - this.lastYield > 8000) {
        yield { type: 'yield' };
        this.lastYield = this.hw.micros();
      }
    }
  }

  // ---------- Sentencias ----------

  private *execBody(list: Stmt[], scope: Scope): Gen<Completion> {
    for (const s of list) {
      const c = yield* this.exec(s, scope);
      if (c) return c;
    }
    return undefined;
  }

  private *exec(s: Stmt, scope: Scope): Gen<Completion> {
    yield* this.tick();
    switch (s.k) {
      case 'empty': return undefined;
      case 'block': return yield* this.execBody(s.body, new Scope(scope));
      case 'expr': yield* this.eval(s.e, scope); return undefined;
      case 'decl': {
        for (const it of s.items) {
          if (it.isArray) {
            let arr: Value[];
            if (it.init && it.init.k === 'list') arr = (yield* this.eval(it.init, scope)) as Value[];
            else if (it.init && it.init.k === 'str') arr = [...(it.init.v as string)].map((c) => c.charCodeAt(0));
            else arr = [];
            const size = it.size ? toNum(yield* this.eval(it.size, scope), s.line) : arr.length;
            while (arr.length < size) arr.push(it.size && it.init === null ? 0 : 0);
            scope.declare(it.name, { type: s.type, value: arr.map((x) => (Array.isArray(x) ? x : coerce(s.type, x))) });
          } else if (getLibrary(s.type)) {
            const args: Value[] = [];
            for (const a of it.ctorArgs ?? []) args.push(yield* this.eval(a, scope));
            scope.declare(it.name, { type: s.type, value: getLibrary(s.type)!(args, this.hw) });
          } else if (/^LiquidCrystal/.test(s.type)) {
            throw new SketchError(`La librería ${s.type} todavía no está disponible en el simulador`, s.line);
          } else {
            let v: Value = s.type === 'String' ? '' : 0;
            if (it.ctorArgs && it.ctorArgs.length) v = yield* this.eval(it.ctorArgs[0], scope);
            if (it.init) v = yield* this.eval(it.init, scope);
            scope.declare(it.name, { type: s.type, value: coerce(s.type, v) });
          }
        }
        return undefined;
      }
      case 'if': {
        if (toNum(yield* this.eval(s.c, scope))) return yield* this.exec(s.a, scope);
        return s.b ? yield* this.exec(s.b, scope) : undefined;
      }
      case 'while': {
        while (toNum(yield* this.eval(s.c, scope))) {
          const c = yield* this.exec(s.body, scope);
          if (c === 'break') break;
          if (c && c !== 'continue') return c;
          yield* this.tick();
        }
        return undefined;
      }
      case 'do': {
        do {
          const c = yield* this.exec(s.body, scope);
          if (c === 'break') break;
          if (c && c !== 'continue') return c;
          yield* this.tick();
        } while (toNum(yield* this.eval(s.c, scope)));
        return undefined;
      }
      case 'for': {
        const inner = new Scope(scope);
        if (s.init) yield* this.exec(s.init, inner);
        while (!s.c || toNum(yield* this.eval(s.c, inner))) {
          const c = yield* this.exec(s.body, inner);
          if (c === 'break') break;
          if (c && c !== 'continue') return c;
          if (s.step) yield* this.eval(s.step, inner);
          yield* this.tick();
        }
        return undefined;
      }
      case 'switch': {
        const v = toNum(yield* this.eval(s.e, scope));
        let start = -1;
        for (let i = 0; i < s.cases.length && start < 0; i++) {
          const t = s.cases[i].test;
          if (t && toNum(yield* this.eval(t, scope)) === v) start = i;
        }
        if (start < 0) start = s.cases.findIndex((c) => c.test === null);
        if (start < 0) return undefined;
        const inner = new Scope(scope);
        for (let i = start; i < s.cases.length; i++) {
          const c = yield* this.execBody(s.cases[i].body, inner);
          if (c === 'break') return undefined;
          if (c) return c;
        }
        return undefined;
      }
      case 'break': return 'break';
      case 'continue': return 'continue';
      case 'return': return { ret: s.e ? yield* this.eval(s.e, scope) : 0 };
    }
  }

  // ---------- Funciones ----------

  private *callUser(f: FuncDef, args: Value[]): Gen<Value> {
    if (++this.depth > MAX_CALL_DEPTH) throw new SketchError('Demasiadas llamadas anidadas (¿recursión infinita?)');
    try {
      const scope = new Scope(this.globals);
      f.params.forEach((p, i) => {
        const a = args[i] ?? 0;
        scope.declare(p.name, { type: p.type, value: p.byRef && typeof a === 'object' ? a : coerce(p.type, a) });
      });
      const c = yield* this.exec(f.body, scope);
      return c && typeof c === 'object' && 'ret' in c ? coerce(f.retType, c.ret) : 0;
    } finally {
      this.depth--;
    }
  }

  // ---------- Expresiones ----------

  private isFloatExpr(e: Expr, scope: Scope): boolean {
    switch (e.k) {
      case 'num': return e.f;
      case 'id': { const v = scope.find(e.name); return !!v && isFloatType(v.type) && !Array.isArray(v.value); }
      case 'index': return this.isFloatExpr(e.obj, scope);
      case 'cast': return isFloatType(e.type);
      case 'bin': return ['+', '-', '*', '/'].includes(e.op) && (this.isFloatExpr(e.l, scope) || this.isFloatExpr(e.r, scope));
      case 'un': return e.op !== '!' && this.isFloatExpr(e.e, scope);
      case 'cond': return this.isFloatExpr(e.a, scope) || this.isFloatExpr(e.b, scope);
      case 'assign': return this.isFloatExpr(e.t, scope);
      case 'call': return FLOAT_FUNCS.has(e.name) || (!!this.prog.funcs[e.name] && isFloatType(this.prog.funcs[e.name].retType));
      default: return false;
    }
  }

  private rootVar(e: Expr, scope: Scope): Variable | undefined {
    if (e.k === 'id') return scope.find(e.name);
    if (e.k === 'index') return this.rootVar(e.obj, scope);
    return undefined;
  }

  private *assign(target: Expr, value: Value, scope: Scope): Gen<Value> {
    if (target.k === 'id') {
      const v = scope.find(target.name);
      if (!v) throw new SketchError(`La variable "${target.name}" no fue declarada`, target.line);
      v.value = coerce(v.type, value);
      return v.value;
    }
    if (target.k === 'index') {
      const arr = yield* this.eval(target.obj, scope);
      const idx = toNum(yield* this.eval(target.idx, scope), target.line);
      if (!Array.isArray(arr)) throw new SketchError('Solo se puede indexar un arreglo', target.line);
      if (idx < 0 || idx >= arr.length) throw new SketchError(`Índice ${idx} fuera del arreglo (tamaño ${arr.length})`, target.line);
      const type = this.rootVar(target, scope)?.type ?? 'int';
      arr[idx] = Array.isArray(arr[idx]) ? value : coerce(type, value);
      return arr[idx];
    }
    throw new SketchError('No se puede asignar a esta expresión');
  }

  private *evalArgs(args: Expr[], scope: Scope): Gen<Value[]> {
    const out: Value[] = [];
    for (const a of args) out.push(yield* this.eval(a, scope));
    return out;
  }

  private *eval(e: Expr, scope: Scope): Gen<Value> {
    switch (e.k) {
      case 'num': return e.v;
      case 'str': return e.v;
      case 'list': return yield* this.evalArgs(e.items, scope);
      case 'id': {
        const v = scope.find(e.name);
        if (v) return v.value;
        if (e.name in CONSTANTS) return CONSTANTS[e.name];
        throw new SketchError(`"${e.name}" no fue declarado`, e.line);
      }
      case 'un': {
        const v = toNum(yield* this.eval(e.e, scope));
        return e.op === '-' ? -v : e.op === '!' ? (v ? 0 : 1) : e.op === '~' ? ~v : v;
      }
      case 'cast': return coerce(e.type, yield* this.eval(e.e, scope));
      case 'cond': return toNum(yield* this.eval(e.c, scope)) ? yield* this.eval(e.a, scope) : yield* this.eval(e.b, scope);
      case 'index': {
        const arr = yield* this.eval(e.obj, scope);
        const i = toNum(yield* this.eval(e.idx, scope), e.line);
        if (typeof arr === 'string') return arr.charCodeAt(i) || 0;
        if (!Array.isArray(arr)) throw new SketchError('Solo se puede indexar un arreglo', e.line);
        if (i < 0 || i >= arr.length) throw new SketchError(`Índice ${i} fuera del arreglo (tamaño ${arr.length})`, e.line);
        return arr[i];
      }
      case 'assign': {
        let v = yield* this.eval(e.e, scope);
        if (e.op !== '=') {
          const cur = yield* this.eval(e.t, scope);
          v = this.binary(e.op.slice(0, -1), cur, v, this.isFloatExpr(e.t, scope) || this.isFloatExpr(e.e, scope), e.line);
        }
        return yield* this.assign(e.t, v, scope);
      }
      case 'incdec': {
        const cur = toNum(yield* this.eval(e.t, scope));
        const next = yield* this.assign(e.t, e.op === '++' ? cur + 1 : cur - 1, scope);
        return e.prefix ? next : cur;
      }
      case 'bin': {
        if (e.op === '&&') return toNum(yield* this.eval(e.l, scope)) && toNum(yield* this.eval(e.r, scope)) ? 1 : 0;
        if (e.op === '||') return toNum(yield* this.eval(e.l, scope)) || toNum(yield* this.eval(e.r, scope)) ? 1 : 0;
        const l = yield* this.eval(e.l, scope);
        const r = yield* this.eval(e.r, scope);
        if (e.op === ',') return r;
        return this.binary(e.op, l, r, this.isFloatExpr(e.l, scope) || this.isFloatExpr(e.r, scope), e.line);
      }
      case 'call': return yield* this.call(e, scope);
      case 'member': return yield* this.member(e, scope);
    }
  }

  private binary(op: string, l: Value, r: Value, float: boolean, line: number): Value {
    if (op === '+' && (typeof l === 'string' || typeof r === 'string')) return formatValue(l as Value) + formatValue(r as Value);
    if (typeof l === 'string' && typeof r === 'string' && (op === '==' || op === '!=')) return (l === r) === (op === '==') ? 1 : 0;
    const a = toNum(l, line);
    const b = toNum(r, line);
    switch (op) {
      case '+': return a + b;
      case '-': return a - b;
      case '*': return a * b;
      case '/': return b === 0 ? 0 : float ? a / b : Math.trunc(a / b);
      case '%': return b === 0 ? 0 : a % b;
      case '==': return a === b ? 1 : 0;
      case '!=': return a !== b ? 1 : 0;
      case '<': return a < b ? 1 : 0;
      case '>': return a > b ? 1 : 0;
      case '<=': return a <= b ? 1 : 0;
      case '>=': return a >= b ? 1 : 0;
      case '&': return a & b;
      case '|': return a | b;
      case '^': return a ^ b;
      case '<<': return a << b;
      case '>>': return a >> b;
    }
    throw new SketchError(`Operador "${op}" no soportado`, line);
  }

  // ---------- Llamadas ----------

  private random(): number {
    this.rngState = (Math.imul(this.rngState, 1103515245) + 12345) >>> 0;
    return this.rngState / 4294967296;
  }

  private *call(e: Extract<Expr, { k: 'call' }>, scope: Scope): Gen<Value> {
    const user = this.prog.funcs[e.name];
    if (user) return yield* this.callUser(user, yield* this.evalArgs(e.args, scope));
    const a = yield* this.evalArgs(e.args, scope);
    const n = (i: number): number => toNum(a[i] ?? 0, e.line);
    const hw = this.hw;

    switch (e.name) {
      case 'delay': yield { type: 'delay', ms: Math.max(0, n(0)) }; this.lastYield = hw.micros(); return 0;
      case 'delayMicroseconds': {
        const us = n(0);
        if (us >= 1000) yield { type: 'delay', ms: us / 1000 };
        return 0;
      }
      case 'pinMode': hw.pinMode(n(0), n(1)); return 0;
      case 'digitalWrite': hw.digitalWrite(n(0), n(1) ? 1 : 0); return 0;
      case 'digitalRead': return hw.digitalRead(n(0));
      case 'analogWrite': hw.analogWrite(n(0), Math.max(0, Math.min(255, Math.round(n(1))))); return 0;
      case 'analogRead': return hw.analogRead(n(0));
      case 'analogReference': case 'attachInterrupt': case 'detachInterrupt': case 'noInterrupts': case 'interrupts': return 0;
      case 'digitalPinToInterrupt': return n(0);
      case 'millis': return hw.millis() >>> 0;
      case 'micros': return hw.micros() >>> 0;
      case 'pulseIn': return hw.pulseIn(n(0), n(1), a.length > 2 ? n(2) : 1000000);
      case 'tone': hw.tone(n(0), n(1), a.length > 2 ? n(2) : 0); return 0;
      case 'noTone': hw.noTone(n(0)); return 0;
      case 'abs': return Math.abs(n(0));
      case 'min': return Math.min(n(0), n(1));
      case 'max': return Math.max(n(0), n(1));
      case 'constrain': return Math.min(Math.max(n(0), n(1)), n(2));
      case 'map': {
        const d = n(2) - n(1);
        return d === 0 ? n(3) : Math.trunc(((n(0) - n(1)) * (n(4) - n(3))) / d + n(3));
      }
      case 'pow': return Math.pow(n(0), n(1));
      case 'sqrt': return Math.sqrt(n(0));
      case 'sq': return n(0) * n(0);
      case 'sin': return Math.sin(n(0));
      case 'cos': return Math.cos(n(0));
      case 'tan': return Math.tan(n(0));
      case 'atan': return Math.atan(n(0));
      case 'atan2': return Math.atan2(n(0), n(1));
      case 'log': return Math.log(n(0));
      case 'log10': return Math.log10(n(0));
      case 'exp': return Math.exp(n(0));
      case 'floor': return Math.floor(n(0));
      case 'ceil': return Math.ceil(n(0));
      case 'round': return Math.round(n(0));
      case 'radians': return (n(0) * Math.PI) / 180;
      case 'degrees': return (n(0) * 180) / Math.PI;
      case 'randomSeed': this.rngState = (n(0) >>> 0) || 1; return 0;
      case 'random': return a.length > 1 ? n(0) + Math.floor(this.random() * (n(1) - n(0))) : Math.floor(this.random() * n(0));
      case 'bitRead': return (n(0) >> n(1)) & 1;
      case 'bitSet': return n(0) | (1 << n(1));
      case 'bitClear': return n(0) & ~(1 << n(1));
      case 'bitWrite': return n(2) ? n(0) | (1 << n(1)) : n(0) & ~(1 << n(1));
      case 'lowByte': return n(0) & 0xff;
      case 'highByte': return (n(0) >> 8) & 0xff;
      case 'isDigit': return /[0-9]/.test(String.fromCharCode(n(0))) ? 1 : 0;
      case 'isAlpha': return /[A-Za-z]/.test(String.fromCharCode(n(0))) ? 1 : 0;
      case 'String': return a.length ? formatValue(a[0]) : '';
      case 'int': case 'long': case 'byte': case 'char': case 'float': case 'double': case 'word': case 'bool': case 'boolean':
        return coerce(e.name, a[0] ?? 0);
    }
    throw new SketchError(`La función "${e.name}" no existe o todavía no está soportada`, e.line);
  }

  private *member(e: Extract<Expr, { k: 'member' }>, scope: Scope): Gen<Value> {
    if (e.obj.k === 'id' && e.obj.name === 'Serial' && !scope.find('Serial')) return yield* this.serial(e, scope);
    const obj = yield* this.eval(e.obj, scope);
    const args = e.args ? yield* this.evalArgs(e.args, scope) : [];
    const n = (i: number): number => toNum(args[i] ?? 0, e.line);

    if (typeof obj === 'string') {
      switch (e.name) {
        case 'length': return obj.length;
        case 'charAt': return obj.charAt(n(0));
        case 'substring': return obj.substring(n(0), args.length > 1 ? n(1) : undefined);
        case 'indexOf': return obj.indexOf(typeof args[0] === 'number' ? String.fromCharCode(args[0]) : String(args[0]));
        case 'toInt': return parseInt(obj, 10) || 0;
        case 'toFloat': return parseFloat(obj) || 0;
        case 'equals': return obj === args[0] ? 1 : 0;
        case 'toUpperCase': return obj.toUpperCase();
        case 'toLowerCase': return obj.toLowerCase();
        case 'trim': return obj.trim();
        case 'startsWith': return obj.startsWith(String(args[0])) ? 1 : 0;
        case 'endsWith': return obj.endsWith(String(args[0])) ? 1 : 0;
        case 'concat': return obj + formatValue(args[0]);
        case 'c_str': return obj;
      }
    } else if (obj && !Array.isArray(obj) && typeof obj === 'object') {
      const fn = (obj as LibraryObject)[e.name];
      if (typeof fn === 'function') {
        const r = fn(...args);
        return typeof r === 'number' || typeof r === 'string' ? r : 0;
      }
    }
    throw new SketchError(`El método "${e.name}" no existe para este objeto`, e.line);
  }

  private *serial(e: Extract<Expr, { k: 'member' }>, scope: Scope): Gen<Value> {
    const args = e.args ? yield* this.evalArgs(e.args, scope) : [];
    const hw = this.hw;
    switch (e.name) {
      case 'begin': case 'end': case 'flush': return 0;
      case 'setTimeout': this.serialTimeout = toNum(args[0] ?? 0); return 0;
      case 'available': return hw.serialAvailable();
      case 'read': return hw.serialAvailable() ? hw.serialRead() : -1;
      case 'peek': return -1;
      case 'write': hw.serialWrite(typeof args[0] === 'string' ? args[0] : String.fromCharCode(toNum(args[0] ?? 0))); return 1;
      case 'parseInt': case 'parseFloat': {
        let s = '';
        const deadline = hw.millis() + this.serialTimeout;
        while (hw.serialAvailable() || (!s && hw.millis() < deadline)) {
          if (!hw.serialAvailable()) { yield { type: 'delay', ms: 5 }; continue; }
          const c = String.fromCharCode(hw.serialRead());
          if (/[0-9.\-]/.test(c)) s += c; else if (s) break;
        }
        return e.name === 'parseInt' ? parseInt(s, 10) || 0 : parseFloat(s) || 0;
      }
      case 'print': case 'println': {
        const arg = e.args?.[0];
        let text = '';
        if (arg) {
          const v = args[0];
          if (typeof v === 'number' && args.length > 1) {
            const base = toNum(args[1]);
            text = this.isFloatExpr(arg, scope) ? v.toFixed(base)
              : base === 16 ? Math.trunc(v >>> 0).toString(16).toUpperCase() : base === 2 ? (v >>> 0).toString(2) : base === 8 ? (v >>> 0).toString(8) : String(v);
          } else if (typeof v === 'number' && this.isFloatExpr(arg, scope)) text = v.toFixed(2);
          else text = formatValue(v);
        }
        hw.serialWrite(text + (e.name === 'println' ? '\n' : ''));
        return text.length;
      }
    }
    throw new SketchError(`Serial.${e.name} no está soportado`, e.line);
  }
}
