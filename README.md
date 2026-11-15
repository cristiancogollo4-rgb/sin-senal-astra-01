# Sin Señal · Astra-01 · Edición final 2.0

Arcade espacial 3D infinito para estudiantes. Pilotar, esquivar y superar el récord es el centro de la experiencia. Los comodines representan funciones de ciberseguridad y se recogen y activan durante el vuelo.

Las mejoras implementadas están en [la lista de implementaciones](IMPLEMENTACIONES.md). El EMP permanece aplazado; la versión final incluye láser, disparo triple y rayo perforante. Todo se ejecuta localmente.

## Ejecutar

Requiere Node.js 18 o superior, WebGL 2 y aceleración gráfica.

```bash
npm install
npm start
```

Abre [la edición final en localhost:3000](http://localhost:3000/?version=final). La librería 3D se sirve localmente, sin CDN. No hace falta compilar ni crear una cuenta. Si aparece un error de carga, comprueba que el servidor siga abierto; si falla WebGL, activa la aceleración gráfica y recarga.

## Vuelo infinito

No hay misiones, pantallas de victoria, transiciones obligatorias ni pausas educativas automáticas. La partida sigue hasta agotar la energía. La presión crece cada 22 segundos; cada 28 segundos alternan corredores abiertos, conductos con más barreras y tráfico orbital con más drones. El color del túnel cambia cada 42 segundos sin detener la acción. Los patrones reservan un hueco alcanzable y las ráfagas enemigas tienen un aviso previo de 0,85 segundos.

La nave dispara automáticamente. Hay drones móviles, minas resistentes, barreras con huecos y proyectiles enemigos. Las monedas doradas solo dan puntos. Las cruces verdes reparan 20 puntos de energía y los servicios abiertos reconocidos proporcionan 12. La recogida abarca las alas y atrae suavemente monedas y cápsulas cercanas, sin ampliar la zona de daño. Las balizas permanecen en su carril. Destruir enemigos y hacer esquivas ajustadas sube el combo; recoger monedas no lo multiplica por sí solo.

El vuelo comienza a 30 m/s y la dirección responde a 6,4 m/s. Shift añade 9 m/s de avance y aumenta la rapidez lateral a 8,6 m/s. La velocidad de crucero llega como máximo a 44 m/s, 53 con impulso. La cámara se mantiene estable y la nave sigue visible durante la protección temporal tras un impacto. Cada impacto quita 20 puntos y muestra su tipo y dirección.

## Armas automáticas

| Arma | Función | Equilibrio |
|---|---|---|
| Láser | Disparo frontal constante. | 1 punto de daño cada 0,18 s. Siempre disponible. |
| Triple | Tres trayectorias divergentes. | 0,65 puntos por proyectil cada 0,24 s; menos eficaz contra un único objetivo alineado. |
| Perforante | Atraviesa enemigos alineados, sin golpear dos veces al mismo. | 2 puntos cada 0,48 s. Las barreras sólidas detienen el rayo. |

Las cápsulas cambian automáticamente el arma durante 12 segundos. Otra cápsula sustituye el arma y reinicia ese tiempo, sin acumular duración. Después vuelve el láser. No requieren nuevas teclas y no consumen el inventario educativo.

## Comodines

Cada tipo se guarda en el inventario (máximo dos cargas). El jugador elige cuándo activarlo; una habilidad ya activa no consume otra carga.

| Tecla | Comodín | Efecto arcade | Relación educativa |
|---|---|---|---|
| 1 o Espacio | Nmap | Pulso visible de hasta 110 m; revela contactos y estados de balizas durante 10 s. Permite elegir una ruta hacia suministros. | Reconocimiento de equipos y servicios en redes autorizadas. No destruye enemigos ni garantiza que un servicio sea seguro. |
| 2 | Firewall | Filtra proyectiles cerca de la nave durante 10 s. No bloquea choques con minas, drones ni barreras. | Filtrado de tráfico mediante reglas, con alcance limitado. |
| 3 | Señuelo | Nave holográfica que atrae proyectiles durante 8 s. | Honeypot: recurso señuelo para atraer y observar actividad sospechosa. |
| 4 | Respaldo | Prepara una recuperación. Un impacto fatal restaura una vez la energía guardada (mínimo 60), conservando tiempo, distancia y puntos. | Las copias permiten recuperar datos y sistemas tras un incidente. No representan invulnerabilidad. |

WASD/flechas mueven la nave, Shift acelera y P/Escape pausa. En móvil se usan dirección, impulso ⇥ y los cuatro botones del inventario. Los controles táctiles tienen al menos 44 píxeles. La pausa congela armas, escaneo, puntuación y simulación. Abrir ayuda o ajustes también pausa el vuelo; cierra el diálogo y pulsa Continuar.

Las balizas muestran su estado sobre el escenario y en un panel compacto con su carril (izquierda, centro, derecha): **+ ABIERTO** indica servicio activo; **× CERRADO**, ausencia de servicio; **? FILTRADO**, estado indeterminado. Solo una baliza abierta con reconocimiento vigente proporciona suministros. La relación entre un servicio y una carga espacial es ficción; un puerto abierto no implica vulnerabilidad.

## Sonido, rendimiento y apariencia

Los sonidos y la música son sintetizados originales con Web Audio, sin descargas ni recursos externos. Empiezan tras una acción del jugador y todos los avisos tienen equivalente visual. Ajustes permite controlar música y efectos por separado, silenciar todo y reducir efectos visuales. Si no hay audio disponible, el juego continúa en silencio.

Gráficos ofrece brillo, fluidez sin posprocesado y modo automático, que reduce la carga si detecta imágenes lentas. El túnel usa geometría agrupada. Las mediciones con renderizado por software no representan el rendimiento de una GPU real.

Los diseños Solar y Umbra se desbloquean a 1500 y 5000 puntos de récord, respectivamente. Solo cambia el color de la nave, no las estadísticas. Preferencias y récord final se guardan en este navegador si el almacenamiento está disponible; los récords de versiones anteriores se conservan con sus claves originales. El juego también funciona sin almacenamiento.

## Aprendizaje

Durante el vuelo se muestra solo una confirmación breve. La ayuda reúne los efectos y su relación con ciberseguridad. Al perder puedes reiniciar inmediatamente o leer la bitácora: servicios identificados, suministros obtenidos, proyectiles filtrados, ataques desviados y recuperaciones. También informa de la causa del último impacto, monedas, combo, armas y esquivas. Son registros de acciones, no una certificación de conocimientos.

Fuentes: [Nmap](https://nmap.org/book/man.html), [firewall de NIST](https://csrc.nist.gov/glossary/term/firewall), [honeypot de NIST](https://csrc.nist.gov/glossary/term/honeypot) y [respaldos y recuperación de CISA](https://www.cisa.gov/stopransomware/ransomware-guide).

## Verificación

```bash
npm test
```

46 pruebas de lógica cubren colisiones, recogida, inventario, Nmap, estados de puertos, suministros, los cuatro comodines, las tres armas, pausa, expiración, esquivas, patrones con salidas alcanzables y liberación de objetos en una simulación de diez minutos. Incluyen la regresión de monedas sin curación y la separación entre recogida y daño.

`work/final-review.cjs` utiliza el Playwright instalado en este entorno de Codex. Comprueba el primer escaneo y suministro durante el vuelo real; con escenarios controlados verifica los cuatro comodines, ambas armas nuevas, movimiento, pausa, ajustes, respaldo, pérdida, bitácora, reinicio y almacenamiento bloqueado. Comprueba toques reales y ausencia de desbordamiento horizontal en 320×640, 390×844, 768×1024 y 844×390. Las capturas quedan en `outputs/final-review`.

`work/final-edge-check.cjs` comprueba recuperación ante fallo de carga y pérdida de WebGL, desbloqueo cosmético, gráficos con brillo y funcionamiento sin audio. `work/graphics-check.cjs` y `work/gameplay-check.cjs` son accesos de compatibilidad a la revisión final. `work/render-benchmark.cjs` mide operaciones de dibujo y tiempos de una escena controlada.

Todos los efectos son locales y ficticios. No se ejecuta Nmap ni se escanean redes reales. No hay cuentas, telemetría, compras ni ventajas de pago. Las pruebas automatizadas no sustituyen una sesión de evaluación con estudiantes ni la calibración en los equipos reales del colegio.
