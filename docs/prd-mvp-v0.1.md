# Osomi · PRD del MVP
## Plataforma de experiencias de descubrimiento · «¿Por qué necesito descansar?»

**Versión:** 0.4 · 18 de septiembre de 2026  
**Estado:** implementación parcial en desarrollo; consultar [estado vigente](estado-desarrollo.md).
**Nombre confirmado:** Osomi · Mira más de cerca.  
**Base técnica acordada para avanzar:** Next.js + TypeScript, GSAP y Three.js selectivo; alojamiento en Vercel, base de datos en Supabase y autenticación con Supabase Auth.

Este PRD convierte el diseño en comportamientos verificables. No sustituye el guion, no es todavía la arquitectura detallada ni un plan de programación. Las propuestas operativas nuevas están identificadas para no confundirlas con decisiones expresas del propietario.

**Documentos de referencia:** [Product & Experience Design Document v0.3](product-experience-design-document-v0.3.md) y [Storyboard, contenido v0.3](storyboard-piloto-descanso-v0.1.md). El nombre del archivo del storyboard conserva v0.1 para mantener los enlaces previos. Para P08 prevalece la última revisión del storyboard: cámara libre, órbita autónoma y siete fichas giratorias que se alinean.

## 1. Problema y resultado buscado

Adultos con trabajo y responsabilidades pueden interesarse por preguntas cotidianas sin estar buscando una iglesia o un estudio bíblico. Necesitamos ofrecerles una experiencia comprensible y participativa que les permita contrastar información, conocer una perspectiva bíblica adventista y elegir cómo continuar.

El MVP debe demostrar que el formato ayuda a comprender, despierta interés explícito y permite avanzar hacia lectura personal o conversación humana sin presión. No pretende medir fe ni demostrar una doctrina mediante un juego o una animación astronómica.

**Recorrido principal:** entrada sin cuenta → experiencia interactiva → reflexión y perspectiva bíblica voluntaria → cierre → lectura personal, otro tema o contacto humano. Like y preguntas disponibles durante el recorrido.

## 2. Alcance y entregas

### MVP-A · Piloto publicable

Incluye una experiencia completa en español, P00–P12; laboratorio de atención sin cronómetro; fuentes; sección bíblica; miniquiz; P08 con Three.js; libro de lectura y notas; registro e inicio de sesión; like anónimo transferible; progreso registrado; buzón anónimo; solicitud de contacto; operación interna mínima; medición y vistas accesibles.

Next.js será la base tanto del prototipo de P08 como del producto. El prototipo se mantendrá aislado del recorrido público y usará geometría simple para validar la interacción antes de producir texturas finales. No se considerará MVP terminado por tener esa escena funcionando.

### MVP-B · Validación de continuidad

Añade un segundo nodo editorialmente completo y una conexión publicada desde descanso. Propuesta de tema: «¿Qué significa realmente descansar?», que deberá aportar contenido distinto y fuentes propias. El título no queda aprobado por este PRD.

En MVP-A se puede ofrecer cuenta para guardar favoritos, notas y progreso. Si no hay otro nodo disponible, «Seguir explorando» muestra honestamente que hay próximos temas, sin forzar registro para abrir contenido inexistente. Solo MVP-B permite evaluar inicio de una segunda experiencia y recorrido entre nodos en producción. La barrera de registro se prueba antes con contenido de prueba privado.

### Fuera de este MVP

Estanterías temáticas y mapa libre; versión infantil; audio; pagos; comunidad pública; chat de IA; recomendaciones mediante perfiles psicológicos; campañas automáticas de mensajes; editor visual de escenas; localización automática de iglesias; biblioteca doctrinal completa. El grafo existe como estructura de contenidos aunque no tenga un mapa visual.

## 3. Usuarios y permisos

| Rol | Puede hacer | No recibe acceso por ese rol |
|---|---|---|
| Visitante anónimo | Completar el piloto, marcar like, leer, redactar nota temporal, preguntar y solicitar contacto. | Progreso persistente de cuenta o identidad de otros visitantes. |
| Usuario registrado | Lo anterior, iniciar otros nodos, recuperar progreso y guardar notas/favoritos. | Preguntas anónimas ajenas o herramientas internas. |
| Respondedor | Leer y contestar preguntas asignadas en una cola privada. | Historial de navegación, notas personales o datos de contacto no necesarios. |
| Coordinador de contacto | Asignar solicitudes y actualizar sus estados. | Notas privadas y vínculo de preguntas anónimas con cuentas. |
| Editor/administrador | Publicar versiones revisadas, gestionar disponibilidad y permisos autorizados. | Uso de textos privados como analítica o autorización para contactar sin solicitud. |

Una misma persona puede cubrir varios roles operativos, pero los permisos deben ser explícitos. El lanzamiento requiere responsables reales designados; la interfaz no anunciará un equipo o un tiempo de respuesta inexistentes.

## 4. Requisitos funcionales y aceptación

Todos los requisitos RF son obligatorios para MVP-A salvo donde se indique MVP-B. Cada criterio deberá enlazarse con evidencia de prueba al implementar.

### RF-01 · Entrada y navegación

- Mostrar gratuidad, primera experiencia sin cuenta y registro necesario para iniciar otros temas. La identidad cristiana adventista es consultable desde el inicio y explícita al presentar esa perspectiva.
- Abrir el piloto desde enlace directo, sin registro previo, audio ni temporizador general.
- La narrativa se controla con scroll. No ofrecer «Mostrar escena completa». Movimiento reducido conserva contenido e interacciones.
- Los puntos que requieren acción terminan un tramo. El siguiente se habilita mediante acción explícita, sin secuestrar rueda, teclado o foco. Una elección de no participar no se activa por scroll.
- Retroceder no borra respuestas ni repite envíos. La apertura utiliza personaje frontal en plano medio con acercamiento y balanceo suave; no requiere ciclo completo de marcha.

**Aceptación:** una visita anónima puede llegar al cierre con teclado y con tacto; un gesto largo no salta una estación pendiente; volver sobre una actividad resuelta conserva su estado; fuentes y like no quedan tapados por la escena. No se presenta ninguna nota del quiz como requisito de acceso.

### RF-02 · P08: astronomía, exploración y calendario

Estados: **revelación por scroll → exploración libre → aparición de fichas → alineación → calendario**.

1. El scroll aleja la cámara y revela Sol, Tierra y órbita.
2. En exploración, la Tierra orbita sin scroll. Arrastrar mueve la cámara alrededor del Sol, no la Tierra. Aviso inferior explica arrastre y continuación. Hay pausa/reanudación y restablecer vista; no se exige completar una vuelta.
3. Rueda y trackpad continúan la narrativa. Propuesta móvil: gesto horizontal para perspectiva, vertical para continuar; controles alternativos de cámara accesibles por teclado.
4. Al seguir bajando aparecen siete fichas identificadas como calendario, girando alrededor del Sol en una banda visual separada de la trayectoria terrestre. No se presentan como cuerpos físicos ni como medida de siete días orbitales.
5. Al avanzar, el control de cámara pasa suavemente del arrastre al scroll y las fichas se alinean. Un único controlador puede modificar la cámara en cada estado.
6. El movimiento autónomo se pausa al ocultar pestaña, abrir fuentes, salir del plano o pulsar pausa. No recupera el tiempo transcurrido con saltos. Movimiento reducido usa vistas y pasos sin autoplay.

**Aceptación:** detener scroll detiene la progresión narrativa, aunque la órbita siga durante la excepción explícita; volver permite explorar otra vez sin salto brusco; el trazo no crece indefinidamente; el like sigue disponible; al fallar WebGL se conservan las explicaciones de día, año y semana en una secuencia plana. Las pruebas deben cubrir al menos cuatro orientaciones de cámara antes de retomar scroll.

### RF-03 · Laboratorio y miniquiz

- Dos rondas de dificultad equivalente, práctica previa y comparación descriptiva de errores/correcciones. No medir rapidez en este experimento.
- Ordenar símbolos con pulsación o teclado, no solo arrastre. Distracciones anunciadas, sin flashes.
- Cambiar pestaña conserva la ronda y pausa estímulos; volver no obliga a reiniciar.
- Ofrecer ejemplo guiado específico y continuación sin realizar la actividad. Distinguir realizado, ejemplo visto, omitido e incompleto; no fabricar resultados personales.
- Miniquiz con feedback y referencias; pregunta bíblica solo para quien haya explorado esa sección. La reflexión personal no tiene respuesta correcta.

**Aceptación:** todos los resultados posibles —incluido mejor desempeño con distractores— tienen texto coherente; una actividad omitida no aparece completada; no se infiere diagnóstico; corregir respuesta no elimina el primer intento de las métricas agregadas consentidas.

### RF-04 · Contenido, fuentes y perspectiva bíblica

- Cada afirmación sustantiva enlaza a una ficha de evidencia o referencia bíblica. Mostrar tipo, alcance, limitaciones, fecha de revisión y fuente.
- Diferenciar evidencia, reflexión y perspectiva bíblica mediante texto, no solo color.
- La escena semanal no afirma origen exclusivamente bíblico ni que la astronomía demuestre el sábado. Las fuentes y precisiones del storyboard forman parte de la revisión editorial.
- Elegir explorar o saltar la sección bíblica no bloquea el cierre, preguntas, lectura o contacto.
- Contenido versionado con estados borrador, en revisión y publicado. Solo destinos publicados se pueden iniciar. El MVP admite archivos estructurados mantenidos por el desarrollador; no necesita un CMS visual.

**Aceptación:** toda afirmación del guion publicado tiene referencia revisada; las citas bíblicas coinciden con una traducción definida y autorizada; un borrador no aparece en la navegación pública; una actualización no mezcla pasos de versiones distintas durante una visita activa.

### RF-05 · «Me encanta este tema»

- Control persistente desde P00, visible en lectura y paneles sin tapar contenido. Es reversible y marca el tema completo.
- El primer like se guarda en base de datos con una identidad anónima opaca y referencia en cookie propia. El contenido del like no vive únicamente en memoria ni en almacenamiento local.
- Al crear cuenta desde esa sesión se reasigna **el mismo registro** al usuario, se muestra en preferencias y deja de contarse como anónimo. No aumenta el total por cambiar de propietario.
- Transferencia verificada en servidor, atómica e idempotente. Si hay una preferencia previa de cuenta, consolidar sin duplicación y conservar trazabilidad de la fusión. Propuesta: gana la última elección explícita según orden del servidor; desmarcar también es una elección.
- Distinguir guardando, guardado y error. Los reintentos y clics rápidos no pueden hacer prevalecer accidentalmente una intención anterior.

**Aceptación:** anónimo marca, recarga y conserva estado; al registrarse, el ID del like sin conflicto se mantiene; reintentar no duplica; desmarcar antes de registrarse no reactiva el favorito; una sesión no puede reclamar registros de otra. La eliminación de cookies puede perder el vínculo previo, y no se intenta reconstruirlo mediante fingerprinting.

### RF-06 · Cuenta y continuidad

**Decisión vigente del propietario:** Supabase Auth con correo y contraseña, confirmación del correo y recuperación mediante enlace; también Google sin contraseña propia de Osomi. Esto reemplaza la propuesta anterior de OTP. Google autentica la cuenta sin dar acceso a Gmail. Perder el acceso al correo o al proveedor no tiene recuperación automática garantizada por Osomi.

La interfaz ofrece «Continuar con Google» y «Continuar con correo». Para correo, introducir dirección → solicitar código → introducir código → sesión verificada. Caducidad, código inválido, reenvío y límites de intentos deben tener estados claros. Para Google, contemplar cancelación, error y retorno al destino permitido. No solicitar permisos de Gmail, contactos o Drive: solo los necesarios para autenticar.

La vinculación de identidades la gestiona Supabase Auth bajo sus comprobaciones; nunca fusionar cuentas manualmente por comparar un email suministrado por el navegador. La transferencia del like sucede después de verificar la sesión, también tras retorno OAuth, utilizando la identidad anónima validada. Si la confirmación ocurre en otro dispositivo, el acceso a cuenta puede funcionar, pero no se promete recuperar el like del dispositivo original sin su vínculo. Configurar y probar envío transaccional de correo propio antes de producción; escoger proveedor SMTP sigue pendiente.

- Registro e inicio de sesión conservan el destino solicitado y las preferencias de la sesión. La transferencia de likes es una operación recuperable si falla tras crear la cuenta; no debe mostrarse completada antes de confirmarla.
- Guardar progreso de usuarios registrados en servidor al alcanzar hitos. Al volver, ofrecer retomar o empezar de nuevo, sin borrar favoritos ni notas al reiniciar el recorrido.
- Sin cuenta, escena y ronda viven temporalmente en memoria; la identidad del like no implica guardar progreso anónimo. Una recarga puede reiniciar la experiencia, pero no elimina el like persistido.
- Iniciar otro nodo publicado requiere autenticación en interfaz y servidor. Una cuenta no implica consentimiento de contacto ni analítica opcional.
- No pedir ubicación, teléfono ni datos clínicos en registro. Incluir cierre de sesión y vía de eliminación de cuenta.

**Aceptación:** el registro vuelve al destino correcto sin perder el like; un acceso directo a un segundo nodo protegido exige cuenta; no se promete reconocer una persona anónima en otros navegadores; una credencial inválida no revela cuentas existentes; la recuperación elegida funciona en una prueba completa antes de abrir registros reales.

### RF-07 · Libro y notas

- «Explorarlo por mi cuenta» abre el libro del tema sin cuenta: índice, resumen, fuentes, pasajes revisados y preguntas.
- Cubierta y páginas pueden usar Three.js; lectura, enlaces, selección de texto y campos de notas son accesibles. En móvil, una página a la vez. Alternativa plana con las mismas funciones.
- Notas de texto simple vinculadas al tema y, opcionalmente, a una sección; sin editor enriquecido ni colaboración en el MVP.
- Sin cuenta, permitir borrador temporal avisándolo antes de escribir. Para conservar entre visitas, registro y guardado en servidor. Mantener el borrador durante el flujo de autenticación; no usar redirect que lo pierda sin solución explícita.
- Usuario puede crear, editar y eliminar sus notas. Estado de guardado confirmado por servidor. Notas privadas, fuera de analítica y del acceso de instructores.

**Aceptación:** cerrar y reabrir libro durante la visita conserva el borrador; una nota guardada reaparece al iniciar sesión; otro usuario no puede leerla ni editarla; fallo de guardado conserva el texto en la vista; la vista plana permite la misma lectura y edición. No se promete recuperar un borrador anónimo tras cerrar o recargar la pestaña.

### RF-08 · Preguntas anónimas

- Enviar texto sin nombre, correo o cuenta; no enlazar la pregunta al usuario ni a la identidad del like.
- Crear buzón privado con código secreto y enlace de consulta. El secreto no se incorpora a analítica, registros de aplicación o enlaces externos; la arquitectura debe evitar fugas por URL y referencia de navegación.
- Estados: recibida, en revisión, respondida y cerrada. Respuesta humana consultable en la plataforma; permitir una aclaración en el mismo hilo.
- Informar que se debe conservar el código. Sin él no hay recuperación por identidad. No publicar preguntas automáticamente.
- Propuesta de límite inicial: 2.000 caracteres por mensaje, sin archivos adjuntos. Protección de abuso y moderación, con error comprensible que no pierda el texto.

**Aceptación:** enviar y consultar funciona sin cuenta; un código incorrecto no revela contenido; ni el usuario registrado ni el respondedor ven un vínculo con navegación; reintentar el mismo envío no duplica la pregunta; recibir no se confunde con responder.

### RF-09 · Contacto humano

- «Explorarlo con alguien» explica quién atenderá, su perspectiva adventista, gratuidad y ausencia de compromiso.
- Propuesta inicial de canales: email o WhatsApp; videollamada se coordina posteriormente. Solo mostrar canales que el equipo pueda atender.
- Pedir canal elegido, dato correspondiente y autorización explícita para ese contacto. Nombre opcional; horario/zona horaria opcionales. No pedir país/ciudad de entrada.
- Estados operativos: recibida, asignada, contacto intentado, conversación realizada, cerrada y cancelada. El clic solo abre el formulario; la recepción existe tras guardado confirmado.
- Entregar una referencia privada para consultar/cancelar la solicitud incluso sin cuenta. No fusionarla con un buzón anónimo.
- Si no existe capacidad de atención, mostrar indisponibilidad antes de pedir datos. Nada de chat en vivo ficticio o plazo prometido sin cobertura.

**Aceptación:** no se envía solicitud sin autorización; reintentos no duplican; cancelar retira de la cola de futuros contactos; una conversación solo se registra realizada tras confirmación humana; datos no aparecen en analítica. Las pruebas usan destinatarios ficticios hasta disponer de un equipo autorizado.

### RF-10 · Operación interna mínima

- Bandeja privada de preguntas con respuesta y estado; bandeja separada de contacto con responsable y seguimiento.
- Acceso por rol, registro de cambios de estado y fecha; sin exposición de textos privados en paneles agregados.
- Control para habilitar/deshabilitar recepción según capacidad, manteniendo accesibles respuestas ya emitidas.
- Reporte agregado del recorrido y calidad de la experiencia; sin exportación masiva de datos personales en el MVP.

**Aceptación:** un respondedor no puede abrir solicitudes de contacto sin permiso; un usuario público no accede al panel; al desactivar contacto se muestra el estado público correcto; las preguntas existentes conservan su vía de consulta.

### RF-11 · Grafo y segundo tema

- Cada nodo tiene ID estable, versión, pregunta, resumen, fuentes y disponibilidad. Cada conexión define destino y motivo editorial.
- Mostrar como máximo tres recomendaciones disponibles; marcar próximos contenidos sin fingir botones de inicio funcionales.
- En MVP-B, publicar segundo nodo y conservar origen/destino del recorrido cuando se autorice esa medición.

**Aceptación:** no hay enlaces a borradores; un destino publicado puede iniciarse tras autenticación; las conexiones no duplican identidad ni favoritos del tema; con un único nodo el informe de continuidad se muestra «no evaluable».

## 5. Datos y límites de asociación

Modelo conceptual; el esquema físico se decidirá en arquitectura sobre Supabase. La autenticación utilizará Supabase Auth.

| Entidad | Información mínima y regla |
|---|---|
| Cuenta | Identificador de Supabase Auth, email, nombre visible opcional, estado e identidades de acceso. Credenciales gestionadas de forma segura, no guardadas como texto. |
| Identidad anónima | Referencia opaca validada por servidor y vencimiento; no fingerprint. |
| Preferencia de tema | ID, tema, propietario anónimo o usuario, estado activo/inactivo, orden/fecha del servidor y versión de escritura. Un propietario efectivo a la vez. |
| Progreso | Usuario, experiencia/versión, último hito y estado de finalización; sin coordenada de cámara obligatoria entre dispositivos. |
| Nota | Usuario, tema/sección, texto y fechas. El borrador sin cuenta no es persistencia garantizada. |
| Experiencia y fuentes | Contenido versionado, escenas, conexiones, revisiones y estado de publicación. |
| Buzón anónimo | Identificador, verificador de secreto, mensajes y estado. Sin claves de cuenta o de identidad anónima del like. |
| Solicitud humana | Canal, dato necesario, constancia de autorización, estado y responsable; secreto de consulta cuando no haya cuenta. |
| Evento de medición | Evento, versión, escena cuando aplica, momento e identidad de medición consentida. Sin textos libres o credenciales. |

La transferencia de likes no autoriza reconstruir retrospectivamente todo el recorrido. La eliminación de cuenta debe retirar acceso y borrar o anonimizar sus datos según política definida. Las preguntas anónimas no pueden localizarse por cuenta: su consulta y eliminación requieren su propio código.

**Propuesta de retención para revisión antes de datos reales:** identidad/likes anónimos sin actividad, 90 días; eventos individuales, 90 días y luego agregación; preguntas cerradas, 180 días; solicitudes cerradas, 90 días; notas y preferencias de cuenta hasta eliminación solicitada. Eliminación operativa en un máximo de 30 días, con vencimiento de copias de seguridad definido por el proveedor. Estos plazos son una propuesta de producto, no una conclusión legal. Se pueden usar datos ficticios mientras se revisan, pero no abrir recogida real sin avisos y política aprobados.

## 6. Medición y criterios de éxito

**Eventos funcionales** como like guardado, cuenta creada o solicitud recibida se confirman en servidor. **Analítica opcional de navegación** se activa según elección del visitante; rechazarla no impide usar el producto.

| Indicador | Definición | Interpretación |
|---|---|---|
| Cierre | Sesiones medidas que alcanzan P12 / sesiones medidas que comienzan. | Separar sección bíblica vista/omitida. |
| Comprensión | Respuestas iniciales por pregunta / respuestas válidas medidas. | Revisión posterior separada; no aceptación religiosa. |
| Likes | Preferencias activas por tema, separando cuentas e identidades anónimas. | Identidad anónima no equivale a persona única. Transferir no suma otro like. |
| Tasa de like | Identidades medidas expuestas al control que lo marcan / identidades medidas expuestas. | No mezclar todos los likes funcionales con un denominador de solo visitantes que aceptan analítica. |
| Continuidad | Usuarios que inician un destino publicado / usuarios medidos expuestos a ese destino. | Solo evaluable con MVP-B. |
| Registro | Cuentas creadas desde invitación medida / invitaciones medidas. | Desglosar motivo: otro tema, guardar nota o preferencias. |
| Retorno | Usuarios medidos que regresan en 7/30 días / cohorte con ventana cumplida. | No reportar cohortes inmaduras como abandono. |
| Preguntas/contacto | Recibidas, respondidas/asignadas y conversaciones realizadas. | Métricas agregadas de sistemas separados. |

Tiempo de lectura no se confunde con interacción: detenerse a leer sin mover el ratón es válido. Reportar tiempo visible e interacciones por separado; no afirmar atención real a partir de ambos. Ocultar pestaña deja de sumar tiempo visible.

El MVP no tiene todavía un umbral comercial de conversión defendible. Primera evaluación formativa: 5–8 adultos ajenos al diseño. Propuesta de señal de usabilidad: al menos 80 % completa la navegación básica sin intervención del facilitador; cualquier bloqueo accesible o interpretación repetida de que la semana se demuestra científicamente obliga a revisar. La muestra sirve para detectar problemas, no para estimar eficacia evangelística poblacional.

## 7. Calidad, rendimiento y resiliencia

Objetivos iniciales de aceptación, sujetos a medición en el prototipo; no resultados obtenidos.

- Texto y controles esenciales disponibles aunque no cargue 3D. Sin audio ni reproducción autónoma fuera de las excepciones definidas.
- Teclado completo, foco visible, etiquetas comprensibles, movimiento reducido y controles táctiles amplios. Objetivo de accesibilidad: WCAG 2.2 AA, a auditar; no se declara conformidad anticipada.
- Propuesta de rendimiento web en percentil 75 cuando haya datos de campo suficientes: LCP ≤ 2,5 s, INP ≤ 200 ms y CLS ≤ 0,1. Antes, usar pruebas de laboratorio con condiciones documentadas, sin presentarlas como datos reales de usuarios.
- Propuesta para P08: fluidez cercana a 60 fps en escritorio de referencia y al menos 30 fps sostenidos en móvil de referencia durante exploración; degradar detalle si no se alcanza. Elegir y registrar dispositivos en arquitectura antes de fijar el resultado como aprobado.
- Cargar Three.js y assets pesados cuando se acerque la escena; no descargar todos los futuros libros. Una escena 3D activa por vez. Limitar trazo, texturas y resolución; liberar recursos al salir cuando no se requieran para retorno inmediato.
- Tras diez entradas/salidas de P08 y libro no deben acumularse render loops, listeners ni recursos que crezcan con cada visita. Medir y documentar antes/después.
- Errores de red conservan formularios en memoria, permiten reintentar y no duplican efectos. No hay soporte offline prometido.
- Navegadores de prueba: Safari en iOS, Chrome en Android y Chrome/Safari de escritorio en versiones vigentes al inicio de implementación. Fijar versiones exactas en el informe, no asumir que una emulación sustituye un dispositivo real.

## 8. Límites técnicos para la arquitectura

Next.js + TypeScript como base común del sitio y ruta privada de prototipo P08. GSAP controla storytelling y secuencias; Three.js se limita a P08 y al libro. La navegación, datos y lógica de dominio deben funcionar sin depender de una timeline concreta.

La arquitectura debe separar contenido público de componentes interactivos, autenticación, progreso, preferencias, notas, buzón, contacto y analítica. Todas las comprobaciones de propiedad y permisos se hacen en servidor. No exponer claves privilegiadas al cliente ni usar un identificador enviado por el navegador como única autorización.

Decisiones confirmadas por el propietario el 18 de septiembre: Vercel para alojamiento, Supabase para base de datos y Supabase Auth para autenticación. Usaremos la versión estable más reciente de Next.js al iniciar la implementación, sin canary, beta o RC. El 18 de septiembre de 2026 el registro oficial npm marca `next@16.3.5` como `latest` (https://registry.npmjs.org/next/latest). Se comprobará de nuevo al crear el proyecto y se fijará la versión resuelta y su lockfile; esto no implica actualizaciones automáticas sin pruebas. Acceso a datos confirmado: librerías oficiales `@supabase/supabase-js` y `@supabase/ssr`, consultas directas y funciones PostgreSQL mediante RPC; sin ORM externo. Queda por definir la integración de Three.js con React. La arquitectura posterior resolverá recuperación de cuenta, transferencia atómica de likes, políticas de acceso por fila, límites de abuso, migraciones, backups, restauración y separación entre entornos de prueba y producción. Métodos confirmados: correo electrónico y Google. Modalidad confirmada para correo: correo y contraseña, descrita en RF-06. Las decisiones de acceso a datos y autenticación se desarrollan en `acceso-datos-autenticacion-v0.1.md`.

## 9. Dependencias y decisiones abiertas

| Decisión | Propuesta/requisito actual | Bloquea |
|---|---|---|
| Configuración de acceso | Correo con contraseña y Google confirmados. Configurar proveedor Google, URLs autorizadas y SMTP de producción. | Acceso real y entrega de correos, no P08. |
| Configuración de infraestructura | Vercel y Supabase confirmados; definir entornos, región, permisos y conexión. | Funciones con datos reales. |
| Revisión científica y bíblica | Revisores designados y fuentes por afirmación; traducción definida. | Publicación del contenido correspondiente. |
| Equipo de atención | Responsables, canales y capacidad conocidos. | Apertura de contacto real y promesas de respuesta. |
| Retención/avisos | Propuesta de §5 por revisar con alcance territorial y proveedor. | Recogida real de datos. |
| Segundo nodo | Contenido distinto, completo y revisado. | MVP-B y medición de continuidad real. |
| Dispositivos de referencia | Seleccionar móvil de prestaciones medias y escritorio real disponibles. | Aprobación de rendimiento; no diseño inicial. |

El propietario decide prioridades y coordina personas. El asistente produce arquitectura, guiones, diseños, assets, implementación y evidencia de pruebas dentro del alcance acordado. Este PRD no atribuye aprobaciones externas ni responsables inexistentes.

## 10. Plan de validación trazable

| Prueba | Requisitos | Evidencia requerida |
|---|---|---|
| Recorrido anónimo completo, vuelta atrás y scroll rápido | RF-01, 03, 04 | Grabación o registro de pasos con resultado y dispositivo. |
| Cámara libre → scroll → fichas → vuelta atrás | RF-02 | Prueba desde varios ángulos, móvil y teclado, pausa y cambio de pestaña. |
| Like → recarga → registro → preferencias | RF-05, 06 | IDs antes/después, propietario, estado y total; sin credenciales en evidencia. |
| Reintentos, solicitudes concurrentes y desmarcado | RF-05 | Pruebas de integración que demuestren una preferencia efectiva y última intención coherente. |
| Acceso cruzado y código inválido | RF-06–10 | Denegación de lectura/escritura de datos ajenos en servidor. |
| Borrador → registro → nota guardada → otra sesión | RF-07 | Conservación del texto y privacidad; prueba de error de red. |
| Pregunta sin cuenta → respuesta → consulta privada | RF-08, 10 | Flujo completo sin asociación con like/cuenta. |
| Solicitud → asignación → cancelación | RF-09, 10 | Estados y autorización verificables; sin contacto real a terceros durante pruebas. |
| Rechazo de analítica y transferencia de identidad | RF-05, 06 y §6 | Funciones disponibles; ausencia de navegación opcional y doble conteo. |
| Segundo nodo protegido | RF-11 | Acceso directo y continuidad tras registro; datos de prueba antes de MVP-B. |
| WebGL fallido, movimiento reducido y rendimiento | RF-02, 07 y §7 | Vistas alternativas funcionales y mediciones con condiciones documentadas. |

**Salida de MVP-A:** RF-01–10 y comportamiento de catálogo de RF-11 verificados; contenido aprobado; operación disponible o explícitamente deshabilitada antes de recoger datos; avisos revisados; sin bloqueos críticos de seguridad, accesibilidad o pérdida de datos. Si se deshabilita una función por falta de equipo, se declara lanzamiento reducido y no cumplimiento completo del alcance originalmente previsto.

**Salida de MVP-B:** segundo nodo aprobado y publicado, barrera de registro funcional y eventos de continuidad contrastados. Solo entonces se publican conclusiones sobre recorridos entre temas.

## 11. Secuencia de trabajo posterior

1. Revisar este PRD y resolver las decisiones de arquitectura que bloquean persistencia y acceso.
2. Producir arquitectura técnica para Vercel y Supabase, con modelo físico de datos, integración de Supabase Auth, límites cliente/servidor y plan de operación.
3. Crear prototipo aislado de P08 en la base Next.js, validar transición entre cámara libre y scroll, accesibilidad y rendimiento.
4. Producir composiciones, assets por capas y guion final; integrar el piloto completo.
5. Implementar y verificar funciones persistentes, operación y medición; realizar revisión editorial y evaluación formativa.
6. Publicar piloto controlado; después incorporar segundo nodo para evaluar continuidad.

**Estado de esta entrega:** PRD escrito y revisado contra los documentos del proyecto. No hay código del producto ni pruebas ejecutadas. Los criterios anteriores describen lo que se deberá comprobar, no resultados ya obtenidos.

## 12. Guías de desarrollo

Las skills son ayudas de implementación, no requisitos del usuario ni dependencias de producción. Su selección y verificación local se documentan en [Guías de desarrollo](guias-de-desarrollo.md). Las decisiones del producto prevalecen; las instrucciones de una skill no activan características opcionales por sí solas.

## Ubicación y esquema de datos actualizados

Esquema propuesto: [Tablas, permisos y RPC](esquema-datos-permisos-rpc-v0.1.md).
