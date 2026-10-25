# Registro de Cambios (Changelog)

Todos los cambios notables en este proyecto serán documentados en este archivo.
El formato se basa en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/)
y este proyecto se adhiere a [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
