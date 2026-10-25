/**
 * @file lexer.ts
 * @description Tokenizador de un subconjunto de C++ de Arduino. Ignora comentarios y
 * directivas de preprocesador (salvo `#define NOMBRE valor`, que se devuelve aparte).
 */

/** Tipo de token léxico. */
export type TokenType = 'num' | 'str' | 'char' | 'id' | 'op' | 'eof';

/** Token con su posición para reportar errores amigables. */
export interface Token {
  type: TokenType;
  value: string;
  /** Verdadero si un literal numérico es de punto flotante. */
  isFloat?: boolean;
  line: number;
}

/** Error de sintaxis o ejecución con número de línea. */
export class SketchError extends Error {
  line?: number;
  constructor(message: string, line?: number) {
    super(line ? `Línea ${line}: ${message}` : message);
    this.name = 'SketchError';
    this.line = line;
  }
}

const OPERATORS = [
  '<<=', '>>=', '++', '--', '+=', '-=', '*=', '/=', '%=', '&=', '|=', '^=',
  '==', '!=', '<=', '>=', '&&', '||', '<<', '>>', '::',
  '+', '-', '*', '/', '%', '=', '<', '>', '!', '&', '|', '^', '~', '?', ':',
  ';', ',', '.', '(', ')', '{', '}', '[', ']',
];

const ESCAPES: Record<string, string> = { n: '\n', t: '\t', r: '\r', '0': '\0', '\\': '\\', "'": "'", '"': '"' };

/**
 * Convierte código fuente en tokens y recoge los `#define` simples.
 * @param src Código del sketch.
 * @returns Tokens y mapa de constantes definidas con #define.
 */
export function tokenize(src: string): { tokens: Token[]; defines: Record<string, string> } {
  const tokens: Token[] = [];
  const defines: Record<string, string> = {};
  let i = 0;
  let line = 1;
  let lineStart = true;

  while (i < src.length) {
    const c = src[i];
    if (c === '\n') { line++; i++; lineStart = true; continue; }
    if (/\s/.test(c)) { i++; continue; }
    if (c === '/' && src[i + 1] === '/') { while (i < src.length && src[i] !== '\n') i++; continue; }
    if (c === '/' && src[i + 1] === '*') {
      i += 2;
      while (i < src.length && !(src[i] === '*' && src[i + 1] === '/')) { if (src[i] === '\n') line++; i++; }
      i += 2;
      continue;
    }
    if (c === '#' && lineStart) {
      let end = src.indexOf('\n', i);
      if (end < 0) end = src.length;
      const m = src.slice(i, end).match(/^#\s*define\s+([A-Za-z_]\w*)\s+(.+?)\s*$/);
      if (m) defines[m[1]] = m[2].replace(/\/\/.*$/, '').trim();
      i = end;
      continue;
    }
    lineStart = false;

    if (/[0-9]/.test(c) || (c === '.' && /[0-9]/.test(src[i + 1] ?? ''))) {
      const m = src.slice(i).match(/^(0[xX][0-9a-fA-F]+|0[bB][01]+|(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?)([uUlLfF]*)/);
      if (!m) throw new SketchError('Número inválido', line);
      const body = m[1];
      let value: number;
      let isFloat = false;
      if (/^0[xX]/.test(body)) value = parseInt(body, 16);
      else if (/^0[bB]/.test(body)) value = parseInt(body.slice(2), 2);
      else { value = parseFloat(body); isFloat = /[.eE]/.test(body) || /[fF]/.test(m[4]); }
      tokens.push({ type: 'num', value: String(value), isFloat, line });
      i += m[0].length;
      continue;
    }
    if (/[A-Za-z_]/.test(c)) {
      const m = src.slice(i).match(/^[A-Za-z_]\w*/)!;
      tokens.push({ type: 'id', value: m[0], line });
      i += m[0].length;
      continue;
    }
    if (c === '"' || c === "'") {
      let j = i + 1;
      let s = '';
      while (j < src.length && src[j] !== c) {
        if (src[j] === '\\') { j++; s += ESCAPES[src[j]] ?? src[j]; } else s += src[j];
        j++;
      }
      tokens.push({ type: c === '"' ? 'str' : 'char', value: s, line });
      i = j + 1;
      continue;
    }
    const op = OPERATORS.find((o) => src.startsWith(o, i));
    if (!op) throw new SketchError(`Carácter no soportado "${c}"`, line);
    tokens.push({ type: 'op', value: op, line });
    i += op.length;
  }
  tokens.push({ type: 'eof', value: '', line });
  return { tokens, defines };
}
