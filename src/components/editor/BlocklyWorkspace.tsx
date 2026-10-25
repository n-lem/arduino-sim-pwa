/**
 * @file BlocklyWorkspace.tsx
 * @description Espacio de trabajo interactivo de Google Blockly con tema oscuro aesthetic y bloques completos.
 */

import React, { useEffect, useRef } from 'react';
import * as Blockly from 'blockly';
import { registerArduinoBlocks } from '../../core/blockly/arduinoBlocks';
import { generateArduinoCode } from '../../core/blockly/arduinoGenerator';
import { ARDUINO_TOOLBOX } from '../../core/blockly/toolbox';
import { useCodeStore } from '../../stores/useCodeStore';

// Definición de Tema Oscuro Aesthetic para Google Blockly
const ArduinoDarkTheme = Blockly.Theme.defineTheme('arduinoDark', {
  name: 'arduinoDark',
  base: Blockly.Themes.Classic,
  componentStyles: {
    workspaceBackgroundColour: '#030712', // Slate-950
    toolboxBackgroundColour: '#0f172a',    // Slate-900
    toolboxForegroundColour: '#e2e8f0',    // Slate-200
    flyoutBackgroundColour: '#1e293b',     // Slate-800
    flyoutForegroundColour: '#f8fafc',     // Slate-50
    flyoutOpacity: 0.95,
    scrollbarColour: '#334155',
    scrollbarOpacity: 0.6,
    insertionMarkerColour: '#00979D',      // Arduino Teal
    insertionMarkerOpacity: 0.8,
    cursorColour: '#38bdf8',
  },
  fontStyle: {
    family: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    weight: 'normal',
    size: 12,
  },
});

export const BlocklyWorkspace: React.FC = () => {
  const blocklyDivRef = useRef<HTMLDivElement>(null);
  const workspaceRef = useRef<Blockly.WorkspaceSvg | null>(null);
  const { setCode, blocklyXml, setBlocklyXml } = useCodeStore();

  useEffect(() => {
    registerArduinoBlocks();

    if (!blocklyDivRef.current) return;

    // Inyectar espacio de trabajo con tema oscuro aesthetic y soporte táctil
    const workspace = Blockly.inject(blocklyDivRef.current, {
      toolbox: ARDUINO_TOOLBOX as any,
      trashcan: true,
      scrollbars: true,
      theme: ArduinoDarkTheme,
      zoom: {
        controls: true,
        wheel: true,
        startScale: 0.95,
        maxScale: 2,
        minScale: 0.5,
        scaleSpeed: 1.1,
      },
      grid: {
        spacing: 24,
        length: 3,
        colour: '#1e293b', // Cuadrícula sutil sobre fondo oscuro
        snap: true,
      },
      renderer: 'geras',
    });

    workspaceRef.current = workspace;

    // Restaurar estado previo o inicializar con un sketch de parpadeo completo con números encastrados
    if (blocklyXml) {
      try {
        const dom = Blockly.utils.xml.textToDom(blocklyXml);
        Blockly.Xml.domToWorkspace(dom, workspace);
      } catch (err) {
        console.error('Error al restaurar bloques guardados:', err);
      }
    } else {
      // Bloque inicial base
      const baseBlock = workspace.newBlock('arduino_base');
      baseBlock.initSvg();
      baseBlock.render();
      baseBlock.moveBy(30, 25);

      // Bloque pinMode 13 OUTPUT en setup
      const pinModeBlock = workspace.newBlock('arduino_pin_mode');
      pinModeBlock.initSvg();
      pinModeBlock.render();
      const setupInput = baseBlock.getInput('SETUP');
      if (setupInput?.connection && pinModeBlock.previousConnection) {
        setupInput.connection.connect(pinModeBlock.previousConnection);
      }

      // Bloque digitalWrite 13 HIGH en loop
      const dwHighBlock = workspace.newBlock('arduino_digital_write');
      dwHighBlock.setFieldValue('HIGH', 'STATE');
      dwHighBlock.initSvg();
      dwHighBlock.render();
      const loopInput = baseBlock.getInput('LOOP');
      if (loopInput?.connection && dwHighBlock.previousConnection) {
        loopInput.connection.connect(dwHighBlock.previousConnection);
      }

      // Bloque delay 1000 (con bloque numérico 1000 encastrado sin huecos vacíos)
      const delay1 = workspace.newBlock('arduino_delay');
      delay1.initSvg();
      delay1.render();
      if (dwHighBlock.nextConnection && delay1.previousConnection) {
        dwHighBlock.nextConnection.connect(delay1.previousConnection);
      }

      const numBlock1 = workspace.newBlock('math_number');
      numBlock1.setFieldValue('1000', 'NUM');
      numBlock1.initSvg();
      numBlock1.render();
      const delayInput1 = delay1.getInput('MS');
      if (delayInput1?.connection && numBlock1.outputConnection) {
        delayInput1.connection.connect(numBlock1.outputConnection);
      }

      // Bloque digitalWrite 13 LOW
      const dwLowBlock = workspace.newBlock('arduino_digital_write');
      dwLowBlock.setFieldValue('LOW', 'STATE');
      dwLowBlock.initSvg();
      dwLowBlock.render();
      if (delay1.nextConnection && dwLowBlock.previousConnection) {
        delay1.nextConnection.connect(dwLowBlock.previousConnection);
      }

      // Bloque delay 1000 (con bloque numérico 1000 encastrado sin huecos vacíos)
      const delay2 = workspace.newBlock('arduino_delay');
      delay2.initSvg();
      delay2.render();
      if (dwLowBlock.nextConnection && delay2.previousConnection) {
        dwLowBlock.nextConnection.connect(delay2.previousConnection);
      }

      const numBlock2 = workspace.newBlock('math_number');
      numBlock2.setFieldValue('1000', 'NUM');
      numBlock2.initSvg();
      numBlock2.render();
      const delayInput2 = delay2.getInput('MS');
      if (delayInput2?.connection && numBlock2.outputConnection) {
        delayInput2.connection.connect(numBlock2.outputConnection);
      }
    }

    // Listener para traducción en tiempo real a C++ y serialización
    const changeListener = (event: any) => {
      // Ignorar eventos que no cambian el contenido visual o semántico
      if (event && event.type === Blockly.Events.VIEWPORT_CHANGE) return;

      const generatedCpp = generateArduinoCode(workspace);
      setCode(generatedCpp);

      const dom = Blockly.Xml.workspaceToDom(workspace);
      const xmlText = Blockly.Xml.domToText(dom);
      setBlocklyXml(xmlText);
    };

    workspace.addChangeListener(changeListener);
    changeListener(null);

    // Redimensionamiento responsive
    const handleResize = () => {
      Blockly.svgResize(workspace);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      workspace.dispose();
    };
  }, []);

  return (
    <div className="relative w-full h-full bg-slate-950 overflow-hidden">
      <div ref={blocklyDivRef} className="w-full h-full" />
    </div>
  );
};
