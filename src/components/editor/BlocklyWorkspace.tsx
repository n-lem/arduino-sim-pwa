/**
 * @file BlocklyWorkspace.tsx
 * @description Espacio de trabajo interactivo de Google Blockly con sincronización C++ en tiempo real.
 */

import React, { useEffect, useRef } from 'react';
import * as Blockly from 'blockly';
import { registerArduinoBlocks } from '../../core/blockly/arduinoBlocks';
import { generateArduinoCode } from '../../core/blockly/arduinoGenerator';
import { ARDUINO_TOOLBOX } from '../../core/blockly/toolbox';
import { useCodeStore } from '../../stores/useCodeStore';

export const BlocklyWorkspace: React.FC = () => {
  const blocklyDivRef = useRef<HTMLDivElement>(null);
  const workspaceRef = useRef<Blockly.WorkspaceSvg | null>(null);
  const { setCode, blocklyXml, setBlocklyXml } = useCodeStore();

  useEffect(() => {
    registerArduinoBlocks();

    if (!blocklyDivRef.current) return;

    // Inyectar espacio de trabajo con soporte táctil
    const workspace = Blockly.inject(blocklyDivRef.current, {
      toolbox: ARDUINO_TOOLBOX as any,
      trashcan: true,
      scrollbars: true,
      zoom: {
        controls: true,
        wheel: true,
        startScale: 0.9,
        maxScale: 2,
        minScale: 0.5,
        scaleSpeed: 1.1,
      },
      grid: {
        spacing: 20,
        length: 3,
        colour: '#334155',
        snap: true,
      },
      renderer: 'geras',
    });

    workspaceRef.current = workspace;

    // Restaurar estado previo o inicializar con un sketch de parpadeo básico
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
      baseBlock.moveBy(40, 30);

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

      // Bloque delay 1000
      const delay1 = workspace.newBlock('arduino_delay');
      delay1.initSvg();
      delay1.render();
      if (dwHighBlock.nextConnection && delay1.previousConnection) {
        dwHighBlock.nextConnection.connect(delay1.previousConnection);
      }

      // Bloque digitalWrite 13 LOW
      const dwLowBlock = workspace.newBlock('arduino_digital_write');
      dwLowBlock.setFieldValue('LOW', 'STATE');
      dwLowBlock.initSvg();
      dwLowBlock.render();
      if (delay1.nextConnection && dwLowBlock.previousConnection) {
        delay1.nextConnection.connect(dwLowBlock.previousConnection);
      }

      // Bloque delay 1000
      const delay2 = workspace.newBlock('arduino_delay');
      delay2.initSvg();
      delay2.render();
      if (dwLowBlock.nextConnection && delay2.previousConnection) {
        dwLowBlock.nextConnection.connect(delay2.previousConnection);
      }
    }

    // Listener para traducción en tiempo real a C++ y serialización
    const changeListener = () => {
      const generatedCpp = generateArduinoCode(workspace);
      setCode(generatedCpp);

      const dom = Blockly.Xml.workspaceToDom(workspace);
      const xmlText = Blockly.Xml.domToText(dom);
      setBlocklyXml(xmlText);
    };

    workspace.addChangeListener(changeListener);
    // Ejecutar una primera vez para sincronizar
    changeListener();

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
    <div className="relative w-full h-full bg-slate-900 overflow-hidden">
      <div ref={blocklyDivRef} className="w-full h-full" />
    </div>
  );
};
