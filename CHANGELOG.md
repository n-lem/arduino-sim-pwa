# Registro de Cambios (Changelog)

Todos los cambios notables en este proyecto serán documentados en este archivo.
El formato se basa en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/)
y este proyecto se adhiere a [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [0.3.0] - 2026-10-24 - Sprint 3: Integración de Google Blockly y CodeMirror (Sincronización en Tiempo Real)

### Añadido
- **Google Blockly Offline (`BlocklyWorkspace.tsx`):**
  - Espacio de trabajo de programación visual táctil, con soporte de gestos (pellizcar para zoom, arrastre de bloques y eliminación interactiva con papelera).
  - Caja de herramientas (Toolbox) en español estructurada pedagógicamente:
    - 🟢 **Estructura:** Bloque base `arduino_base` (`void setup()` y `void loop()`), configuración de pines `pinMode` (OUTPUT, INPUT, INPUT_PULLUP).
    - ⚡ **Digital:** Escritura digital `digitalWrite` (HIGH/LOW) y lectura `digitalRead`.
    - 〰️ **Analógico & PWM:** Escritura de modulador de ancho de pulsos `analogWrite` (0 a 255) y lectura analógica de 10 bits `analogRead` (A0 a A5).
    - ⏱️ **Tiempo:** Bloque de espera `delay(ms)` con bloques numéricos sombra.
    - ⚙️ **Servos & Sensores:** Control angular de servomotor SG90 (0° a 180°) y lectura de distancia ultrasónica HC-SR04 en centímetros.
    - 📟 **Monitor Serial:** Impresión con y sin salto de línea (`Serial.println` y `Serial.print`).
    - 🔀 **Lógica & Control:** Condicionales `if/else`, comparaciones y operadores booleanos.
    - 🔢 **Matemáticas & Variables:** Operaciones aritméticas y variables dinámicas.

- **Generador C++ de Arduino para Blockly (`arduinoGenerator.ts`):**
  - Motor de traducción automática desde el árbol de bloques a código estándar C++ de Arduino (`.ino`).
  - Detección e inclusión automática de cabeceras requeridas (`#include <Servo.h>`) e instanciación de objetos de servos.
  - Generación de funciones auxiliares integradas para cálculo de pulsos de sensor ultrasónico (`readUltrasonicDistance`).
  - Inicialización automática de `Serial.begin(9600)` al detectar bloques de comunicación serial.

- **Editor CodeMirror C++ (`CodeMirrorEditor.tsx`):**
  - Editor de código profesional con syntax highlighting C++, números de línea, autocompletado y tema oscuro.
  - Indicador de estado dinámico ("Sincronizado con Bloques" vs "Modo Manual").
  - Botón de descarga directa de archivo ejecutable de Arduino `sketch.ino`.
  - Botón de copiado al portapapeles con confirmación visual.

- **Sincronización Bidireccional (`useCodeStore.ts`):**
  - Reactividad inmediata: cualquier cambio, movimiento o ajuste de parámetro en los bloques traduce y actualiza el código C++ en tiempo real en memoria y en la vista de código.
  - Serialización XML de los bloques incluida en el esquema JSON del proyecto para guardado y restauración fiel.

---

## [0.2.0] - 2026-10-24 - Sprint 2: Estado Global (Zustand) y UI Táctil "Tocar y Tocar"

### Añadido
- **Estado Global con Zustand (`useCircuitStore.ts`):**
  - Gestión centralizada de componentes electrónicos (`components`), conexiones de cableado (`wires`) y estado de selección táctil activa (`selectedPin`).
  - Funciones atómicas para agregar, eliminar, mover componentes, actualizar propiedades interactivas y resetear el circuito.
  - Resolución inteligente y automática de colores de cable según el tipo de pin (GND en negro/pizarra, 5V/VCC en rojo, 3.3V en naranja, analógicos en verde, PWM/digitales en amarillo o azul).

- **Sistema Táctil "Tocar y Tocar" (Touch Wiring):**
  - Eliminación de la necesidad de arrastre (*drag-and-drop*) para cablear:
    1. El usuario toca el pin de origen: se resalta con halo amarillo pulsante y se muestra banner de guía superior.
    2. El usuario toca el pin de destino: se valida y traza automáticamente el cable Bézier.
    3. Si se toca el mismo pin nuevamente, la selección se cancela sin efectos colaterales.
  - Feedback háptico opcional mediante `navigator.vibrate` para dispositivos móviles compatibles.
  - Hitbox táctil agrandado invisible en cada pin (radio ampliado a 8-10px) para máxima precisión en pantallas capacitivas y touchpads de netbooks.

- **Componentes Electrónicos SVG Vectoriales Interactivos (`src/components/parts/`):**
  - **`ArduinoUnoPart.tsx`:** Placa Arduino Uno R3 realista en SVG con ATmega328P, pines digitales D0-D13, analógicos A0-A5, de alimentación (5V, 3.3V, GND, VIN, RESET, AREF) y LEDs integrados (L y ON).
  - **`LedPart.tsx`:** Diodo LED de 5mm con ánodo (+), cátodo (-), efecto de halo lumínico pulsante y color dinámico.
  - **`ResistorPart.tsx`:** Resistencia pasiva con código de colores según el valor en Ohms y terminales táctiles axiales.
  - **`PushbuttonPart.tsx`:** Pulsador táctil con botón interactivo (presionar/soltar) para entradas digitales.
  - **`ServoPart.tsx`:** Servomotor SG90 con carcasa azul, 3 pines táctiles (GND, 5V, PWM) y rotor/brazo móvil orientado según el ángulo configurado.
  - **`UltrasonicPart.tsx`:** Sensor ultrasónico HC-SR04 con transductores metálicos emisor (T) y receptor (R), 4 pines táctiles y control deslizante para simular distancia de obstáculos.

- **Capa de Cables SVG con Curvas de Bézier (`WireLayer.tsx`):**
  - Trazado suave y natural con curvatura física simulando cables de protoboard con filtro de sombra y brillo.
  - Eliminación táctil de cables al tocarlos o hacer clic sobre su trayectoria con hitbox ensanchado.

---

## [0.1.0] - 2026-10-24 - Sprint 1: Setup Inicial, PWA Offline y Layout Responsivo

### Añadido
- **Infraestructura Base:**
  - Inicialización del proyecto con **Vite**, **React 18** y **TypeScript** con tipado estricto.
  - Integración y configuración de **Tailwind CSS** con paleta técnica Arduino (`arduino-teal`, `arduino-darkTeal`, `slate-950`).
  - Configuración de iconos SVG vectoriales ultra livianos mediante `lucide-react`.

- **PWA y Soporte 100% Offline:**
  - Configuración de `vite-plugin-pwa` con Workbox (`generateSW`).
  - Estrategia de caché agresiva `CacheFirst` para todo el core (scripts, estilos, fuentes, WASM, JSON, imágenes).
  - Manifiesto de aplicación web (`manifest.webmanifest`) para instalación standalone en celulares (Android) y sistemas de escritorio (Windows/Lubuntu).
  - Registro automático del Service Worker en `main.tsx`.
  - Favicon SVG vectorial representativo de Arduino Uno.

- **Diseño Mobile-First y Adaptabilidad:**
  - Layout principal responsivo (`App.tsx`):
    - **Modo Móvil / Pantallas Chicas:** Barra de navegación táctil inferior/superior (`NavigationTabs.tsx`) para alternar fluidamente entre **Circuito**, **Bloques**, **Código C++** y **Monitor Serial**.
    - **Modo Desktop / Pantallas Grandes:** *Split View* simultáneo con el lienzo de circuitos a la izquierda y el entorno de código/bloques a la derecha.
  - Barra superior táctil (`Header.tsx`):
    - Botones de acción rápida con áreas de toque mínimas de 44x44px.
    - Controles de simulación (Iniciar / Detener / Reiniciar).
    - Indicador visual de estado offline.
    - Acciones de importación y exportación de proyecto JSON.
  - Lienzo interactivo inicial (`CircuitCanvas.tsx`):
    - Cuadrícula de ingeniería con escalado dinámico (Zoom in / Zoom out / Centrado).
    - Paleta flotante de componentes (`ComponentPalette.tsx`) preparada para inserción rápida de Arduino Uno, LEDs, resistencias, pulsadores, servos y sensores sin requerir arrastre.
  - Tipos base en TypeScript (`src/types/circuit.ts`):
    - Definición de contratos para componentes (`CircuitComponent`), pines (`PinDefinition`), conexiones (`WireConnection`) y modos de vista (`ViewMode`).

### Decisiones Técnicas y Arquitectura
- **Abandono de PySide6 / Python local:** Se reemplazó la dependencia de Python, .venv y compiladores nativos para garantizar compatibilidad directa en netbooks educativas (Conectar Igualdad G2/G3/G4 de 2GB de RAM) y celulares mediante la web estándar y PWA.
- **Preparación para AVR8js y Blockly:** Se definió la arquitectura modular en capas (`core/`, `components/`, `stores/`, `hooks/`, `types/`, `services/`) para desacoplar el ciclo de emulación del renderizado visual.
