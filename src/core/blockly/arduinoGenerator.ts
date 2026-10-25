/**
 * @file arduinoGenerator.ts
 * @description Generador de código C++ / Arduino (.ino) a partir del árbol de bloques de Google Blockly.
 */

import * as Blockly from 'blockly';
import { javascriptGenerator, Order } from 'blockly/javascript';

/**
 * Configura los generadores de código de cada bloque Arduino.
 */
export function setupArduinoCodeGenerators(): void {
  // 1. Bloque Base: Setup y Loop
  javascriptGenerator.forBlock['arduino_base'] = function (block) {
    const setupCode = javascriptGenerator.statementToCode(block, 'SETUP');
    const loopCode = javascriptGenerator.statementToCode(block, 'LOOP');

    return `// --- GENERADO AUTOMÁTICAMENTE DESDE BLOQUES ---
void setup() {
${setupCode || '  // Configuración inicial\n'}
}

void loop() {
${loopCode || '  // Bucle principal\n'}
}
`;
  };

  // 2. Pin Mode
  javascriptGenerator.forBlock['arduino_pin_mode'] = function (block) {
    const pin = block.getFieldValue('PIN');
    const mode = block.getFieldValue('MODE');
    return `  pinMode(${pin}, ${mode});\n`;
  };

  // 3. Digital Write
  javascriptGenerator.forBlock['arduino_digital_write'] = function (block) {
    const pin = block.getFieldValue('PIN');
    const state = block.getFieldValue('STATE');
    return `  digitalWrite(${pin}, ${state});\n`;
  };

  // 4. Digital Read
  javascriptGenerator.forBlock['arduino_digital_read'] = function (block) {
    const pin = block.getFieldValue('PIN');
    return [`digitalRead(${pin})`, Order.ATOMIC];
  };

  // 5. Delay
  javascriptGenerator.forBlock['arduino_delay'] = function (block) {
    const ms = javascriptGenerator.valueToCode(block, 'MS', Order.ATOMIC) || '0';
    return `  delay(${ms});\n`;
  };

  // 6. Analog Write (PWM)
  javascriptGenerator.forBlock['arduino_analog_write'] = function (block) {
    const pin = block.getFieldValue('PIN');
    const value = javascriptGenerator.valueToCode(block, 'VALUE', Order.ATOMIC) || '128';
    return `  analogWrite(${pin}, ${value});\n`;
  };

  // 7. Analog Read
  javascriptGenerator.forBlock['arduino_analog_read'] = function (block) {
    const pin = block.getFieldValue('PIN');
    return [`analogRead(${pin})`, Order.ATOMIC];
  };

  // 8. Serial Print
  javascriptGenerator.forBlock['arduino_serial_print'] = function (block) {
    const text = javascriptGenerator.valueToCode(block, 'TEXT', Order.ATOMIC) || '""';
    const type = block.getFieldValue('TYPE');
    const func = type === 'PRINTLN' ? 'println' : 'print';
    return `  Serial.${func}(${text});\n`;
  };

  // 9. Servo Write
  javascriptGenerator.forBlock['arduino_servo_write'] = function (block) {
    const pin = block.getFieldValue('PIN');
    const angle = javascriptGenerator.valueToCode(block, 'ANGLE', Order.ATOMIC) || '90';
    return `  servo_${pin}.write(${angle});\n`;
  };

  // 10. Sensor Ultrasónico Read
  javascriptGenerator.forBlock['arduino_ultrasonic_read'] = function (block) {
    const trig = block.getFieldValue('TRIG');
    const echo = block.getFieldValue('ECHO');
    return [`readUltrasonicDistance(${trig}, ${echo})`, Order.FUNCTION_CALL];
  };
}

/**
 * Traduce el workspace de Blockly a un archivo de código C++ / Arduino completo (.ino).
 */
export function generateArduinoCode(workspace: Blockly.Workspace): string {
  setupArduinoCodeGenerators();

  const allBlocks = workspace.getAllBlocks(false);
  let hasServo = false;
  let hasUltrasonic = false;
  let hasSerial = false;
  const servoPins = new Set<string>();

  for (const b of allBlocks) {
    if (b.type === 'arduino_servo_write') {
      hasServo = true;
      servoPins.add(b.getFieldValue('PIN'));
    }
    if (b.type === 'arduino_ultrasonic_read') {
      hasUltrasonic = true;
    }
    if (b.type === 'arduino_serial_print') {
      hasSerial = true;
    }
  }

  let includesAndGlobals = '';

  if (hasServo) {
    includesAndGlobals += '#include <Servo.h>\n';
    servoPins.forEach((pin) => {
      includesAndGlobals += `Servo servo_${pin};\n`;
    });
    includesAndGlobals += '\n';
  }

  if (hasUltrasonic) {
    includesAndGlobals += `// Función auxiliar para sensor ultrasónico HC-SR04
long readUltrasonicDistance(int trigPin, int echoPin) {
  pinMode(trigPin, OUTPUT);
  digitalWrite(trigPin, LOW);
  delayMicroseconds(2);
  digitalWrite(trigPin, HIGH);
  delayMicroseconds(10);
  digitalWrite(trigPin, LOW);
  pinMode(echoPin, INPUT);
  long duration = pulseIn(echoPin, HIGH, 30000);
  return duration * 0.034 / 2; // Distancia en centímetros
}

`;
  }

  // Generar código desde el bloque base de Arduino
  const baseBlock = allBlocks.find((b) => b.type === 'arduino_base');
  if (baseBlock) {
    javascriptGenerator.init(workspace);
    let rawCode = javascriptGenerator.blockToCode(baseBlock) as string;

    // Si se usa Serial o Servos, inyectar inicializaciones automáticas en el setup si faltasen
    if (hasSerial && !rawCode.includes('Serial.begin')) {
      rawCode = rawCode.replace('void setup() {', 'void setup() {\n  Serial.begin(9600);');
    }
    if (hasServo) {
      let attaches = '';
      servoPins.forEach((pin) => {
        attaches += `  servo_${pin}.attach(${pin});\n`;
      });
      rawCode = rawCode.replace('void setup() {', `void setup() {\n${attaches}`);
    }

    return `${includesAndGlobals}${rawCode}`;
  }

  // Si no está el bloque base, generar el código de los bloques sueltos
  const code = javascriptGenerator.workspaceToCode(workspace);
  return `${includesAndGlobals}// Bloques sin bloque base\n${code}`;
}
