import { describe, it, expect } from 'vitest';
import { formatOhms, parseOhms, resistorBandColors, formatCurrent } from './electronics';

describe('electronics', () => {
  it('formatea ohmios', () => {
    expect(formatOhms(220)).toBe('220Ω');
    expect(formatOhms(4700)).toBe('4.7kΩ');
    expect(formatOhms(1_000_000)).toBe('1MΩ');
  });

  it('interpreta texto del usuario', () => {
    expect(parseOhms('4.7k')).toBe(4700);
    expect(parseOhms('2,2K')).toBe(2200);
    expect(parseOhms('220 Ω')).toBe(220);
    expect(parseOhms('abc')).toBeNull();
    expect(parseOhms('0')).toBeNull();
  });

  it('código de colores: 220Ω rojo-rojo-marrón, 1kΩ marrón-negro-rojo', () => {
    expect(resistorBandColors(220)).toEqual(['#EF4444', '#EF4444', '#78350F']);
    expect(resistorBandColors(1000)).toEqual(['#78350F', '#111827', '#EF4444']);
  });

  it('formatea corriente', () => {
    expect(formatCurrent(12.34)).toBe('12.3 mA');
    expect(formatCurrent(1500)).toBe('1.50 A');
  });
});
