/**
 * @file toolbox.ts
 * @description Definición de la paleta de herramientas (Toolbox) de Blockly organizada por categorías temáticas.
 */

export const ARDUINO_TOOLBOX = {
  kind: 'categoryToolbox',
  contents: [
    {
      kind: 'category',
      name: 'Estructura',
      colour: '#00979D',
      contents: [
        { kind: 'block', type: 'arduino_base' },
        { kind: 'block', type: 'arduino_pin_mode' },
      ],
    },
    {
      kind: 'category',
      name: 'Digital',
      colour: '#2563EB',
      contents: [
        { kind: 'block', type: 'arduino_digital_write' },
        { kind: 'block', type: 'arduino_digital_read' },
      ],
    },
    {
      kind: 'category',
      name: 'Analógico & PWM',
      colour: '#7C3AED',
      contents: [
        { kind: 'block', type: 'arduino_analog_write' },
        { kind: 'block', type: 'arduino_analog_read' },
      ],
    },
    {
      kind: 'category',
      name: 'Tiempo',
      colour: '#D97706',
      contents: [
        {
          kind: 'block',
          type: 'arduino_delay',
          inputs: {
            MS: {
              shadow: {
                kind: 'block',
                type: 'math_number',
                fields: { NUM: 1000 },
              },
            },
          },
        },
      ],
    },
    {
      kind: 'category',
      name: 'Servos & Sensores',
      colour: '#EA580C',
      contents: [
        {
          kind: 'block',
          type: 'arduino_servo_write',
          inputs: {
            ANGLE: {
              shadow: {
                kind: 'block',
                type: 'math_number',
                fields: { NUM: 90 },
              },
            },
          },
        },
        { kind: 'block', type: 'arduino_ultrasonic_read' },
      ],
    },
    {
      kind: 'category',
      name: 'Monitor Serial',
      colour: '#059669',
      contents: [
        {
          kind: 'block',
          type: 'arduino_serial_print',
          inputs: {
            TEXT: {
              shadow: {
                kind: 'block',
                type: 'text',
                fields: { TEXT: 'Hola Mundo' },
              },
            },
          },
        },
      ],
    },
    {
      kind: 'category',
      name: 'Lógica & Control',
      colour: '#475569',
      contents: [
        { kind: 'block', type: 'controls_if' },
        { kind: 'block', type: 'logic_compare' },
        { kind: 'block', type: 'logic_operation' },
        { kind: 'block', type: 'logic_boolean' },
      ],
    },
    {
      kind: 'category',
      name: 'Matemáticas',
      colour: '#0284C7',
      contents: [
        { kind: 'block', type: 'math_number' },
        { kind: 'block', type: 'math_arithmetic' },
      ],
    },
    {
      kind: 'category',
      name: 'Variables',
      custom: 'VARIABLE',
      colour: '#DC2626',
    },
  ],
};
