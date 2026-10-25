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
        startScale: 0.9,
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
      renderer: 'zelos',
    });

    workspaceRef.current = workspace;

    // Restaurar estado previo o inicializar con un sketch de parpadeo completo con números encastrados.
    // Los eventos se silencian: la carga no debe disparar la regeneración (y pisar el código manual).
    if (blocklyXml) {
      try {
        const dom = Blockly.utils.xml.textToDom(blocklyXml);
        Blockly.Xml.domToWorkspace(dom, workspace);
      } catch (err) {
        console.error('Error al restaurar bloques guardados:', err);
      }
    } else {
      // Sketch inicial (parpadeo). Se carga desde XML para que Blockly conecte bien los números a cada "Esperar".
      const seed = `<xml xmlns="https://developers.google.com/blockly/xml">
        <block type="arduino_base" x="20" y="20">
          <statement name="SETUP"><block type="arduino_pin_mode"><field name="PIN">13</field></block></statement>
          <statement name="LOOP">
            <block type="arduino_digital_write"><field name="PIN">13</field><field name="STATE">HIGH</field>
              <next><block type="arduino_delay"><value name="MS"><block type="math_number"><field name="NUM">1000</field></block></value>
                <next><block type="arduino_digital_write"><field name="PIN">13</field><field name="STATE">LOW</field>
                  <next><block type="arduino_delay"><value name="MS"><block type="math_number"><field name="NUM">1000</field></block></value></block></next>
                </block></next>
              </block></next>
            </block>
          </statement>
        </block>
      </xml>`;
      Blockly.Xml.domToWorkspace(Blockly.utils.xml.textToDom(seed), workspace);
    }

    // Repara proyectos guardados con "Esperar" vacío: conecta el número suelto o crea uno de 1000 ms.
    let repaired = false;
    workspace.getBlocksByType('arduino_delay', false).forEach((delayBlock) => {
      const input = delayBlock.getInput('MS');
      if (!input || input.connection?.targetBlock()) return;
      repaired = true;
      const orphan = workspace.getTopBlocks(false).find((b) => b.type === 'math_number');
      const num = orphan ?? workspace.newBlock('math_number');
      if (!orphan) {
        num.setFieldValue('1000', 'NUM');
        num.initSvg();
        num.render();
      }
      input.connection?.connect(num.outputConnection!);
    });
    const serialize = () => Blockly.Xml.domToText(Blockly.Xml.workspaceToDom(workspace));
    let lastXml = serialize();

    // Listener para traducción en tiempo real a C++ y serialización
    const changeListener = (event: any) => {
      // Ignorar eventos que no cambian el contenido visual o semántico
      if (event && (event.type === Blockly.Events.VIEWPORT_CHANGE || event.isUiEvent)) return;
      // Eventos de carga/montaje no cambian los bloques: no deben pisar el código escrito a mano.
      const xmlText = serialize();
      if (xmlText === lastXml) return;
      lastXml = xmlText;
      setCode(generateArduinoCode(workspace));
      setBlocklyXml(xmlText);
    };

    workspace.addChangeListener(changeListener);
    // Solo se genera al montar un proyecto nuevo (sin bloques guardados); si no, se respeta el código existente.
    if (!blocklyXml || repaired) {
      setCode(generateArduinoCode(workspace));
      setBlocklyXml(lastXml);
    }

    // Redimensionamiento: el contenedor cambia al alternar pestañas o pantalla dividida, no solo la ventana.
    const observer = new ResizeObserver(() => Blockly.svgResize(workspace));
    observer.observe(blocklyDivRef.current);
    const handleResize = () => {
      Blockly.svgResize(workspace);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      observer.disconnect();
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


