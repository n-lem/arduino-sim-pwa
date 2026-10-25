# Registro de Cambios (Changelog)

Todos los cambios notables en este proyecto serán documentados en este archivo.
El formato se basa en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/)
y este proyecto se adhiere a [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.5.0] - Protoboard y desplazamiento del lienzo

### Agregado
- **Protoboard** en 4 tamaños: mini (10 columnas), chica (17), mediana (30) y grande (63). Se cambia el tamaño desde el panel de propiedades (los cables de agujeros que desaparecen se quitan).
- El solver une las tiras internas: columnas a–e y f–j, y rieles +/− (`core/breadboard.ts`).
- **Desplazamiento del lienzo** arrastrando el fondo (mouse o dedo) y zoom hasta 30 %, para usar protoboards grandes en celulares y notebooks chicas.
- Test de continuidad de la protoboard (32 tests).

## [1.4.0] - ESP32, nuevos componentes y bloques mejorados

### Agregado
- Placa **ESP32** (lógica 3,3 V, ADC 0–4095, GPIO reales). El **Arduino Uno se puede eliminar** y las placas se reemplazan desde "Agregar componente → Placas".
- Abstracción de placas (`core/boards.ts`); el solver, el intérprete y los menús de pines de los bloques dependen de la placa activa.
- **Interruptor**, **LDR** (control de luz) y **Multímetro** (voltímetro).
- **Sonido real** del buzzer y de `tone()`/`noTone()` (Web Audio, sin internet).
- **Entrada Serial**: campo de texto en el monitor para `Serial.read/available/readString`.
- Tests del ESP32, interruptor, LDR y multímetro (31 en total).

### Cambiado
- Bloques con el renderer **zelos** (más legible y táctil), `ResizeObserver` que corrige el área recortada en PC, y reparto 40/60 circuito/editor.
- Programa de bloques por defecto usa explícitamente el pin 13.

## [1.3.0] - Baterías, ley de Ohm y edición de componentes

### Agregado
- Componente **Batería** (1,5–12 V, editable) con resistencia interna; el circuito puede funcionar sin Arduino.
- Dibujos de **Potenciómetro** (perilla arrastrable) y **Buzzer** (ondas al sonar).
- **Panel de propiedades** al seleccionar: valor de resistencia (presets y texto libre, ej. `4.7k`), tensión de batería, color de LED, posición del potenciómetro, distancia del HC-SR04, reparar LED quemado.
- **Mediciones en vivo** (V y mA) en resistencias y en el panel, para aplicar la ley de Ohm.
- Colores de las bandas de la resistencia según su valor.
- **Menú "Agregar componente"** desplegable y categorizado.
- Tecla Supr/Retroceso elimina el componente seleccionado.

### Corregido
- Un componente tocado se deseleccionaba al instante (el click burbujeaba al lienzo), por lo que no se podía borrar.

### Técnico
- `core/electronics.ts` (presets, formato y parseo de unidades) con tests; solver con `measurements` y fuentes flotantes. 27 tests.

## [1.2.0] - Solver eléctrico real y corrección de bugs

- Nuevo solver DC por análisis nodal (MNA): un LED entre 5V y GND se quema, avisos de cortocircuito/sobrecorriente, pulsadores, potenciómetro y HC-SR04 llegan al sketch.
- Corregido: los bloques "Esperar" iniciales quedaban con el número desconectado (`delay(0)`); ahora se siembran por XML y se reparan proyectos guardados.

## [1.1.0] - 2026-10-25 - Intérprete C++ real y base de tests

### Añadido
- **Intérprete de C++ Arduino (`src/core/interpreter/`):** lexer, parser a AST y evaluador basado en generadores (cooperativo: `delay()` no congela la UI). Soporta variables tipadas con desbordamiento AVR, arrays, funciones, `if/for/while/do/switch`, `String`, `Serial`, `#define`, funciones matemáticas y de pines, `Servo`.
- **Registro de librerías (`registerLibrary`)** como punto de extensión para librerías adicionales.
- Errores de sintaxis/ejecución con número de línea, mostrados en el Monitor Serial.
- Tests con Vitest (`npm test`).
- `AvrRunner` expone `setAnalogInput`, `setPulseInput` y `setExternalInput` para sensores/pulsadores.

### Cambiado
- Se reemplazó el parser de sentencias por regex de `avrRunner.ts` por el intérprete nuevo.

### Decisiones técnicas
- Motor A (intérprete, sin avr-gcc) para funcionar 100% en navegador/celular. Tauri se usará para la versión portable de escritorio.

---

 - 2026-10-24 - Sprint 5: Persistencia en IndexedDB, Autoguardado Offline y Sistema de Evaluación (JSON / .ino / .png)

### Añadido
- **Persistencia Local con IndexedDB (`storage.ts`):**
  - Implementación con `idb` para almacenamiento local seguro y persistente sin internet en cualquier navegador o celular.
  - Almacén de sesiones activas (`sessions`) para restaurar automáticamente el último estado de trabajo al abrir la aplicación.
  - Almacén de proyectos con nombre (`projects`) para guardar múltiples ejercicios o prácticas escolares en memoria local.
- **Hook de Autoguardado Continuo (`useAutoSave.ts`):**
  - Autoguardado automático en segundo plano con *debouncing* (1.2 segundos sin interacción).
  - Indicador visual dinámico en la barra superior ("Guardando..." / "Guardado") para que el estudiante o docente sepa que su trabajo está a salvo.
  - Restauración instantánea de componentes, cables, código C++ y árbol XML de Blockly en el primer montaje.
- **Sistema de Evaluación Docente e Intercambio JSON (`serializer.ts` y `schema.ts`):**
  - Esquema estandarizado `ArduinoProjectSchema` (versión 1.0.0) que encapsula metadatos (autor, nombre, fecha), componentes, conexiones, sketch C++ y bloques XML en un único archivo `.json`.
  - Deserializador con validación de integridad para evitar caídas ante archivos manipulados o corruptos.
- **Exportación Multi-Formato (`ExportModal.tsx` y `exporter.ts`):**
  - Modal táctil optimizado para celulares y netbooks con tres modalidades de descarga:
    1. 📦 **Proyecto Completo (`.json`):** Formato universal para entregar tareas a docentes o respaldo.
    2. 💻 **Código Fuente (`.ino`):** Archivo listo para abrir con el Arduino IDE oficial y programar la placa física.
    3. 🖼️ **Captura del Diagrama (`.png`):** Renderizado en alta definición del circuito esquemático sobre fondo oscuro para insertar en informes y monografías.
- **Gestión de Proyectos (`ProjectModal.tsx`):**
  - Modal para importar archivos `.json` mediante selector de archivos táctil o arrastrar y soltar.
  - Creación de "Nuevo Circuito" con confirmación de seguridad para reiniciar el lienzo.
  - Lista de proyectos guardados localmente con fecha y opción de borrado individual.

---

## [0.4.0] - 2026-10-24 - Sprint 4: Emulación AVR8js en Tiempo Real, PasswordGate y Despliegue en GitHub Pages

### Añadido
- **Emulador ATmega328P con AVR8js (`avrRunner.ts`):**
  - Motor de simulación del microcontrolador ATmega328P de 16 MHz emulado en JavaScript / WebAssembly.
  - Mapeo completo de registros de puertos I/O:
    - **Port B (PB0 a PB5):** Pines digitales 8 al 13 (incluyendo pin 13 / LED L integrado).
    - **Port D (PD0 a PD7):** Pines digitales 0 al 7 (TX, RX y salidas PWM).
    - **Port C (PC0 a PC5):** Pines analógicos A0 al A5.
  - Temporizadores de hardware integrados (`timer0Config`, `timer1Config`, `timer2Config`) para PWM y delays.
  - Módulo USART (`AVRUSART`) a 9600 baudios para emisión y recepción de datos por el puerto serie.
- **Conexión Reactiva Circuito-Emulador (`useSimulationLoop.ts` y `useSimulationStore.ts`):**
  - Escucha de cambios de estado en los pines digitales de Arduino y propagación a los componentes conectados en el lienzo:
    - Los LEDs conectados al pin 13 o pines digitales se encienden (`isOn: true`) cuando el microcontrolador escribe `HIGH` y se apagan en `LOW`.
    - Los servomotores SG90 orientan su rotor visual en grados (0° a 180°) según el valor recibido por el pin PWM.
    - Soporte para inyección de entradas digitales externas (pulsadores).
  - Terminal de salida en tiempo real en la pestaña **Monitor Serial** con soporte para saltos de línea y botón de limpieza de consola.
- **Protección de Acceso con Contraseña (`PasswordGate.tsx`):**
  - Barrera de seguridad para acceso restringido a estudiantes y docentes.
  - Contraseña predeterminada: `arduino2026`.
  - Opción "Recordar en este celular / netbook" para persistir la sesión localmente en `localStorage`.
- **Despliegue Continuo a GitHub Pages (`gh-pages`):**
  - Configuración de base path `/arduino-sim-pwa/` en `vite.config.ts`.
  - Publicación automatizada en GitHub Pages en `https://n-lem.github.io/arduino-sim-pwa/`.

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
