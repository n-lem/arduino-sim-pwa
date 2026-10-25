/**
 * @file parser.ts
 * @description Parser recursivo descendente que convierte tokens en un AST de un subconjunto
 * de C++ Arduino (funciones, variables, arrays, control de flujo y expresiones).
 */

import { tokenize, SketchError, type Token } from './lexer';

/** Nodo de expresión. */
export type Expr =
  | { k: 'num'; v: number; f: boolean }
  | { k: 'str'; v: string }
  | { k: 'id'; name: string; line: number }
  | { k: 'bin'; op: string; l: Expr; r: Expr; line: number }
  | { k: 'un'; op: string; e: Expr }
  | { k: 'assign'; op: string; t: Expr; e: Expr; line: number }
  | { k: 'incdec'; op: '++' | '--'; prefix: boolean; t: Expr; line: number }
  | { k: 'cond'; c: Expr; a: Expr; b: Expr }
  | { k: 'call'; name: string; args: Expr[]; line: number }
  | { k: 'member'; obj: Expr; name: string; args: Expr[] | null; line: number }
  | { k: 'index'; obj: Expr; idx: Expr; line: number }
  | { k: 'cast'; type: string; e: Expr }
  | { k: 'list'; items: Expr[] };

/** Variable declarada dentro de una sentencia de declaración. */
export interface DeclItem {
  name: string;
  isArray: boolean;
  size: Expr | null;
  init: Expr | null;
  /** Argumentos de constructor, p. ej. `LiquidCrystal lcd(12, 11, ...)`. */
  ctorArgs: Expr[] | null;
}

/** Nodo de sentencia. */
export type Stmt =
  | { k: 'block'; body: Stmt[] }
  | { k: 'decl'; type: string; items: DeclItem[]; line: number }
  | { k: 'expr'; e: Expr }
  | { k: 'if'; c: Expr; a: Stmt; b: Stmt | null }
  | { k: 'for'; init: Stmt | null; c: Expr | null; step: Expr | null; body: Stmt }
  | { k: 'while'; c: Expr; body: Stmt }
  | { k: 'do'; c: Expr; body: Stmt }
  | { k: 'switch'; e: Expr; cases: { test: Expr | null; body: Stmt[] }[] }
  | { k: 'break' }
  | { k: 'continue' }
  | { k: 'return'; e: Expr | null }
  | { k: 'empty' };

/** Función definida por el usuario. */
export interface FuncDef {
  name: string;
  retType: string;
  params: { name: string; type: string; byRef: boolean }[];
  body: Stmt;
}

/** Programa completo. */
export interface Program {
  globals: Stmt[];
  funcs: Record<string, FuncDef>;
}

const TYPE_WORDS = new Set([
  'void', 'int', 'long', 'short', 'unsigned', 'signed', 'byte', 'boolean', 'bool', 'float', 'double',
  'char', 'String', 'size_t', 'word', 'uint8_t', 'uint16_t', 'uint32_t', 'int8_t', 'int16_t', 'int32_t',
  'Servo', 'LiquidCrystal', 'LiquidCrystal_I2C',
]);
const QUALIFIERS = new Set(['const', 'static', 'volatile', 'extern', 'inline']);

/** Indica si un nombre de tipo es de punto flotante. */
export function isFloatType(t: string): boolean {
  return t === 'float' || t === 'double';
}

class Parser {
  private p = 0;
  private toks: Token[];
  constructor(toks: Token[]) { this.toks = toks; }

  private get cur(): Token { return this.toks[this.p]; }
  private peek(n = 1): Token { return this.toks[Math.min(this.p + n, this.toks.length - 1)]; }
  private is(v: string): boolean { return this.cur.type === 'op' && this.cur.value === v; }
  private isId(v: string): boolean { return this.cur.type === 'id' && this.cur.value === v; }
  private eat(v: string): boolean { if (this.is(v)) { this.p++; return true; } return false; }
  private expect(v: string): void {
    if (!this.eat(v)) throw new SketchError(`Se esperaba "${v}" y se encontró "${this.cur.value || 'fin del archivo'}"`, this.cur.line);
  }
  private ident(): string {
    if (this.cur.type !== 'id') throw new SketchError(`Se esperaba un nombre y se encontró "${this.cur.value}"`, this.cur.line);
    return this.toks[this.p++].value;
  }

  private startsType(offset = 0): boolean {
    const t = this.peek(offset);
    return t.type === 'id' && (TYPE_WORDS.has(t.value) || QUALIFIERS.has(t.value));
  }

  /** Lee un tipo (con calificadores) y devuelve su nombre base normalizado. */
  private parseType(): string {
    let base = '';
    const words: string[] = [];
    while (this.cur.type === 'id' && (TYPE_WORDS.has(this.cur.value) || QUALIFIERS.has(this.cur.value))) {
      const w = this.toks[this.p++].value;
      if (!QUALIFIERS.has(w)) words.push(w);
    }
    base = words.filter((w) => w !== 'unsigned' && w !== 'signed').pop() ?? 'int';
    if (words.includes('long')) base = 'long';
    return words.includes('unsigned') ? `unsigned ${base}` : base;
  }

  parseProgram(): Program {
    const prog: Program = { globals: [], funcs: {} };
    while (this.cur.type !== 'eof') {
      if (!this.startsType()) throw new SketchError(`Declaración no soportada cerca de "${this.cur.value}"`, this.cur.line);
      const line = this.cur.line;
      const type = this.parseType();
      while (this.eat('*') || this.eat('&')) { /* punteros se tratan como valores */ }
      const name = this.ident();
      if (this.is('(') && !(TYPE_WORDS.has(type) && (type === 'Servo' || type.startsWith('LiquidCrystal')))) {
        prog.funcs[name] = this.parseFunction(type, name);
      } else {
        prog.globals.push(this.parseDeclRest(type, name, line));
      }
    }
    return prog;
  }

  private parseFunction(retType: string, name: string): FuncDef {
    this.expect('(');
    const params: FuncDef['params'] = [];
    if (this.isId('void') && this.peek().value === ')') this.p++;
    while (!this.is(')')) {
      const type = this.parseType();
      let byRef = this.eat('&');
      while (this.eat('*')) byRef = true;
      const pname = this.ident();
      if (this.eat('[')) { this.expect(']'); byRef = true; }
      params.push({ name: pname, type, byRef });
      if (!this.eat(',')) break;
    }
    this.expect(')');
    return { name, retType, params, body: this.parseBlock() };
  }

  /** Continúa una declaración cuyo tipo y primer nombre ya fueron consumidos. */
  private parseDeclRest(type: string, firstName: string, line: number): Stmt {
    const items: DeclItem[] = [];
    let name = firstName;
    for (;;) {
      const item: DeclItem = { name, isArray: false, size: null, init: null, ctorArgs: null };
      if (this.eat('[')) {
        item.isArray = true;
        if (!this.is(']')) item.size = this.parseExpr();
        this.expect(']');
      }
      if (this.is('(')) {
        this.p++;
        item.ctorArgs = [];
        while (!this.is(')')) { item.ctorArgs.push(this.parseAssign()); if (!this.eat(',')) break; }
        this.expect(')');
      } else if (this.eat('=')) {
        item.init = this.is('{') ? this.parseInitList() : this.parseAssign();
      }
      items.push(item);
      if (!this.eat(',')) break;
      while (this.eat('*')) { /* puntero */ }
      name = this.ident();
    }
    this.expect(';');
    return { k: 'decl', type, items, line };
  }

  private parseInitList(): Expr {
    this.expect('{');
    const items: Expr[] = [];
    while (!this.is('}')) {
      items.push(this.is('{') ? this.parseInitList() : this.parseAssign());
      if (!this.eat(',')) break;
    }
    this.expect('}');
    return { k: 'list', items };
  }

  private parseBlock(): Stmt {
    this.expect('{');
    const body: Stmt[] = [];
    while (!this.is('}')) {
      if (this.cur.type === 'eof') throw new SketchError('Falta cerrar una llave "}"', this.cur.line);
      body.push(this.parseStmt());
    }
    this.expect('}');
    return { k: 'block', body };
  }

  private parseStmt(): Stmt {
    const t = this.cur;
    if (this.is('{')) return this.parseBlock();
    if (this.eat(';')) return { k: 'empty' };
    if (t.type === 'id') {
      switch (t.value) {
        case 'if': {
          this.p++; this.expect('(');
          const c = this.parseExpr(); this.expect(')');
          const a = this.parseStmt();
          const b = this.isId('else') ? (this.p++, this.parseStmt()) : null;
          return { k: 'if', c, a, b };
        }
        case 'while': {
          this.p++; this.expect('(');
          const c = this.parseExpr(); this.expect(')');
          return { k: 'while', c, body: this.parseStmt() };
        }
        case 'do': {
          this.p++;
          const body = this.parseStmt();
          if (!this.isId('while')) throw new SketchError('Se esperaba "while" después de "do"', this.cur.line);
          this.p++; this.expect('(');
          const c = this.parseExpr(); this.expect(')'); this.expect(';');
          return { k: 'do', c, body };
        }
        case 'for': {
          this.p++; this.expect('(');
          let init: Stmt | null = null;
          if (!this.is(';')) init = this.startsType() ? this.parseLocalDecl() : this.parseExprStmt();
          else this.p++;
          const c = this.is(';') ? null : this.parseExpr(); this.expect(';');
          const step = this.is(')') ? null : this.parseExpr(); this.expect(')');
          return { k: 'for', init, c, step, body: this.parseStmt() };
        }
        case 'switch': {
          this.p++; this.expect('(');
          const e = this.parseExpr(); this.expect(')'); this.expect('{');
          const cases: { test: Expr | null; body: Stmt[] }[] = [];
          while (!this.is('}')) {
            let test: Expr | null = null;
            if (this.isId('case')) { this.p++; test = this.parseTernary(); } else if (this.isId('default')) this.p++;
            else throw new SketchError('Se esperaba "case" o "default"', this.cur.line);
            this.expect(':');
            const body: Stmt[] = [];
            while (!this.is('}') && !this.isId('case') && !this.isId('default')) body.push(this.parseStmt());
            cases.push({ test, body });
          }
          this.expect('}');
          return { k: 'switch', e, cases };
        }
        case 'break': this.p++; this.expect(';'); return { k: 'break' };
        case 'continue': this.p++; this.expect(';'); return { k: 'continue' };
        case 'return': {
          this.p++;
          const e = this.is(';') ? null : this.parseExpr();
          this.expect(';');
          return { k: 'return', e };
        }
      }
      if (this.startsType() && (this.peek().type === 'id' || this.peek().value === '*' || this.peek().value === '&')) {
        return this.parseLocalDecl();
      }
    }
    return this.parseExprStmt();
  }

  private parseLocalDecl(): Stmt {
    const line = this.cur.line;
    const type = this.parseType();
    while (this.eat('*')) { /* puntero */ }
    return this.parseDeclRest(type, this.ident(), line);
  }

  private parseExprStmt(): Stmt {
    const e = this.parseExpr();
    this.expect(';');
    return { k: 'expr', e };
  }

  parseExpr(): Expr {
    let e = this.parseAssign();
    while (this.eat(',')) e = { k: 'bin', op: ',', l: e, r: this.parseAssign(), line: this.cur.line };
    return e;
  }

  private parseAssign(): Expr {
    const l = this.parseTernary();
    const t = this.cur;
    if (t.type === 'op' && /^(=|\+=|-=|\*=|\/=|%=|&=|\|=|\^=|<<=|>>=)$/.test(t.value)) {
      this.p++;
      return { k: 'assign', op: t.value, t: l, e: this.parseAssign(), line: t.line };
    }
    return l;
  }

  private parseTernary(): Expr {
    const c = this.parseBin(0);
    if (this.eat('?')) {
      const a = this.parseAssign();
      this.expect(':');
      return { k: 'cond', c, a, b: this.parseAssign() };
    }
    return c;
  }

  private static LEVELS: string[][] = [
    ['||'], ['&&'], ['|'], ['^'], ['&'], ['==', '!='], ['<', '>', '<=', '>='], ['<<', '>>'], ['+', '-'], ['*', '/', '%'],
  ];

  private parseBin(level: number): Expr {
    if (level >= Parser.LEVELS.length) return this.parseUnary();
    let l = this.parseBin(level + 1);
    while (this.cur.type === 'op' && Parser.LEVELS[level].includes(this.cur.value)) {
      const op = this.toks[this.p++];
      l = { k: 'bin', op: op.value, l, r: this.parseBin(level + 1), line: op.line };
    }
    return l;
  }

  private parseUnary(): Expr {
    const t = this.cur;
    if (t.type === 'op') {
      if (t.value === '++' || t.value === '--') {
        this.p++;
        return { k: 'incdec', op: t.value, prefix: true, t: this.parseUnary(), line: t.line };
      }
      if (['-', '+', '!', '~'].includes(t.value)) { this.p++; return { k: 'un', op: t.value, e: this.parseUnary() }; }
      if (t.value === '&' || t.value === '*') { this.p++; return this.parseUnary(); }
      if (t.value === '(' && this.startsType(1)) {
        let q = 1;
        while (this.peek(q).type === 'id' && this.startsType(q)) q++;
        if (this.peek(q).value === ')') {
          this.p++;
          const type = this.parseType();
          this.expect(')');
          return { k: 'cast', type, e: this.parseUnary() };
        }
      }
    }
    return this.parsePostfix();
  }

  private parsePostfix(): Expr {
    let e = this.parsePrimary();
    for (;;) {
      const t = this.cur;
      if (this.eat('[')) { const idx = this.parseExpr(); this.expect(']'); e = { k: 'index', obj: e, idx, line: t.line }; }
      else if (this.eat('.')) {
        const name = this.ident();
        let args: Expr[] | null = null;
        if (this.is('(')) args = this.parseArgs();
        e = { k: 'member', obj: e, name, args, line: t.line };
      } else if (t.type === 'op' && (t.value === '++' || t.value === '--')) {
        this.p++;
        e = { k: 'incdec', op: t.value, prefix: false, t: e, line: t.line };
      } else return e;
    }
  }

  private parseArgs(): Expr[] {
    this.expect('(');
    const args: Expr[] = [];
    while (!this.is(')')) { args.push(this.parseAssign()); if (!this.eat(',')) break; }
    this.expect(')');
    return args;
  }

  private parsePrimary(): Expr {
    const t = this.cur;
    if (t.type === 'num') { this.p++; return { k: 'num', v: Number(t.value), f: !!t.isFloat }; }
    if (t.type === 'char') { this.p++; return { k: 'num', v: t.value.charCodeAt(0) || 0, f: false }; }
    if (t.type === 'str') {
      this.p++;
      let s = t.value;
      while (this.cur.type === 'str') s += this.toks[this.p++].value;
      return { k: 'str', v: s };
    }
    if (t.type === 'id') {
      this.p++;
      // Clase::miembro (p. ej. Serial.begin ya es '.'; aquí se ignora el prefijo de espacio de nombres)
      if (this.is('(')) return { k: 'call', name: t.value, args: this.parseArgs(), line: t.line };
      // Tipo usado como función: String("x"), int(x)
      return { k: 'id', name: t.value, line: t.line };
    }
    if (this.eat('(')) { const e = this.parseExpr(); this.expect(')'); return e; }
    throw new SketchError(`Expresión inesperada "${t.value || 'fin del archivo'}"`, t.line);
  }
}

/**
 * Convierte código fuente de Arduino en un AST, expandiendo `#define` simples.
 * @param src Código del sketch.
 * @throws {SketchError} Ante errores de sintaxis.
 */
export function parseSketch(src: string): Program {
  const { tokens, defines } = tokenize(src);
  const expanded: Token[] = [];
  for (const tk of tokens) {
    if (tk.type === 'id' && defines[tk.value] !== undefined) {
      const inner = tokenize(defines[tk.value]).tokens.filter((x) => x.type !== 'eof');
      expanded.push(...inner.map((x) => ({ ...x, line: tk.line })));
    } else expanded.push(tk);
  }
  return new Parser(expanded).parseProgram();
}
