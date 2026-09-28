# Osomi · Estado de desarrollo

Nombre confirmado: **Osomi**. Subtítulo: **Mira más de cerca**. Reemplaza el nombre de trabajo anterior, Lucarit.

## Entregado en este bloque

- Marca en pantalla inicial, metadatos, paquete y documentos vigentes. Pantalla provisional; no representa todavía el storyboard.
- Catálogo: experiencias, versiones, manifiesto de escenas y conexiones editoriales.
- Datos personales: perfiles, preferencias, progreso y notas con permisos propios por usuario.
- Operación privada: visitantes, recibos, fusiones, personal, preguntas/mensajes, contacto, auditoría y eventos. Preguntas sin referencia a cuenta, visitante o sesión de medición del autor.
- Borradores ocultos; metadatos de versiones publicadas visibles solo para experiencias listadas. Una ficha listada sin versión activa representa contenido próximo.
- Versiones publicadas inmutables y referencia de publicación perteneciente a la misma experiencia. El manifiesto requiere una escena de cierre antes de publicar.
- Restricciones de propietario, versión, escena, estados, límites de texto y revisión; índices para FKs y accesos principales.
- Preguntas/contacto/personal sin acceso directo para usuarios del navegador. La pertenencia al personal no abre acceso a notas personales.
- Tipos oficiales regenerados desde el esquema real, usados por los clientes Supabase.

Las ocho migraciones siguientes están aplicadas en Supabase de desarrollo.

## Migraciones

1. `20260921005042_initial_schema.sql`: perfiles, preferencias e identidad anónima.
2. `20260921005100_preferences_rpc.sql`: RPC de preferencias y transferencia.
3. `20260921005957_private_preference_entrypoint.sql`: entrada pública sin privilegios elevados y lógica privada.
4. `20260921014927_content_journeys_operations.sql`: catálogo, recorridos, notas y operación.
5. `20260921015919_raw_text_limits.sql`: límites de texto sobre el valor completo, incluidos espacios.

6. `20260921022651_auth_preference_read.sql`: lectura privada del favorito anónimo y ficha del piloto.
7. `20260921110904_preference_auth_schema_access.sql`: intento de restaurar permiso auth; el permiso no se conservó en remoto.
8. `20260921111056_preference_verified_claims.sql`: identidad desde claims verificados de PostgREST (misma expresión observada en auth.uid), sin acceso adicional al esquema auth. Solución validada por HTTP real.

## Uso y diferencias respecto del diseño original

- Se añade `experiences.visibility` (`hidden`/`listed`) para distinguir borradores internos de fichas de próximos temas. Por defecto todo queda oculto.
- `notes` y `experience_progress` permiten escritura directa con RLS y columnas restringidas, según el diseño. Una actualización debe filtrar por ID y `revision` esperada y pedir filas devueltas; cero filas significa conflicto o ausencia. La base incrementa la revisión automáticamente. No debe mostrarse éxito por recibir únicamente HTTP 200.
- El usuario no puede cambiar propietario, edición, ID, revisión ni fechas técnicas. El texto de la nota es editable; su ubicación original permanece fija.
- La inmutabilidad y la pertenencia del manifiesto se verifican en PostgreSQL. Comprobar el hash contra el archivo real del despliegue queda a cargo de la futura operación de publicación; no se publica contenido real todavía.
- Las respuestas del personal conservan el mensaje al eliminar su cuenta; el `staff_id` queda nulo. Al insertar una respuesta se exige autor de personal. Las futuras RPC comprobarán rol vigente y asignación.
- Analítica está cerrada a clientes y sin endpoint activo. La tabla admite inicialmente `experience_started`, `scene_view`, `experience_completed`; `props` solo acepta `{}`. Ampliar eventos o propiedades requiere un contrato explícito. La existencia de `consent_version` no sustituye la validación de consentimiento en el servidor.
- La vigencia de visitantes se calcula actualmente con `expires_at` y `claimed_user_id`; no existe un campo `state` materializado. Los recibos actuales guardan argumentos normalizados de preferencias y claims en `payload`; no implementan todavía el `payload_hash` y vencimiento propuestos. No extender este patrón a cuerpos privados.

## Validación

- **15 pruebas locales aprobadas** en PostgreSQL embebido (PGlite), con roles y permisos por defecto simulados de Supabase: catálogo, edición, aislamiento, revisiones, transferencia anónima, límites y borrado de cuenta.
- Prueba en PostgreSQL de Supabase (`tests/remote-content-smoke.sql`): lectura propia, aislamiento entre identidades, revisión obsoleta, propiedad de columnas, tablas privadas y catálogo público. Datos temporales revertidos con ROLLBACK.
- Revisión de seguridad e índices mediante Supabase CLI: sin hallazgos.
- Tipos TypeScript, lint y compilación de Next.js: aprobados. Vista local en `http://localhost:3100`, HTTP 200 y nombre Osomi comprobados.

### Autenticación y favoritos — 21 de septiembre

Implementados registro con correo/contraseña, confirmación, login, Google, recuperación y cierre de sesión; cuenta privada y favorito persistente. El servidor verifica al usuario y transfiere el mismo registro anónimo mediante RPC. La cookie visitante es HttpOnly.

Prueba HTTP contra Auth y PostgREST reales: persistencia anónima, transferencia conservando ID, claim repetido sin duplicados, rechazo de revisión obsoleta, recuperación con token real y nueva contraseña, salida y redirección hasta Google. Cuenta temporal eliminada; no se enviaron correos. Script explícito: `OSOMI_REMOTE_TEST=1 node tests/auth-http-smoke.mjs`. No ejecutarlo en producción.

Prueba manual de Google completada por el propietario el 21 de septiembre de 2026: autorización en Google, retorno correcto a `/mi-cuenta`, sesión reconocida y favorito anónimo de **¿Por qué necesito descansar?** conservado como preferencia de la cuenta. La captura de verificación no se incorpora al repositorio porque muestra el correo personal de la cuenta usada.

Tipos, lint, compilación y revisión visual de acceso aprobados. App local en `http://localhost:3100`; usar este origen porque los POST verifican Origin. No desplegada.

## Siguiente bloque

1. Pruebas manuales de acceso aprobadas por el propietario: Google y, posteriormente, registro con otro correo y recuperación de contraseña. Configurar y verificar nuevamente las URLs cuando exista un dominio de producción.
2. Validar concurrencia entre pestañas, incluido primer like simultáneo antes de existir cookie. El control de revisión existente cubre escrituras sobre la misma identidad; la inicialización simultánea aún requiere coordinación.
3. Antes de Vercel: límite de abuso compartido (actualmente memoria del proceso), SMTP y plantillas verificadas, URLs de producción. Las rutas de confirmación con token_hash están listas pero las plantillas no se han modificado.
4. Implementar RPC y endpoints de preguntas, contacto y operación: roles/asignación, consentimiento, capacidad de atención, auditoría, idempotencia y límites de abuso.
5. Implementar retención, limpieza de recibos y eliminación completa de cuenta. El borrado por FK probado no equivale al proceso completo de privacidad.
6. Revisar con el propietario el prototipo local P08 ya implementado; después integrar el contenido versionado con verificación de archivos/hash.

Los contratos del documento de datos son especificación hasta implementarse y probarse. Crear sus tablas no habilita por sí solo los flujos de atención humana o analítica.

## Prototipo P08 — 21 de septiembre de 2026

### Aprobación de interacción — 22 de septiembre de 2026

El propietario aprobó el resultado: «Bellísimo. Estoy satisfecho. Continuemos». Se considera aprobada la interacción del prototipo, con geometría provisional; no constituye aprobación de los assets finales ni validación de rendimiento en dispositivos físicos.

La versión aprobada incorpora fundidos de textos ligados al scroll, eliminación del marcador blanco terrestre, órbita autónoma desde el inicio del alejamiento y siete tarjetas que salen sucesivamente desde detrás del Sol, recorren un arco elíptico y llegan directamente a su posición de calendario. Se sustituyó la banda de tarjetas orbitando. Se corrigió la escala para no alterar la traslación de las tarjetas. Lint, compilación y revisión visual local completados.

Siguiente pieza: conectar el final de P08 con P09, puerta explícita a la perspectiva bíblica. Mantener las siete fichas sin destacar el séptimo día antes de esa elección. El contenido de P10 y las opciones finales P12 conservan el alcance descrito en el storyboard.

Disponible en `http://localhost:3100/prototipo/p08`, enlazado desde el inicio. Implementado con GSAP ScrollTrigger y Three.js, geometría provisional y tarjetas HTML proyectadas sobre el modelo. No requiere autenticación ni modifica datos.

Incluye rotación diaria con scroll, alejamiento de cámara, órbita autónoma, arrastre y botones de perspectiva, pausa, aparición de siete fichas y alineación en calendario. Conserva la pausa al retroceder. Ofrece lectura sin movimiento y explicación con fuentes NASA/UCL fuera del canvas. La semana se presenta como una convención con historia cultural y religiosa, sin atribuirle un origen exclusivamente bíblico. La reflexión bíblica posterior no forma parte de este prototipo.

Validación: lint y compilación de Next.js aprobados; recorrido en navegador local hasta calendario y regreso, control de pausa, arrastre, cambio a lectura (cero canvas) y regreso a animación (un canvas). Calendario revisado visualmente en escritorio y viewport de 390 × 844; siete tarjetas legibles en disposición 4 + 3. Consola sin errores ni advertencias capturados durante la revisión.

Pendiente: validación con el propietario de ritmo y transiciones; gestos y rendimiento en teléfono físico; prueba específica de preferencia del sistema de movimiento reducido, pérdida de WebGL y ocultación de pestaña. Estas rutas están implementadas, pero no se consideran verificadas por las pruebas visuales anteriores. No se ha medido FPS ni publicado en Vercel. Las imágenes finales siguen pendientes de la sesión indicada abajo.


## Sesión pendiente de generación de imágenes

### Continuidad P09 implementada — 22 de septiembre de 2026

Tras aprobación explícita del diseño, el calendario muestra la invitación a explorar la perspectiva bíblica o ir al cierre. Solo al aceptar se destaca la séptima ficha y se habilita una introducción identificada como interpretación adventista. El cierre alternativo no muestra esa introducción. Ambas opciones están disponibles en lectura sin movimiento. P10 completo y P12 siguen pendientes; las pantallas actuales lo indican. Verificación: lint y build aprobados, elección bíblica y cambio al cierre comprobados en navegador local.

### Primer prototipo P10 — 25 de septiembre de 2026

El visitante puede recorrer cuatro tramos editoriales sobre Génesis 2:1–3, Éxodo 20:8–11, Marcos 2:23–28 y la creencia adventista 20 después de elegir explorar en P09. La ficha 7 permanece como marcador, y cada tramo ofrece un panel de contexto con paráfrasis identificada. Existe salida al cierre del prototipo y alternativa de lectura sin movimiento. Lint y compilación aprobados; el flujo de lectura, apertura del panel y cierre con Escape y retorno de foco se comprobaron en navegador local. Pendiente revisión visual y editorial del propietario, pruebas de móvil y evaluación de continuidad visual de la ficha entre P09 y P10. P12 no está implementado.

**Solicitud expresa del propietario:** realizar una sesión de generación de imágenes para las capas de animación de Osomi, usando **GPT Image 2.5**.

Prepararla después de definir los encuadres y dimensiones del storyboard y antes de integrar las capas finales en las animaciones. Generar fondos, personajes y elementos por separado, con transparencia donde corresponda y continuidad de estilo, iluminación y perspectiva entre escenas.

Al comenzar la sesión, verificar que la herramienta permite seleccionar y confirmar **GPT Image 2.5**. Si no está disponible o no puede verificarse el modelo, informar al propietario antes de generar; no sustituirlo silenciosamente. Este registro no inicia la generación ni confirma disponibilidad del modelo.

## Apertura P00–P02 y P08 realista — 25 de septiembre de 2026

**Apertura** en `/prototipo/apertura`, enlazada desde el inicio. Canvas 2D ligado al scroll y paisaje sonoro sintetizado con Web Audio (sin archivos). Persona en plano medio con acercamiento y balanceo según el scroll. Diecisiete demandas aparecen con una notificación sonora espacializada y una cama de tensión creciente. En la estación P02, «¿Qué te cuesta dejar en pausa?», elegir trabajo, teléfono, responsabilidades o preocupaciones destaca esas tarjetas; «Prefiero no responder» es válido y continuar no exige elegir. «Dejarlas en pausa» habilita el tramo siguiente: las demandas se sueltan, se convierten en estrellas y la frase final cambia según la elección. Salida provisional a P08, porque P03–P07 siguen pendientes.

**Decisión del propietario que sustituye «sin sonido»:** el sonido es opcional y se activa con un botón. Se suspende al ocultar la pestaña y se cierra al salir de la escena. Movimiento reducido elimina el balanceo, la vibración y el centelleo.

**P08 realista:** Tierra con texturas NASA Visible Earth de dominio público (Blue Marble, Black Marble y nubes) en `public/textures`, 2,9 MB. Shader con día/noche, luces de ciudades, brillo del océano, nubes, atmósfera e inclinación axial de 23,44°. Sol procedural con granulación fina y oscurecimiento del limbo, sin halo ni resplandor. Campo de ~90 000 estrellas con banda galáctica. Fondo espacial también en P09/P10. Las fichas siguen saliendo de detrás del Sol mediante una copia circular del disco renderizado.

Validación: typecheck, lint y build aprobados; recorrido revisado en el navegador local. Pendiente: audio en dispositivos reales, rendimiento en móvil (texturas de 4096 px, 92 000 puntos) y medición de FPS.

### P09 → P10 revisado — 25 de septiembre de 2026

Al elegir la perspectiva bíblica, los días 1–6 se llenan con marcas de tareas y el día 7 queda libre. Una frase identificada como paráfrasis de Éxodo 20:9–10 se personaliza con la elección de P02, guardada solo en `sessionStorage` durante la pestaña. Se forma la pila con el día 7 encima. A los 2,3 s la página centra el primer tema; si el visitante desplaza o pulsa una tecla antes, se cancela. **La misma ficha 7** baja desde la pila hasta situarse junto a la primera explicación y gana «DESCANSO». Los cuatro temas alternan texto derecha/izquierda y la ficha cruza al lado contrario con un arco. El aviso inferior «Sigue hacia abajo ↓» se oculta en el último tema. En lectura sin movimiento, la ficha es estática. Verificado en escritorio y en 375 × 812.

## Recorrido continuo P00–P10 — 25 de septiembre de 2026

Nueva ruta `/prototipo/descanso`, enlazada desde el inicio con «Comenzar la experiencia». `/prototipo/apertura` redirige a ella; `/prototipo/p08` se conserva como estudio de escena. Cada estación termina un tramo: P05 no existe en la página hasta dejar las demandas en pausa, ni P08 hasta continuar en P07. Así un gesto rápido no atraviesa una actividad pendiente. Las elecciones de P02 y P07 viven en memoria durante la visita; ya no se usa `sessionStorage`. El sonido opcional es único para todo el recorrido: calma en la noche y silencio al formarse la Tierra.

**P03–P04 · Laboratorio**, dentro de la estación P02: memorizar cuatro símbolos y reconstruir el orden tocando o con teclado. Una práctica sin resultado y dos rondas de dos secuencias; el orden tranquila/distracciones se sortea en cada visita. En la ronda tranquila las demandas de la escena se atenúan. En la ronda con distracciones, esas mismas demandas interrumpen: la tarjeta se agita, suena y aparece un aviso ficticio anunciado, sin destellos. Los avisos se pausan si la pestaña o el panel no están visibles. Sin cronómetro ni rapidez: cuenta símbolos fuera de lugar y usos de «Deshacer». Hay textos para mejor, peor, parecido e incompleto, una pregunta de percepción y los límites de la demostración. Alternativa «Ver un ejemplo paso a paso» y salida «Continuar sin la actividad».

**P05 · Mientras duermes** [S1]: persona dormida en la noche continua y tres puntos (Cuerpo, Aprendizaje, Memoria) con panel de evidencia NHLBI. **P06 · Ritmo diario** [S2]: amanecer, reloj de 24 h con anillo luz/oscuridad y control deslizante accesible. El cielo sigue al scroll hasta que el visitante mueve el control. Incluye aviso de esquema general. **P07**: «¿Qué significaría reservar tiempo para dejar de producir?» con cinco opciones y una frase de eco. El contorno del reloj gana volumen y se convierte en la Tierra (textura NASA), que conecta con P08 mostrando el mismo hemisferio.

Validación: typecheck, lint y build aprobados. Recorrido revisado en navegador local, en escritorio y 375 × 812: bloqueos por estación, laboratorio completo por script (resultado coherente y avisos solo en la ronda con distracciones), panel de evidencia, control día/noche y transición a P08. Pendiente: revisión editorial de los textos de sueño y ritmo, prueba con personas del laboratorio, movimiento reducido en dispositivo, audio en teléfono real. P11 (miniquiz) y P12 (cierre) siguen sin implementar.

### Escenas encadenadas y ajustes del propietario — 25 de septiembre de 2026

**Encadenamiento sin cortes.** Cada escena se superpone al último fotograma de la anterior. El primer fotograma de P05 es idéntico al último de la apertura (mismo cielo, estrellas y estrellas-demanda); la persona sale caminando hacia la izquierda y luego entra la cama por la derecha. P08 comparte con P07 la posición y el tamaño exactos donde aparecerá la Tierra 3D (`descanso/handoff.ts`). El globo plano crece hasta ahí y P08 se funde encima durante una pantalla de scroll, quieta hasta completar el fundido; después empieza a girar. En el recorrido integrado, P08 no muestra la barra superior y «Leer sin movimiento» pasa a los controles.

**Laboratorio.** Las interrupciones se detienen por completo al terminar, salir o cambiar de ronda. El reinicio que observó el propietario coincidió con recargas en caliente del servidor de desarrollo mientras se editaba el código. Las distracciones son más intensas: avisos grandes con sacudida en cuatro posiciones, un nuevo sonido de notificación de dos tonos en cada aparición y una frecuencia de 1,1–2,1 s. Antes de la ronda se invita a activar el sonido. Para aumentar la carga de memoria, cada secuencia tiene cinco símbolos entre ocho opciones, igual en ambas rondas; es un cambio respecto de los «cuatro símbolos» del documento de diseño.

**P05–P06.** Nueva cama: cabecera, colchón, almohada y manta con pliegues. El paisaje de P06 tiene capas con perspectiva atmosférica, nubes, resplandor de amanecer y atardecer, árboles y una casa cuyas ventanas se encienden de noche. El reloj es una esfera de cristal con arco de luz en degradado cónico, manecilla, hora y franja al centro, y sol o luna con halo. El control de la hora y el scroll quedan ligados en ambos sentidos (00:00–24:00 en 2,8 pantallas).

Validación: typecheck, lint y build aprobados. En el navegador local se comprobaron el relevo apertura→P05 (fotogramas idénticos), la salida de la persona y la entrada de la cama, el slider↔scroll (18:00 lleva a la posición exacta; retroceder mueve el control), el fundido P07→P08 alineado y la detención de las distracciones al salir. En escritorio y en 375 × 812.

## P11 y P12 · cierre del piloto — 27 de septiembre de 2026

El recorrido llega completo de P00 a P12 en `/prototipo/descanso`. «Ir al cierre», desde P09 o desde el final de P10, lleva a P11. Si se eligió la perspectiva bíblica, se conserva aunque después se vaya al cierre, y el provisional «Ir al cierre del prototipo» desaparece.

**P11 · Comprender.** Cuatro preguntas base en fichas con el estilo del calendario: actividad, ritmo circadiano [S2], qué mostró la escena de la semana [H1] y evidencia frente a reflexión. Una quinta sobre el sábado adventista [B1] aparece solo si se exploró P10. La retroalimentación es inmediata y cita la fuente. Se puede cambiar la respuesta, saltar o volver a cualquier ficha. El primer intento se conserva en memoria; no hay nota ni bloqueo. El resumen «Te llevas estas ideas» describe el contenido, no la fe ni la capacidad. Incluye la reflexión «¿Qué quisieras explorar ahora?», que ordena las sugerencias de P12.

**Transición.** La noche de P10 amanece: un sol sube con el scroll y el fondo llega al tono cálido de la apertura, cerrando el círculo.

**P12 · Elegir.** La silueta del inicio, ahora sin demandas, y una frase personal con las elecciones de P02 y P07 (idea 4), por ejemplo: «Al comenzar, te costaba dejar en pausa el trabajo. Después pensaste en reservar tiempo para contemplar sin prisa…».
- *Seguir explorando:* como máximo tres próximos temas marcados «Próximamente», sin botones de inicio falsos, y enlace a crear una cuenta gratuita.
- *Explorarlo por mi cuenta:* libro en vista plana con resumen, lo que descubriste, pasajes, fuentes, preguntas y nota temporal en memoria, con aviso previo. La versión 3D queda pendiente.
- *Explorarlo con alguien* y *¿Tienes una pregunta?* muestran honestamente que el equipo y el buzón están en preparación y no piden datos (RF-08/09).

Corrección: el texto del favorito en escritorio había crecido al separarlo en un `span`.

Validación: typecheck, lint y build aprobados. Recorrido completo automatizado con Chrome sin interfaz (DevTools Protocol) a 1280 × 800 y 390 × 844, porque el panel del navegador estaba oculto: estaciones, «Ir al cierre» (P11 arriba, 4 preguntas sin bíblica, 5 con bíblica), retroalimentación, resumen, orden de sugerencias según la reflexión, frase personal de P12 y libro.

## Libro del tema en 3D con canvas — 27 de septiembre de 2026

Por decisión del propietario, el libro de «Explorarlo por mi cuenta» (RF-07) usa canvas 2D con proyección 3D propia, sin Three.js. Código en `src/components/libro/`:

- `book.tsx`: estados cerrado → abriéndose → abierto → pasando página, e interacción.
- `curl.ts`: geometría del pliegue.
- `paper.ts`: texturas.
- `art.ts`: acuarelas.
- `raster.ts`: texto HTML → canvas.

**Cómo funciona.**
- *Portada:* tela azul noche con título en oro y siete fichas (la 7.ª dorada). Aparece inclinada en perspectiva; al abrir, la tapa gira sobre su bisagra con proyección 3D por franjas y el libro se endereza hasta la vista frontal. Guardas azules con estrellas y cinta marcapáginas dorada.
- *Páginas:* se pasan arrastrando la esquina (superior o inferior), tocándola, con botones, flechas o desde el índice. El pliegue es la mediatriz entre la esquina y el puntero; la parte doblada se refleja y muestra el reverso real (la página siguiente izquierda), con sombra proyectada, curvatura y brillo. Arrastrar hacia atrás reproduce el mismo giro al revés.
- *Móvil:* una página a la vez.
- *Contenido y accesibilidad:* 11 páginas de 420 × 600 escaladas: título, índice, resumen, lo que descubriste, pasajes (2), fuentes (2), para reflexionar, notas y colofón. Quietas, las páginas son HTML real (selección, enlaces, lectores de pantalla y la nota como `textarea`), como pide el storyboard. Solo mientras la hoja gira, su texto se pinta en el canvas palabra por palabra en la posición medida del HTML. Seis acuarelas procedurales se pintan solas la primera vez que se abre su página. Sonido opcional de papel y de la tapa.
- *Alternativa:* «Vista plana» abre el libro plano anterior con el mismo contenido y la misma nota. Movimiento reducido: sin animaciones de apertura ni giro.

Validación: typecheck, lint y build aprobados. Con Chrome sin interfaz a 1280 × 800 y 390 × 844 se comprobaron la portada cerrada, la apertura a medias, la doble página, el arrastre de esquina hacia adelante y hacia atrás, el giro con teclado, el salto desde el índice y la nota escrita dibujada en su página. Pendiente: probar el gesto en un teléfono real y medir el rendimiento del giro en móvil.

## Revisión del propietario — 28 de septiembre de 2026

**Decisiones editoriales del propietario:**
- La perspectiva bíblica ya no se elige ni se puede saltar: sigue al calendario con el scroll. El último tramo de P08 llena los seis días y forma la pila con el día 7, que baja a la lectura.
- Se retiran las menciones a la Iglesia Adventista en P10, P11, el libro y las fuentes. Esto modifica el criterio del PRD de que la identidad adventista sea consultable y explícita (RF-01 y RF-04). Se recomienda conservarla en una página «Acerca de Osomi».
- La 4.ª perspectiva explica «sábado» (shabbat/sabbath) como séptimo día de descanso, adoración y servicio, con Isaías 66:22–23.
- Las referencias muestran primero los versículos y después un comentario, en Reina-Valera 1909 (dominio público, ortografía actualizada, texto verificado en BibleGateway RVA). Se quitaron la nota de resumen editorial y el enlace doctrinal.

**P11.**
- Preguntas y respuestas en primera persona. La primera («En la actividad con las formas geométricas, ¿qué notaste?») admite dos percepciones válidas.
- Nueva tercera opción de la pregunta de la semana; la última pregunta trata del séptimo día y cita los versículos solo por nombre.
- Resumen: «El sábado: descanso, adoración y servicio».

**P08.** Se quitaron «Leer sin movimiento» en el recorrido y la sección de fuentes al final de la página. «Explicación y fuentes» abre un modal grande que se cierra para volver a la escena.

**P12.**
- El libro es el protagonista: su portada real (el mismo código del libro 3D), inclinada y flotando, con cinta y hojas, una lista de lo que contiene y «Abrir el libro».
- Nuevo texto para «Explorarlo con alguien».

**Libro.** 13 páginas, una por pasaje con sus versículos completos. Acuarela del amanecer corregida: cielo ovalado y sol detrás de colinas opacas.

**Apertura y P05.**
- Velo oscuro detrás del panel del laboratorio.
- Pasos sintetizados, alternando izquierda y derecha, sincronizados con el balanceo al caminar (apertura y salida en P05).
- Nueva ilustración de la persona dormida: mesita con lámpara y reloj a las 00:00, cabecera acolchada, almohada, rostro con ojos cerrados, cabello, mejillas, mano y manta con pliegues.

Validación: typecheck, lint y build aprobados. Recorrido revisado con Chrome sin interfaz a 1280 × 800: laboratorio con velo, cama, P09 sin botones (llenado y pila ligados al scroll), referencia de Isaías con versículos, P11 (primera y última pregunta), tarjeta del libro y páginas de pasajes.

### Ajustes — 28 de septiembre de 2026 (tarde)

- **Pasos:** sí se generaban (8 pasos en 3 pantallas, verificado), pero en tonos graves (55–95 Hz) que los parlantes de una laptop no reproducen. Rediseñados con golpe de talón (~180 Hz), roce de suela (~2,5 kHz) y golpe grave, más fuertes.
- **P05:** la cama usa la ilustración del propietario (`public/assets/persona-durmiendo.webp`, fondo transparente) con un tinte de luz de luna aplicado solo sobre sus píxeles. Los puntos se reubican en escritorio y móvil.
- **Laboratorio:** en la segunda secuencia de la ronda con distracciones, cada aviso sacude el panel (y vibra el teléfono, si lo permite) y llegan más seguido (0,75–1,4 s).
- **Modales:** con cualquier `<dialog>` abierto se bloquea el scroll de la página. Verificado con la rueda del ratón: 605 px sin modal, 0 con modal.
- **Libro que mira al cursor:** en P12, la portada gira hasta 16° hacia el cursor; en el libro a pantalla completa, hasta 7° (se endereza mientras gira una hoja). Solo con ratón y sin movimiento reducido.
- **Acuarela de la luna:** ahora es una media luna real, calculada por la intersección de dos círculos.

### Laboratorio más corto y libro que se cierra — 28 de septiembre de 2026

- **Laboratorio:** sin práctica y sin segunda ronda tranquila. Quedan tres rondas de una secuencia cada una, en dificultad creciente: tranquila → con avisos → con avisos y sacudidas del panel. El resultado compara las tres. Ya no se sortea el orden: el efecto de orden queda mencionado entre las limitaciones.
- **Corrección del libro:** al pasar hojas, el texto se amontonaba en una esquina. Las páginas HTML estaban dentro de la capa inclinada con perspectiva; las que esperan fuera de pantalla (−100 000 px) se deformaban al proyectarse y el texto se «fotografiaba» en esas posiciones. Ahora solo el canvas se inclina, y solo con el libro cerrado.
- **Cerrar el libro:** en la primera doble página, «← Cerrar el libro» (y la flecha ←); en la última, «Cerrar el libro →», que devuelve las hojas al inicio y baja la tapa en 3D (la apertura al revés). Después se puede volver a abrir.

### Laboratorio sin nombres y P08 con rotación y Luna — 28 de septiembre de 2026

- **Laboratorio:** la secuencia a memorizar y los puestos muestran solo las figuras. Los nombres aparecen únicamente en los botones para elegir, y siguen disponibles para lectores de pantalla mediante `aria-label`. El orden original del resultado también se muestra con figuras.
- **P08, rotación:** durante la órbita, la Tierra gira sobre su eje (simplificado: unas once vueltas por órbita), para no sugerir que la vuelta al Sol produce el día y la noche.
- **P08, Luna:** una Luna con mares y cráteres procedurales, iluminada por el Sol, gira alrededor de la Tierra. Se oculta en el primer plano del día.
- **P08, arrastre:** el vertical permite mirar desde arriba y también desde debajo del plano de la órbita (inclinación de −66° a +76°). El aviso se actualizó.
