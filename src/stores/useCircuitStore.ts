/**
 * @file useCircuitStore.ts
 * @description Store global con Zustand para gestión de componentes, cables y selección táctil "Tocar y Tocar".
 */

import { create } from 'zustand';
import type { CircuitComponent, ComponentType, WireConnection } from '../types/circuit';
import { createComponentFactory } from '../core/componentsRegistry';
import { isBoardType } from '../core/boards';
import { BREADBOARD_SIZES, getBreadboardPins, type BreadboardSize } from '../core/breadboard';
import {
  computePlugs,
  computeSnap,
  getComponentCenter,
  getComponentSize,
  normalizeRotation,
  rotatePoint,
} from '../core/geometry';

export interface SelectedPinInfo {
  componentId: string;
  pinId: string;
}

interface CircuitStoreState {
  components: CircuitComponent[];
  wires: WireConnection[];
  selectedPin: SelectedPinInfo | null;
  selectedComponentId: string | null;

  // Acciones de Componentes
  addComponent: (type: ComponentType, x?: number, y?: number, options?: { size?: BreadboardSize }) => void;
  /** Cambia el tamaño de una protoboard conservando los cables cuyos agujeros siguen existiendo. */
  resizeBreadboard: (id: string, size: BreadboardSize) => void;
  removeComponent: (id: string) => void;
  updateComponentPosition: (id: string, x: number, y: number) => void;
  /** Encaja el componente en la protoboard más cercana (si corresponde) al soltarlo. */
  settleComponent: (id: string) => void;
  /** Gira 90° el componente (si es una protoboard, lo enchufado gira con ella). */
  rotateComponent: (id: string) => void;
  updateComponentProperty: (id: string, property: string, value: any) => void;
  selectComponent: (id: string | null) => void;

  // Acciones de Cableado Táctil ("Tocar y Tocar")
  handlePinTouch: (componentId: string, pinId: string) => boolean; // retorna true si se conectó
  cancelPinSelection: () => void;
  removeWire: (wireId: string) => void;
  
  // Acciones de Proyecto
  resetCircuit: () => void;
  loadCircuit: (components: CircuitComponent[], wires: WireConnection[]) => void;
}

/**
 * Determina el color estándar de un cable según los tipos de los pines conectados.
 */
function resolveWireColor(fromType?: string, toType?: string, fromName?: string, toName?: string): string {
  const combinedNames = `${fromName || ''} ${toName || ''}`.toUpperCase();
  const combinedTypes = `${fromType || ''} ${toType || ''}`.toLowerCase();

  if (combinedTypes.includes('ground') || combinedNames.includes('GND')) {
    return '#1E293B'; // Negro / Pizarra (GND)
  }
  if (combinedNames.includes('5V') || combinedNames.includes('VCC')) {
    return '#EF4444'; // Rojo (5V / VCC)
  }
  if (combinedNames.includes('3.3V') || combinedNames.includes('3V3')) {
    return '#F97316'; // Naranja (3.3V)
  }
  if (combinedTypes.includes('analog') || combinedNames.includes('A0') || combinedNames.includes('A1')) {
    return '#10B981'; // Verde (Señal analógica)
  }
  if (combinedTypes.includes('pwm') || combinedNames.includes('PWM')) {
    return '#EAB308'; // Amarillo (PWM)
  }
  return '#3B82F6'; // Azul estándar para señales digitales
}

export const useCircuitStore = create<CircuitStoreState>((set, get) => ({
  components: [
    createComponentFactory('arduino-uno'),
    createComponentFactory('led'),
    createComponentFactory('resistor'),
  ],
  wires: [],
  selectedPin: null,
  selectedComponentId: null,

  addComponent: (type, x, y, options) => {
    const newComp = createComponentFactory(type, undefined, options);
    if (x !== undefined && y !== undefined) {
      newComp.x = x;
      newComp.y = y;
    } else if (!isBoardType(type)) {
      // Posición escalonada para que no se solapen
      const count = get().components.length;
      newComp.x = 250 + (count % 4) * 80;
      newComp.y = 80 + Math.floor(count / 4) * 80;
    }

    set((state) => {
      // El circuito tiene una sola placa: agregar otra reemplaza a la actual y quita sus cables.
      const replaced = isBoardType(type) ? state.components.filter((c) => isBoardType(c.type)).map((c) => c.id) : [];
      return {
        components: [...state.components.filter((c) => !replaced.includes(c.id)), newComp],
        wires: state.wires.filter((w) => !replaced.includes(w.fromComponentId) && !replaced.includes(w.toComponentId)),
        selectedComponentId: newComp.id,
        selectedPin: null,
      };
    });
  },

  resizeBreadboard: (id, size) => {
    set((state) => {
      const comp = state.components.find((c) => c.id === id && c.type === 'breadboard');
      if (!comp) return state;
      const pins = getBreadboardPins(size);
      const ids = new Set(pins.map((p) => p.id));
      const updated = { ...comp, pins, name: `Protoboard ${BREADBOARD_SIZES[size].label.toLowerCase()}`, properties: { ...comp.properties, size } };
      const keep = (cid: string, pid: string) => cid !== id || ids.has(pid);
      return {
        components: state.components.map((c) => (c.id === id ? updated : c)),
        wires: state.wires.filter((w) => keep(w.fromComponentId, w.fromPinId) && keep(w.toComponentId, w.toPinId)),
        selectedPin: null,
      };
    });
  },

  removeComponent: (id) => {
    set((state) => ({
      components: state.components.filter((c) => c.id !== id),
      wires: state.wires.filter((w) => w.fromComponentId !== id && w.toComponentId !== id),
      selectedComponentId: state.selectedComponentId === id ? null : state.selectedComponentId,
      selectedPin: state.selectedPin?.componentId === id ? null : state.selectedPin,
    }));
  },

  updateComponentPosition: (id, x, y) => {
    set((state) => {
      const moving = state.components.find((c) => c.id === id);
      if (!moving) return state;
      const dx = x - moving.x;
      const dy = y - moving.y;
      // Al mover una protoboard, lo enchufado en ella la acompaña.
      const carried = new Set(
        moving.type === 'breadboard'
          ? state.wires.filter((w) => w.plug && w.toComponentId === id).map((w) => w.fromComponentId)
          : []
      );
      return {
        components: state.components.map((c) =>
          c.id === id ? { ...c, x, y } : carried.has(c.id) ? { ...c, x: c.x + dx, y: c.y + dy } : c
        ),
      };
    });
  },

  settleComponent: (id) => {
    set((state) => {
      const comp = state.components.find((c) => c.id === id);
      if (!comp || comp.type === 'breadboard') return state;
      const boards = state.components.filter((c) => c.type === 'breadboard');
      const free = state.wires.filter((w) => !(w.plug && w.fromComponentId === id));
      const snap = computeSnap(comp, boards);
      const moved = snap ? { ...comp, x: comp.x + snap.dx, y: comp.y + snap.dy } : comp;
      const plugs = snap ? computePlugs(moved, boards) : [];
      // Un agujero ocupado por otro componente no admite una segunda pata.
      const taken = new Set(free.filter((w) => w.plug).map((w) => `${w.toComponentId}:${w.toPinId}`));
      const accepted = plugs.filter((p) => !taken.has(`${p.toComponentId}:${p.toPinId}`));
      return {
        components: state.components.map((c) => (c.id === id ? moved : c)),
        wires: [...free, ...accepted],
      };
    });
  },

  rotateComponent: (id) => {
    set((state) => {
      const comp = state.components.find((c) => c.id === id);
      if (!comp) return state;
      const center = getComponentCenter(comp);
      const rotateAbout = (c: CircuitComponent): CircuitComponent => {
        const size = getComponentSize(c);
        const cc = rotatePoint(getComponentCenter(c), center, 90);
        return { ...c, x: cc.x - size.width / 2, y: cc.y - size.height / 2, rotation: normalizeRotation(c.rotation + 90) };
      };
      if (comp.type === 'breadboard') {
        const carried = new Set(state.wires.filter((w) => w.plug && w.toComponentId === id).map((w) => w.fromComponentId));
        return { components: state.components.map((c) => (c.id === id || carried.has(c.id) ? rotateAbout(c) : c)) };
      }
      return {
        components: state.components.map((c) => (c.id === id ? { ...c, rotation: normalizeRotation(c.rotation + 90) } : c)),
        wires: state.wires.filter((w) => !(w.plug && w.fromComponentId === id)),
      };
    });
    get().settleComponent(id);
  },

  updateComponentProperty: (id, property, value) => {
    set((state) => ({
      components: state.components.map((c) =>
        c.id === id
          ? { ...c, properties: { ...c.properties, [property]: value } }
          : c
      ),
    }));
  },

  selectComponent: (id) => {
    set({ selectedComponentId: id });
  },

  handlePinTouch: (componentId, pinId) => {
    const { selectedPin, components, wires } = get();

    // 1. Si no hay pin seleccionado -> Seleccionar este pin como origen
    if (!selectedPin) {
      set({ selectedPin: { componentId, pinId } });
      return false;
    }

    // 2. Si toca el mismo pin -> Deseleccionar (cancelar)
    if (selectedPin.componentId === componentId && selectedPin.pinId === pinId) {
      set({ selectedPin: null });
      return false;
    }

    // 3. Si toca otro pin -> Crear la conexión de cable
    const fromComp = components.find((c) => c.id === selectedPin.componentId);
    const toComp = components.find((c) => c.id === componentId);
    const fromPin = fromComp?.pins.find((p) => p.id === selectedPin.pinId);
    const toPin = toComp?.pins.find((p) => p.id === pinId);

    // Evitar cables duplicados exactos
    const exists = wires.some(
      (w) =>
        (w.fromComponentId === selectedPin.componentId &&
          w.fromPinId === selectedPin.pinId &&
          w.toComponentId === componentId &&
          w.toPinId === pinId) ||
        (w.fromComponentId === componentId &&
          w.fromPinId === pinId &&
          w.toComponentId === selectedPin.componentId &&
          w.toPinId === selectedPin.pinId)
    );

    if (!exists) {
      const color = resolveWireColor(fromPin?.type, toPin?.type, fromPin?.name, toPin?.name);
      const newWire: WireConnection = {
        id: `wire-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        fromComponentId: selectedPin.componentId,
        fromPinId: selectedPin.pinId,
        toComponentId: componentId,
        toPinId: pinId,
        color,
      };

      set((state) => ({
        wires: [...state.wires, newWire],
        selectedPin: null,
      }));

      // Feedback háptico ligero si el navegador lo permite
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate?.(25);
      }
      return true;
    }

    set({ selectedPin: null });
    return false;
  },

  cancelPinSelection: () => {
    set({ selectedPin: null });
  },

  removeWire: (wireId) => {
    set((state) => ({
      wires: state.wires.filter((w) => w.id !== wireId),
    }));
  },

  resetCircuit: () => {
    set({
      components: [
        createComponentFactory('arduino-uno'),
        createComponentFactory('led'),
        createComponentFactory('resistor'),
      ],
      wires: [],
      selectedPin: null,
      selectedComponentId: null,
    });
  },

  loadCircuit: (components, wires) => {
    set({
      components,
      wires,
      selectedPin: null,
      selectedComponentId: null,
    });
  },
}));
