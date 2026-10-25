/**
 * @file ComponentRenderer.tsx
 * @description Orquestador de renderizado para cualquier componente electrónico con soporte de arrastre y toque.
 */

import React from 'react';
import type { CircuitComponent } from '../../types/circuit';
import type { SelectedPinInfo } from '../../stores/useCircuitStore';
import { ArduinoUnoPart } from './ArduinoUnoPart';
import { LedPart } from './LedPart';
import { ResistorPart } from './ResistorPart';
import { PushbuttonPart } from './PushbuttonPart';
import { ServoPart } from './ServoPart';
import { UltrasonicPart } from './UltrasonicPart';
import { BatteryPart } from './BatteryPart';
import { BuzzerPart } from './BuzzerPart';
import { PotentiometerPart } from './PotentiometerPart';
import { Esp32Part } from './Esp32Part';
import { SwitchPart } from './SwitchPart';
import { LdrPart } from './LdrPart';
import { MultimeterPart } from './MultimeterPart';
import { Trash2 } from 'lucide-react';

interface ComponentRendererProps {
  component: CircuitComponent;
  selectedPin: SelectedPinInfo | null;
  isSelected: boolean;
  isRunning?: boolean;
  onPinTouch: (componentId: string, pinId: string) => void;
  onSelect: (componentId: string) => void;
  onDelete: (componentId: string) => void;
  onPropertyChange: (componentId: string, property: string, value: any) => void;
  onDrag: (componentId: string, x: number, y: number) => void;
}

export const ComponentRenderer: React.FC<ComponentRendererProps> = ({
  component,
  selectedPin,
  isSelected,
  isRunning = false,
  onPinTouch,
  onSelect,
  onDelete,
  onPropertyChange,
  onDrag,
}) => {
  const [isDragging, setIsDragging] = React.useState(false);
  const dragRef = React.useRef({ startX: 0, startY: 0, compX: 0, compY: 0 });

  // Manejo de Arrastre Touch y Mouse
  const handlePointerDown = (e: React.PointerEvent) => {
    // Si hizo clic en un pin o botón de eliminar, no iniciar arrastre
    if ((e.target as HTMLElement).closest('.cursor-pointer')) return;

    e.stopPropagation();
    setIsDragging(true);
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      compX: component.x,
      compY: component.y,
    };
    onSelect(component.id);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    const nextX = Math.max(10, Math.round(dragRef.current.compX + dx));
    const nextY = Math.max(10, Math.round(dragRef.current.compY + dy));
    onDrag(component.id, nextX, nextY);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (isDragging) {
      setIsDragging(false);
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        // Ignorar si ya se liberó
      }
    }
  };

  return (
    <div
      style={{
        transform: `translate(${component.x}px, ${component.y}px)`,
        touchAction: 'none',
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      // Sin esto el click burbujea al lienzo, que deselecciona el componente justo después de tocarlo.
      onClick={(e) => e.stopPropagation()}
      className={`absolute cursor-move transition-shadow ${
        isSelected ? 'ring-2 ring-arduino-teal/80 ring-offset-2 ring-offset-slate-950 rounded-lg' : ''
      }`}
    >
      {/* Botón flotante para eliminar componente cuando está seleccionado */}
      {isSelected && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(component.id);
          }}
          className="absolute -top-3 -right-3 z-30 p-1.5 rounded-full bg-red-600 hover:bg-red-500 text-white shadow-lg active:scale-90 transition cursor-pointer"
          title="Eliminar Componente"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      )}

      {/* Renderizado de cada componente */}
      {component.type === 'arduino-uno' && (
        <ArduinoUnoPart
          component={component}
          selectedPin={selectedPin}
          onPinTouch={onPinTouch}
          isRunning={isRunning}
        />
      )}

      {component.type === 'led' && (
        <LedPart
          component={component}
          selectedPin={selectedPin}
          onPinTouch={onPinTouch}
          isRunning={isRunning}
        />
      )}

      {component.type === 'resistor' && (
        <ResistorPart
          component={component}
          selectedPin={selectedPin}
          onPinTouch={onPinTouch}
        />
      )}

      {component.type === 'pushbutton' && (
        <PushbuttonPart
          component={component}
          selectedPin={selectedPin}
          onPinTouch={onPinTouch}
          onTogglePress={(isPressed) => onPropertyChange(component.id, 'isPressed', isPressed)}
        />
      )}

      {component.type === 'servo-sg90' && (
        <ServoPart
          component={component}
          selectedPin={selectedPin}
          onPinTouch={onPinTouch}
        />
      )}

      {component.type === 'ultrasonic-hcsr04' && (
        <UltrasonicPart
          component={component}
          selectedPin={selectedPin}
          onPinTouch={onPinTouch}
          onDistanceChange={(cm) => onPropertyChange(component.id, 'distanceCm', cm)}
        />
      )}
      {component.type === 'esp32' && (
        <Esp32Part component={component} selectedPin={selectedPin} onPinTouch={onPinTouch} isRunning={isRunning} />
      )}

      {component.type === 'switch' && (
        <SwitchPart
          component={component}
          selectedPin={selectedPin}
          onPinTouch={onPinTouch}
          onToggle={(closed) => onPropertyChange(component.id, 'closed', closed)}
        />
      )}

      {component.type === 'ldr' && <LdrPart component={component} selectedPin={selectedPin} onPinTouch={onPinTouch} />}

      {component.type === 'multimeter' && (
        <MultimeterPart component={component} selectedPin={selectedPin} onPinTouch={onPinTouch} />
      )}

      {component.type === 'battery' && (
        <BatteryPart component={component} selectedPin={selectedPin} onPinTouch={onPinTouch} />
      )}

      {component.type === 'buzzer' && (
        <BuzzerPart component={component} selectedPin={selectedPin} onPinTouch={onPinTouch} isRunning={isRunning} />
      )}

      {component.type === 'potentiometer' && (
        <PotentiometerPart
          component={component}
          selectedPin={selectedPin}
          onPinTouch={onPinTouch}
          onValueChange={(value) => onPropertyChange(component.id, 'value', value)}
        />
      )}
    </div>
  );
};
