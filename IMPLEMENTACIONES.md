# Lista de implementaciones · Astra-01

Actualizada: 15 de octubre de 2026.

Edición final 2.0 implementada localmente. Las casillas marcadas corresponden a funciones incorporadas y verificadas con las pruebas descritas en README.md. Se incluyen Triple y Perforante; EMP queda expresamente aplazado. El balance con estudiantes y equipos reales sigue siendo una validación posterior, no una garantía derivada de las pruebas automáticas.

## Reglas que se conservan

- Vuelo arcade 3D infinito, sin misiones, preguntas, comandos ni pausas educativas obligatorias.
- Disparo automático y prioridad al pilotaje, las esquivas y las decisiones durante el vuelo.
- Mantener la recogida generosa junto a las alas y la atracción cercana. No ampliar por ello la zona de daño.
- Ningún patrón debe cerrar todas las salidas alcanzables. Los cambios de dificultad no deben producir impactos inevitables.
- Las herramientas de ciberseguridad son simulaciones locales; no escanean redes reales.
- Las estadísticas describen acciones del jugador, no certifican conocimientos.

## 1. Pilotaje y claridad del daño · prioridad alta

- [x] Afinar la respuesta de la nave para que sea inmediata y consistente con distintas tasas de imágenes.
- [x] Suavizar la inclinación al girar sin retrasar el movimiento real.
- [x] Dar al impulso una respuesta visual y sonora clara, conservando una cámara estable.
- [x] Señalar la dirección de los impactos y distinguir choque físico de proyectil.
- [x] Mantener visible la nave durante la protección temporal; evitar que desaparezca por completo al parpadear.
- [x] Usar efectos de daño breves, sin destellos o sacudidas que oculten el siguiente obstáculo.

Comprobación: el jugador debe entender qué acción hizo, por qué recibió daño y cuándo recupera el control visual del entorno.

## 2. Dificultad y economía · prioridad alta

- [x] Reservar las monedas para puntuación; quitar su recuperación automática de energía.
- [x] Crear cápsulas de reparación menos frecuentes y visualmente distintas de las monedas.
- [x] Incorporar enemigos móviles que obliguen a cambiar de carril.
- [x] Añadir ráfagas enemigas con señales visibles antes del disparo.
- [x] Diseñar patrones de barreras, enemigos y proyectiles, en lugar de depender solo de apariciones aleatorias.
- [x] Aumentar progresivamente la complejidad y la presión, no únicamente la velocidad.
- [x] Combinar obstáculos con rutas opcionales de monedas y comodines para ofrecer decisiones de riesgo y recompensa.
- [x] Revisar la frecuencia de reparaciones, respaldos y otros comodines para que los errores tengan consecuencias.
- [x] Probar los patrones con la velocidad máxima y con impulso: siempre debe existir una maniobra viable.

Comprobación: quedarse en el mismo carril no debe ser una estrategia suficiente, pero sobrevivir no debe depender de adivinar un peligro oculto.

## 3. Nmap como reconocimiento útil · prioridad alta

- [x] Reemplazar el protagonismo del minimapa actual por un pulso de escaneo visible dentro del túnel.
- [x] Marcar temporalmente los contactos detectados sobre el escenario para reducir la necesidad de apartar la vista.
- [x] Añadir balizas de red autorizadas con servicios de suministro simulados.
- [x] Representar los estados con símbolos y etiquetas breves: abierto, cerrado y filtrado. No depender solo del color.
- [x] Puerto abierto: mostrar un servicio activo al que el jugador puede dirigirse para recoger suministros.
- [x] Puerto cerrado: mostrar que no hay servicio disponible.
- [x] Puerto filtrado: comunicar que el estado no se puede determinar, sin presentarlo como seguro o peligroso por defecto.
- [x] Ajustar alcance, duración y disponibilidad del pulso para que elegir cuándo usarlo tenga valor.
- [x] Mantener los peligros inmediatos suficientemente visibles: no hacer obligatorio el escaneo para evitar un impacto inevitable.
- [x] Explicar en la ayuda que un puerto abierto no implica automáticamente una vulnerabilidad y que el suministro espacial es una analogía del juego.

Comprobación: usar Nmap debe cambiar una decisión de ruta o de recogida. El pulso informa; no destruye enemigos ni desactiva sus defensas.

Referencia conceptual: [guía oficial de Nmap](https://nmap.org/book/man.html).

## 4. Sonido y respuesta audiovisual · prioridad media

- [x] Diferenciar los sonidos de moneda, comodín, escaneo, impulso, impacto y peligro próximo.
- [x] Reforzar la recogida con un efecto breve que no tape la trayectoria.
- [x] Hacer que la música aumente de intensidad con la presión de la partida, sin interrumpirla.
- [x] Permitir ajustar música y efectos por separado, y silenciarlos.
- [x] Conservar señales visuales equivalentes para jugar sin sonido.
- [x] Ofrecer efectos reducidos y verificar legibilidad y rendimiento en equipos escolares.

## 5. Interfaz y enseñanza sin interrupciones · prioridad media

- [x] Simplificar la información visible durante el vuelo: energía y puntuación arriba; inventario abajo.
- [x] Hacer evidentes las cargas, el comodín activo y su duración o preparación.
- [x] Conservar confirmaciones de recogida legibles y evitar que las monedas borren el aviso de un comodín.
- [x] Evitar que avisos, radar o controles táctiles tapen la nave y los peligros cercanos.
- [x] Trasladar las explicaciones educativas largas a la ayuda y al resumen final.
- [x] Mantener los mensajes durante el vuelo breves y relacionados con la acción que acaba de ocurrir.
- [x] Verificar teclado, pantallas estrechas y controles táctiles con objetivos de al menos 44 × 44 píxeles.

## 6. Variedad, habilidad y repetición · prioridad media

- [x] Alternar tramos amplios, corredores estrechos y zonas con tráfico de drones dentro de una misma partida infinita.
- [x] Introducir los cambios de entorno sin pantallas de transición ni pausas.
- [x] Asegurar que los cambios visuales correspondan a los límites físicos reales del espacio de vuelo.
- [x] Bonificar esquivas ajustadas, cadenas de enemigos y rutas arriesgadas de monedas.
- [x] Equilibrar las bonificaciones para premiar habilidad, no solo recoger muchos objetos.
- [x] Ofrecer desbloqueos cosméticos de nave y colores, sin ventajas de combate permanentes.
- [x] Facilitar el reinicio inmediato tras perder.
- [x] Mostrar un resumen breve con tiempo, récord, causa del último impacto y utilidad observable de los comodines.
- [x] Incluir datos como proyectiles filtrados, ataques desviados, recuperaciones y servicios descubiertos, sin convertirlos en una nota académica automática.

## 7. Armas nuevas · Triple y Perforante implementadas

Se incorporaron dos armas adicionales. Las cápsulas mantienen el disparo automático, sustituyen temporalmente el arma y reinician su duración de 12 s sin acumularla. Después vuelve el láser básico. No añaden teclas ni consumen los cuatro comodines educativos.

| Arma | Función | Contrapeso | Orden propuesto |
|---|---|---|---|
| Láser básico existente | Disparo frontal preciso y constante. | Requiere alinear la nave. Debe seguir siendo viable por sí solo. | Conservar y equilibrar. |
| Disparo triple | Cubre tres trayectorias y ayuda frente a formaciones móviles. | Menor daño por proyectil o menor cadencia que el láser básico. | Incluida. |
| Rayo perforante | Atraviesa varios enemigos alineados. | Disparo más lento y estrecho; no atraviesa barreras sólidas ni elimina la necesidad de esquivar. | Incluida. |
| Pulso EMP ficticio | Interrumpe temporalmente el disparo de drones cercanos. | Escaso, de alcance corto; no elimina minas ni barreras. | Aplazado: no incluido por solapamiento con las defensas. |

- [x] Elegir las armas que entrarán en la primera versión y confirmar el alcance.
- [x] Definir duración, cadencia, daño, frecuencia de aparición y comportamiento al recoger otra cápsula.
- [x] Mostrar el arma equipada y su tiempo restante sin saturar la interfaz.
- [x] Diferenciar cápsulas de armas, reparaciones y comodines por forma e icono, además del color.
- [x] Verificar que las armas especiales no conviertan el vuelo en una partida trivial ni introduzcan caídas de rendimiento.
- [x] Mantener clara la separación educativa: Nmap reconoce; las armas son mecánicas ficticias de combate.

## Prioridades de integración

1. Pilotaje y claridad del daño.
2. Dificultad, reparaciones y patrones justos.
3. Nuevo Nmap y balizas de suministro.
4. Sonido e interfaz.
5. Variedad, bonificaciones y resumen final.
6. Armas seleccionadas, equilibradas sobre la dificultad ya ajustada.

La revisión final cubre el flujo completo de vuelo, suministros, poderes, armas, pausa, respaldo, pérdida, bitácora y reinicio. Se preservan las capturas históricas; la evidencia actual está en outputs/final-review. El detector visual termina sin errores y la simulación de diez minutos mantiene acotados objetos y contactos. Véase también VERIFICACION-FINAL.md para los límites de estas comprobaciones.
