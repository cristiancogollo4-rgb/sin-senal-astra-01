# Verificación final · Astra-01 2.0

15 de octubre de 2026. Resultado: **READY para la entrega local con el alcance acordado**. No es una certificación de accesibilidad, aprendizaje ni rendimiento de todos los equipos escolares.

## Alcance entregado

Arcade 3D infinito con patrones progresivos, monedas sin curación, reparación separada, balizas y reconocimiento Nmap, los cuatro comodines, láser/triple/perforante, avisos de daño, audio opcional, ajustes de fluidez, cosméticos sin ventaja y bitácora final. EMP se aplaza deliberadamente.

## Comprobaciones realizadas

| Comprobación | Resultado | Evidencia reproducible |
|---|---|---|
| Lógica del juego | 46/46 pruebas aprobadas. | npm test; tests/*.test.mjs |
| Patrones justos | 300 oleadas con hueco libre; movimientos entre huecos alcanzables al impulso máximo. | tests/final-edition.test.mjs |
| Continuidad y memoria | Diez minutos simulados; objetos, disparos y contactos permanecen acotados. | tests/final-edition.test.mjs |
| Primer reconocimiento | Tres estados de baliza identificados y un suministro recogido durante el vuelo, sin preguntas ni comandos. | work/final-review.cjs |
| Integración de combate | Los cuatro comodines, ambas armas nuevas, movimiento, pausa, respaldo, muerte, bitácora y reinicio funcionan. | work/final-review.cjs; escenarios controlados después del primer suministro |
| Sonido y preferencias | AudioContext en ejecución tras la interacción; volumen y selección se guardan cuando el almacenamiento está disponible. | work/final-review.cjs |
| Almacenamiento bloqueado | El vuelo continúa sin récord persistente. | work/final-review.cjs |
| Controles táctiles | Movimiento mediante eventos táctiles reales y objetivos de al menos 44 px. | work/final-review.cjs |
| Pantallas | Sin desbordamiento horizontal en 320×640, 390×844, 768×1024 y 844×390; escritorio 1380×900. | outputs/final-review/mobile-*.png |
| Fallos de carga y WebGL | Mensaje con acción de recuperación; pérdida de contexto verificada mediante la extensión WebGL del navegador. | work/final-edge-check.cjs |
| Audio ausente | El juego sigue funcionando y los ajustes informan de la limitación. | work/final-edge-check.cjs |
| Cosméticos | Selección desbloqueada con récord de prueba; color separado de los parámetros de combate. | work/final-edge-check.cjs |
| Gráficos | Escena con brillo renderizada; reducción automática activada con imágenes lentas controladas. No es una medición de FPS de hardware real. | work/final-edge-check.cjs; glow-combat.png es una escena preparada |
| Detector visual | 3 archivos analizados; 0 errores y 0 advertencias. Sin modificaciones automáticas. | npx --yes ui-craft-detect public, v0.13.0 |

Las pruebas de integración terminaron sin errores de JavaScript; la revisión principal tampoco registró errores de consola. Los fallos de red y gráficos del ensayo negativo se provocan expresamente para verificar su recuperación.

## Revisión de presentación, en orden

| Pase | Resultado |
|---|---|
| 1. Jerarquía | Escena y nave primarias; energía/arma secundarias; escaneo e inventario terciarios; explicaciones extensas en ayuda/bitácora. |
| 2. Tipografía | Seis tamaños utilitarios, más títulos fluidos; cifras tabulares. El texto académico se lee fuera de la acción. |
| 3. Superficies | Cabina, instrumentos y diálogo diferenciados. Tema oscuro deliberado; no se exige tema claro por el principio 5 del brief. |
| 4. Espacio | Instrumentos en bordes, separación de controles y avisos; posiciones de instrumentos ajustadas al espacio de vuelo. Se aceptan offsets ópticos heredados, no una normalización integral de CSS antiguo. |
| 5. Iconografía | Kit SVG coherente; puertos con símbolo y palabra. Las flechas de dirección y símbolos +/×/? codifican acciones/estados, no sustituyen iconos decorativos. |
| 6. Estados | Preparación, inventario vacío, habilidad disponible/activa, pausa, pérdida, recuperación, error de carga, pérdida de contexto y audio/almacenamiento ausentes cubiertos. Conflicto multiusuario no aplica: no hay servidor de partidas ni cuentas. Sin servidor local al cargar, se necesita restablecerlo y recargar; no se ofrece funcionamiento offline mediante caché. |
| 7. Movimiento | Cámara estable, nave visible al recibir daño, avisos con opacidad; preferencia de efectos reducidos y ajuste independiente. La navegación 3D sigue siendo movimiento esencial del juego. |
| 8. Texto | Acciones breves y consistentes; Nmap reconoce, no destruye; abierto no equivale a vulnerable y filtrado no equivale a seguro. |
| 9. Detalle | Capturas inspeccionadas en escritorio y móvil; avisos de recogida fuera del centro de pilotaje en móvil, duraciones y cargas explícitas. |
| 10. Datos | Puntos enteros, tiempo mm:ss, energía porcentual, distancias enteras y recuentos observados sin nota académica automática. |

## Cambios de pulido

| Antes | Ahora | Motivo |
|---|---|---|
| Minimapa grande con información duplicada. | Pulso, marcadores en la escena y servicios por carril. | La información permite elegir suministros sin apartar tanto la vista. |
| Monedas curativas y enemigos aislados. | Reparaciones escasas, patrones y ráfagas anunciadas. | Aumentar la presión sin exigir recogidas precisas ni impactos inevitables. |
| Aviso centrado sobre la nave en pantallas pequeñas. | Aviso lateral, inventario compacto y controles táctiles amplios. | Mantener visible el pilotaje. |

## Límites y decisiones aceptadas

- Pruebas de navegador en Chromium con renderizado por software; Safari, Firefox, GPU real y rendimiento de los equipos del colegio no comprobados.
- La música se sintetiza localmente. Se verificaron su inicio y sus controles; no se realizó una evaluación perceptual del sonido con alumnado.
- Las sesiones largas son simulaciones automatizadas. La dificultad necesita una sesión con estudiantes para calibrar frustración, comprensión y duración media.
- La interacción es visual y espacial; no se afirma equivalencia de experiencia para personas que no puedan ver la escena, según el principio 6 del brief.
- Oscuridad y luces funcionales son intencionales en una cabina arcade, según el principio 5. No se aplica una receta de página comercial.
- Se conservan estilos y capturas históricos que no forman parte de la experiencia actual. No se borra material anterior del proyecto.

## Entrega

Iniciar con npm start y abrir http://localhost:3000/?version=final. La entrega es local: no se publicó, no se abrieron cuentas y no se ejecutaron escaneos de red. El servidor de previsualización existente permanece disponible para jugar.
