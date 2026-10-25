/**
 * @file arduinoBlocks.ts
 * @description Definición de bloques educativos en español para Arduino Uno en Google Blockly.
 */

import * as Blockly from 'blockly';

/**
 * Registra todos los bloques personalizados para Arduino en el registro global de Blockly.
 */
export function registerArduinoBlocks(): void {
  // 1. Estructura Principal: Setup y Loop
  Blockly.Blocks['arduino_base'] = {
    init: function () {
      this.appendDummyInput().appendField('🟢 Programa Arduino Uno');
      this.appendStatementInput('SETUP').appendField('⚙️ Configuración (setup - se ejecuta una vez):');
      this.appendStatementInput('LOOP').appendField('🔁 Bucle Principal (loop - se repite siempre):');
      this.setColour('#00979D');
      this.setTooltip('Estructura obligatoria de un programa en Arduino.');
      this.setHelpUrl('');
      this.setDeletable(false);
    },
  };

  // 2. Pin Mode: Configurar pin como Entrada o Salida
  Blockly.Blocks['arduino_pin_mode'] = {
    init: function () {
      this.appendDummyInput()
        .appendField('Configurar Pin')
        .appendField(
          new Blockly.FieldDropdown([
            ['13 (LED Integrado)', '13'],
            ['12', '12'],
            ['11 (~PWM)', '11'],
            ['10 (~PWM)', '10'],
            ['9 (~PWM)', '9'],
            ['8', '8'],
            ['7', '7'],
            ['6 (~PWM)', '6'],
            ['5 (~PWM)', '5'],
            ['4', '4'],
            ['3 (~PWM)', '3'],
            ['2', '2'],
            ['A0', 'A0'],
            ['A1', 'A1'],
            ['A2', 'A2'],
            ['A3', 'A3'],
            ['A4', 'A4'],
            ['A5', 'A5'],
          ]),
          'PIN'
        )
        .appendField('como')
        .appendField(
          new Blockly.FieldDropdown([
            ['SALIDA (OUTPUT)', 'OUTPUT'],
            ['ENTRADA (INPUT)', 'INPUT'],
            ['ENTRADA CON RESISTENCIA (INPUT_PULLUP)', 'INPUT_PULLUP'],
          ]),
          'MODE'
        );
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour('#0284C7');
      this.setTooltip('Configura si un pin envía corriente (OUTPUT) o recibe lecturas (INPUT).');
    },
  };

  // 3. Digital Write: Encender o Apagar Pin
  Blockly.Blocks['arduino_digital_write'] = {
    init: function () {
      this.appendDummyInput()
        .appendField('Escribir en Pin Digital')
        .appendField(
          new Blockly.FieldDropdown([
            ['13 (LED)', '13'],
            ['12', '12'],
            ['11 (~)', '11'],
            ['10 (~)', '10'],
            ['9 (~)', '9'],
            ['8', '8'],
            ['7', '7'],
            ['6 (~)', '6'],
            ['5 (~)', '5'],
            ['4', '4'],
            ['3 (~)', '3'],
            ['2', '2'],
          ]),
          'PIN'
        )
        .appendField('estado')
        .appendField(
          new Blockly.FieldDropdown([
            ['ALTO / ENCENDIDO (HIGH)', 'HIGH'],
            ['BAJO / APAGADO (LOW)', 'LOW'],
          ]),
          'STATE'
        );
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour('#2563EB');
      this.setTooltip('Envía 5V (HIGH) o 0V (LOW) al pin especificado.');
    },
  };

  // 4. Digital Read: Leer estado digital (Pulsador, etc.)
  Blockly.Blocks['arduino_digital_read'] = {
    init: function () {
      this.appendDummyInput()
        .appendField('Leer Pin Digital')
        .appendField(
          new Blockly.FieldDropdown([
            ['2', '2'],
            ['3 (~)', '3'],
            ['4', '4'],
            ['5 (~)', '5'],
            ['6 (~)', '6'],
            ['7', '7'],
            ['8', '8'],
            ['9 (~)', '9'],
            ['10 (~)', '10'],
            ['11 (~)', '11'],
            ['12', '12'],
            ['13', '13'],
          ]),
          'PIN'
        );
      this.setOutput(true, 'Boolean');
      this.setColour('#2563EB');
      this.setTooltip('Devuelve verdadero (HIGH) si recibe voltaje o falso (LOW).');
    },
  };

  // 5. Delay: Esperar tiempo en milisegundos
  Blockly.Blocks['arduino_delay'] = {
    init: function () {
      this.appendValueInput('MS')
        .setCheck('Number')
        .appendField('⏱️ Esperar');
      this.appendDummyInput().appendField('milisegundos');
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour('#D97706');
      this.setTooltip('Detiene el programa durante el tiempo indicado (1000 ms = 1 segundo).');
    },
  };

  // 6. Analog Write: PWM (Brillo LED, Velocidad Motor)
  Blockly.Blocks['arduino_analog_write'] = {
    init: function () {
      this.appendDummyInput()
        .appendField('Escribir PWM en Pin')
        .appendField(
          new Blockly.FieldDropdown([
            ['3 (~PWM)', '3'],
            ['5 (~PWM)', '5'],
            ['6 (~PWM)', '6'],
            ['9 (~PWM)', '9'],
            ['10 (~PWM)', '10'],
            ['11 (~PWM)', '11'],
          ]),
          'PIN'
        );
      this.appendValueInput('VALUE')
        .setCheck('Number')
        .appendField('valor (0 a 255):');
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour('#7C3AED');
      this.setTooltip('Genera una señal analógica simulada por modulación de ancho de pulsos (0 = apagado, 255 = máximo).');
    },
  };

  // 7. Analog Read: Leer sensor analógico (A0 a A5)
  Blockly.Blocks['arduino_analog_read'] = {
    init: function () {
      this.appendDummyInput()
        .appendField('Leer Pin Analógico')
        .appendField(
          new Blockly.FieldDropdown([
            ['A0', 'A0'],
            ['A1', 'A1'],
            ['A2', 'A2'],
            ['A3', 'A3'],
            ['A4', 'A4'],
            ['A5', 'A5'],
          ]),
          'PIN'
        );
      this.setOutput(true, 'Number');
      this.setColour('#7C3AED');
      this.setTooltip('Lee el voltaje en un pin analógico y devuelve un valor entre 0 y 1023.');
    },
  };

  // 8. Serial Print: Enviar datos al monitor serial
  Blockly.Blocks['arduino_serial_print'] = {
    init: function () {
      this.appendValueInput('TEXT')
        .appendField('📟 Imprimir en Monitor Serial');
      this.appendDummyInput()
        .appendField(
          new Blockly.FieldDropdown([
            ['con salto de línea (println)', 'PRINTLN'],
            ['sin salto de línea (print)', 'PRINT'],
          ]),
          'TYPE'
        );
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour('#059669');
      this.setTooltip('Envía mensajes o valores al monitor serial para verlos en pantalla.');
    },
  };

  // 9. Servo SG90: Posicionar en un ángulo
  Blockly.Blocks['arduino_servo_write'] = {
    init: function () {
      this.appendDummyInput()
        .appendField('⚙️ Mover Servo SG90 en Pin')
        .appendField(
          new Blockly.FieldDropdown([
            ['9 (~PWM)', '9'],
            ['10 (~PWM)', '10'],
            ['11 (~PWM)', '11'],
            ['6 (~PWM)', '6'],
            ['5 (~PWM)', '5'],
            ['3 (~PWM)', '3'],
          ]),
          'PIN'
        );
      this.appendValueInput('ANGLE')
        .setCheck('Number')
        .appendField('a ángulo (0° a 180°):');
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour('#EA580C');
      this.setTooltip('Controla la posición del servomotor SG90 utilizando la librería <Servo.h>.');
    },
  };

  // 10. Sensor Ultrasónico HC-SR04: Leer distancia en cm
  Blockly.Blocks['arduino_ultrasonic_read'] = {
    init: function () {
      this.appendDummyInput()
        .appendField('📏 Distancia Ultrasónico HC-SR04')
        .appendField('Trig:')
        .appendField(
          new Blockly.FieldDropdown([
            ['9', '9'],
            ['10', '10'],
            ['11', '11'],
            ['12', '12'],
            ['8', '8'],
            ['7', '7'],
            ['6', '6'],
            ['5', '5'],
            ['4', '4'],
            ['3', '3'],
            ['2', '2'],
          ]),
          'TRIG'
        )
        .appendField('Echo:')
        .appendField(
          new Blockly.FieldDropdown([
            ['8', '8'],
            ['9', '9'],
            ['10', '10'],
            ['11', '11'],
            ['12', '12'],
            ['7', '7'],
            ['6', '6'],
            ['5', '5'],
            ['4', '4'],
            ['3', '3'],
            ['2', '2'],
          ]),
          'ECHO'
        );
      this.setOutput(true, 'Number');
      this.setColour('#0284C7');
      this.setTooltip('Calcula la distancia en centímetros medida por el sensor ultrasónico HC-SR04.');
    },
  };
}
