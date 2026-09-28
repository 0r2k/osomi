# Esquema de tablas, permisos y RPC

Arquitectura de Osomi · Diseño original del 18 de septiembre de 2026. Implementación parcial: consultar [estado vigente y diferencias](estado-desarrollo.md).

Base: [PRD](prd-mvp-v0.1.md), [acceso a datos](acceso-datos-autenticacion-v0.1.md) y [storyboard](storyboard-piloto-descanso-v0.1.md). Next.js en Vercel; Supabase Auth y PostgreSQL mediante librerías oficiales y RPC, sin ORM. Correo y Google confirmados; OTP de correo continúa como modalidad propuesta.

## 1. Límites del diseño

`public` contiene tablas accesibles mediante la Data API, con permisos explícitos y RLS. `private` contiene identidad anónima, preguntas, contacto, personal e idempotencia; no se expone como esquema de la Data API. Las funciones públicas de entrada no implican ejecución pública: cada una tiene permisos específicos.

No creamos usuarios de Supabase Auth para visitantes anónimos. La cookie propia identifica al visitante para sus likes; no guarda progreso ni vincula preguntas. La cuenta se identifica exclusivamente por `auth.users.id`, nunca por un email recibido del cliente. El correo y las identidades Google permanecen en Auth; no se duplican en perfiles públicos.

El contenido largo sigue en archivos versionados. La base mantiene un manifiesto mínimo de experiencias, versiones e hitos para validar referencias y controlar publicación. No hay dos editores independientes del mismo contenido.

## 2. Convenciones

IDs UUID; fechas `timestamptz` generadas por servidor; estados textuales restringidos mediante CHECK. Toda FK usada en acceso o borrado lleva índice. Campos de propietario, fecha de creación y secuencia no pueden ser alterados libremente por el cliente.

Las tablas con edición concurrente usan `revision bigint` creciente y escritura con revisión esperada; cero filas modificadas se trata como conflicto, nunca como guardado exitoso. El cliente no decide el orden global de las acciones: se asigna una secuencia de mutación desde la base de datos una vez adquirido el bloqueo correspondiente. Las secuencias pueden tener saltos.

En las listas siguientes, PK significa clave primaria, FK referencia y UQ unicidad. Los límites de texto son propuestas concretas para el MVP: nombre 80 caracteres, nota 10.000, pregunta/respuesta 2.000. El PRD conserva la autoridad sobre cambios posteriores.

## 3. Tablas del catálogo

| Tabla | Campos principales | Restricciones y uso |
|---|---|---|
| `public.experiences` | `id` PK, `slug`, `title`, `summary`, `is_entry`, `published_version_id` nullable | UQ slug. Una entrada pública inicial para el piloto; título ≤160, resumen ≤500. El contenido pendiente puede tener ficha, pero no botón de inicio. |
| `public.experience_versions` | `id` PK, `experience_id` FK, `version`, `status`, `content_path`, `content_hash`, `published_at` | UQ experiencia/versión. Estado draft/published/retired. Ruta a contenido del despliegue, no URL arbitraria. |
| `public.scene_manifest` | `version_id` FK, `scene_key`, `position`, `kind` | PK versión/escena; UQ versión/posición. Kind narrative/interaction/closing. |
| `public.experience_edges` | `source_id`, `target_id` FK, `prompt`, `reason`, `rank` | PK origen/destino; no autorreferencia. Los destinos no publicados se muestran solo como próximos. |

`published_version_id` debe referir a una versión de la misma experiencia: FK compuesta o validación equivalente en la operación de publicación. Versiones publicadas inmutables; corregir crea una nueva. El despliegue verifica manifiesto y hash antes de activar versión. Una visita ya iniciada termina contra la versión con la que empezó, conservando el contenido de versiones soportadas.

El catálogo público no entrega el cuerpo completo de experiencias protegidas. Next.js verifica sesión antes de servir un segundo tema; ocultar un botón no es autorización. Las fuentes del tema de entrada siguen siendo públicas.

## 4. Tablas de usuario

| Tabla | Campos principales | Restricciones y acceso |
|---|---|---|
| `public.profiles` | `user_id` PK/FK Auth, `display_name` nullable, `created_at`, `updated_at` | Usuario consulta el suyo y cambia solo nombre visible. Sin columna de rol editable. Crear perfil idempotentemente al primer acceso verificado. |
| `public.topic_preferences` | `id` PK, `experience_id` FK, `user_id` nullable FK Auth, `visitor_id` nullable FK privada, `active`, `action_seq`, `revision`, fechas | Exactamente un propietario no nulo. UQ parcial usuario/tema y visitante/tema. `active=false` conserva intención de desmarcado. Usuario lee solo sus filas; escrituras por RPC. |
| `public.experience_progress` | `id` PK, `user_id` FK, `version_id` FK, `last_scene_key`, `status`, `biblical_choice`, `revision`, fechas | UQ usuario/versión; FK compuesta versión/escena. Estado started/completed; elección unknown/explored/skipped. Refleja avance declarado, no certifica comprensión. |
| `public.notes` | `id` PK, `user_id` FK, `version_id` FK, `scene_key` nullable, `body`, `revision`, fechas | Nota del propietario; FK compuesta si incluye escena; cuerpo de 1–10.000 caracteres. Las notas se mantienen asociadas a su edición original. |

Perfiles, notas, progreso y preferencias de cuenta usan borrado en cascada al eliminar Auth; la operación de eliminación también debe limpiar tablas privadas vinculadas. Los borradores de notas anónimas no se escriben aquí: permanecen en memoria según el PRD.

## 5. Tablas privadas

| Tabla | Campos principales | Propósito |
|---|---|---|
| `private.visitors` | `id` PK, `secret_hash`, `expires_at`, `state`, `claimed_user_id` nullable, fechas | Cookie contiene ID y secreto aleatorio de alta entropía. Guardar solo hash del secreto. Estado active/claimed/expired. UQ secret_hash. |
| `private.mutation_receipts` | `scope`, `request_id`, `payload_hash`, `result`, `expires_at` | PK scope/request. Idempotencia de mutaciones; sin cuerpos de notas/preguntas ni secretos en resultado. |
| `private.preference_merges` | `source_preference_id`, `target_preference_id`, `claim_request_id`, `created_at` | Trazabilidad de consolidación sin contar la fila retirada como otro favorito. IDs históricos, sin impedir borrado de la cuenta. |
| `private.question_threads` | `id` PK, `secret_hash`, `status`, `assigned_to` nullable, fechas | Recibida/in_review/answered/closed. Sin user_id, visitor_id ni ID de analítica. |
| `private.question_messages` | `id` PK, `thread_id` FK, `author_kind`, `staff_id` nullable, `body`, `request_id`, `created_at` | Autor visitor/staff; UQ hilo/request. Solo staff requiere staff_id. Borrado cascada con hilo. |
| `private.contact_requests` | `id` PK, `secret_hash`, `channel`, `contact_value`, `display_name` nullable, `consent_version`, `consented_at`, `status`, `assigned_to`, fechas | Email/WhatsApp según capacidad. Sin vínculo con preguntas; estados received/assigned/attempted/conversation_done/closed/cancelled. |
| `private.staff_roles` | `user_id` FK Auth, `role`, `active` | PK usuario/rol; roles responder/coordinator/editor/admin. Escritura solo por administración autorizada; no desde user_metadata. |
| `private.operation_audit` | `id` PK, `actor_id` nullable, `resource_type`, `resource_id`, `action`, `from_state`, `to_state`, fecha | Auditoría de asignaciones, respuestas y contacto. Sin texto del mensaje, nota, email ni token. |
| `private.analytics_events` | `id` PK, `event_key`, `session_id`, `user_id` nullable, `version_id`, `scene_key` nullable, `consent_version`, `occurred_at`, `received_at`, `props` | Evento consentido y propiedades permitidas, no JSON arbitrario. UQ event_key para deduplicar. |

Contacto sin cuenta usa un secreto independiente para consultar/cancelar; no hace falta asociarlo a una cuenta para atenderlo. El valor de contacto solo se muestra a coordinadores autorizados y personal asignado cuando tenga permiso explícito.

Índices adicionales: preferencias por tema/active; progreso y notas por usuario/fecha; preguntas por estado/asignado/fecha; contacto por estado/asignado/fecha; eventos por versión/fecha; visitantes y recibos por expiración. No indexar texto libre por defecto.

## 6. Matriz de permisos

| Recurso | `anon` | `authenticated` | Personal |
|---|---|---|---|
| Catálogo visible y versiones publicadas | SELECT limitado | Igual | Publicación mediante operación de servidor con rol editor |
| Perfiles | Ninguno | SELECT propio; INSERT propio y UPDATE solo nombre | Sin listado general por ser staff |
| Notas | Ninguno | SELECT/INSERT/UPDATE/DELETE propias | Sin acceso por rol operativo |
| Progreso | Ninguno | SELECT/INSERT/UPDATE/DELETE propio | Solo agregados autorizados |
| Preferencias | Ninguno directo | SELECT propio; mutación RPC | Solo agregados autorizados |
| Visitantes, recibos y fusiones | Ninguno | Ninguno directo | Sin consola de exploración personal |
| Preguntas y contacto | Ninguno directo | Ninguno directo | Endpoints verifican rol y asignación |
| Eventos y auditoría | Ninguno | Ninguno directo | Reportes restringidos y agregados |

RLS y GRANT son controles distintos: ambos deben quedar definidos en la misma migración. Para tablas propias, SELECT/DELETE requieren usuario coincidente; INSERT requiere propietario coincidente; UPDATE requiere coincidencia tanto sobre fila original como resultante. Restringir columnas actualizables para impedir cambiar propietario o fechas técnicas. [RLS oficial](https://supabase.com/docs/guides/database/postgres/row-level-security)

Activar RLS también en privadas como defensa adicional, sin políticas para clientes públicos. Roles operativos se verifican contra la tabla privada en cada acción sensible para que una revocación no dependa de refrescar un JWT. No usar metadatos editables por usuario para autorizar.

## 7. RPC: contratos

Todas devuelven errores de dominio consistentes: `invalid_input`, `forbidden`, `expired`, `conflict`, `idempotency_mismatch` o `not_found`. Los endpoints públicos no distinguen secreto incorrecto de recurso inexistente. UUID de request reutilizado con distinto payload devuelve error, no reejecuta. Validación de formato se realiza en Next.js y restricciones finales en PostgreSQL.

### Función del usuario autenticado

`public.set_topic_preference(p_experience_id uuid, p_active boolean, p_expected_revision bigint, p_request_id uuid)` → `{id, active, revision}`.

Sin parámetro user_id: se deriva de identidad verificada. `expected_revision=0` significa fila nueva; discrepancia devuelve conflicto. Cliente serializa clics por tema y, si llega una nueva intención durante una escritura, la envía con la revisión confirmada. Reintentar una solicitud vieja no revierte el estado nuevo.

`EXECUTE` solo `authenticated`. Por necesitar escritura restringida y recibos privados, un wrapper invocador llama a una función privada definidora con privilegios limitados y comprobación de `auth.uid()`. La función privada también se restringe; propietario dedicado, `search_path` fijo y objetos totalmente calificados. No conceder INSERT/UPDATE directo sobre preferencias para evitar eludir sus invariantes.

### Funciones exclusivas del servidor

Wrappers en `public`, `SECURITY INVOKER`, permiso EXECUTE solo a `service_role`. Cuerpos internos en `private`, permisos explícitos; revocar ejecución de PUBLIC, anon y authenticated sobre estas funciones. La clave privilegiada permanece en un cliente separado solo en servidor. Que el endpoint use servidor no basta: antes valida la prueba de sesión o el secreto, origen de la petición y límites de abuso.

| Función | Entradas | Resultado y autorización |
|---|---|---|
| `create_visitor` | `id, secret_hash, expires_at, request_id` | Identidad y expiración; secreto generado en servidor y entregado solo como cookie segura. |
| `set_visitor_preference` | `visitor_id, secret_hash, experience_id, active, expected_revision, request_id` | Preferencia/revisión; DB comprueba secreto, vigencia y estado active. |
| `read_visitor_preferences` | `visitor_id, secret_hash` | Solo preferencias de esa identidad vigente; nunca listado general. |
| `claim_visitor_preferences` | `visitor_id, secret_hash, verified_user_id, request_id` | Recuento transferidas/fusionadas y IDs canónicos; usuario verificado en servidor, no tomado del cuerpo HTTP. |
| `create_question` | `thread_id, secret_hash, body, request_id` | Hilo recibido y primer mensaje en una transacción. |
| `read_question` | `thread_id, secret_hash` | Mensajes públicos del hilo y estado; no identidad del personal ni notas internas. |
| `append_question` | `thread_id, secret_hash, body, request_id` | Nuevo mensaje y estado received, salvo hilo cerrado. |
| `answer_question` | `verified_staff_id, thread_id, body, request_id` | Respuesta y estado answered; rol responder activo y asignación requerida; auditoría atómica. |
| `create_contact` | `id, secret_hash, channel, value, consent_version, request_id` | Solicitud received; fecha de consentimiento generada en servidor. |
| `read_contact` | `id, secret_hash` | Estado y canal; valor de contacto enmascarado. |
| `cancel_contact` | `id, secret_hash, request_id` | Cancelación idempotente; no se reabre solicitud terminal. |
| `assign_case` | `verified_staff_id, kind, case_id, assignee_id, expected_state, request_id` | Asignación de pregunta/contacto; admin para pregunta, coordinator para contacto; destino con rol válido. |
| `transition_contact` | `verified_staff_id, id, expected_state, new_state, request_id` | Estado y auditoría; coordinador activo, transiciones permitidas. |
| `close_question` | `verified_staff_id, thread_id, request_id` | Cierre por respondedor asignado o admin; auditoría. |
| `record_events` | `validated_events[], consent_version, request_id` | Conteo aceptados; lista de eventos/props permitidos y consentimiento comprobados. |

Parámetros de texto/números/UUID de esta tabla se tiparán en las migraciones; no se acepta un JSON genérico como sustituto de argumentos para operaciones sensibles. `kind` solo question/contact; estados mediante listas restringidas. Lecturas de bandejas y métricas se exponen por endpoints con rol, paginación y columnas permitidas; el servidor consulta esquema privado mediante funciones de listado explícitas, no habilitando `private` en la Data API.

`list_assigned_questions(verified_staff_id, cursor, limit≤50)` devuelve hilos asignados y mensajes necesarios; `list_contacts(verified_staff_id, cursor, limit≤50)` requiere coordinator; `get_dashboard_counts(verified_staff_id, from, to)` requiere admin y devuelve agregados. Usan el mismo permiso exclusivo del servidor.

Contacto permite received→assigned→attempted→conversation_done→closed; desde estados no terminales puede cancelarse o cerrarse. Reasignar no revierte conversación realizada. Ningún usuario público puede afirmar que una conversación ocurrió.

## 8. Transferencia del like: transacción exacta

1. Next.js verifica sesión Supabase y obtiene el ID real; lee cookie anónima, sin aceptar propietario destino del navegador.
2. RPC bloquea fila visitante y valida secreto/vigencia. Reintento del mismo claim por el mismo usuario devuelve resultado anterior; otro usuario se rechaza.
3. Bloquea preferencias de visitante y serializa operaciones por usuario/tema mediante bloqueo transaccional compartido con `set_topic_preference`. Ordenar temas por UUID evita inversiones de bloqueo.
4. Sin preferencia de cuenta, actualiza la misma fila: asigna user_id y deja visitor_id nulo. ID, active y orden original permanecen.
5. Con conflicto, compara `action_seq` de las elecciones originales; conserva una fila canónica de cuenta con la elección más reciente, incluso false. Registra ID retirado→canónico y elimina duplicado en la transacción. Transferir no genera una nueva elección ni nueva posición en la secuencia.
6. Marca visitante claimed, registra recibo y confirma todo junto. Ante fallo, todo revierte. La cuenta de Auth ya puede existir: se reintenta solo el claim.
7. El servidor retira cookie visitante tras éxito; una prueba ya consumida no permite reclamar otros registros. Si falló la respuesta HTTP, la repetición validada devuelve el resultado sin contarlo otra vez.

La transferencia y el setter anónimo comparten bloqueo de visitante; nunca puede aparecer un like nuevo en una identidad ya reclamada. Login y registro usan el mismo proceso de reconciliación. Las métricas cuentan preferencias activas canónicas, no eventos de transferencia.

## 9. Secretos, borrado y operación

Cookies de visitante seguras, HttpOnly y SameSite apropiado al callback OAuth; secretos de alta entropía guardados como hash. Buzón y contacto usan secretos distintos, enviados al servidor sin incluirlos en analítica o URLs persistentes con referencias externas. No registrar cuerpos ni secretos en logs. Límites de abuso se aplican por endpoint; los logs operativos se minimizan y no se reutilizan para vincular preguntas con cuentas.

Retención sigue siendo la propuesta del PRD: visitante/like anónimo inactivo 90 días, eventos individuales 90, preguntas cerradas 180, contacto cerrado 90. Recibos no deben desaparecer antes de la ventana de reintento: propuesta 7 días, excepto claims cuyo recibo se conserva mientras viva el vínculo reclamado. Una tarea de mantenimiento purga por lote y produce solo conteos.

El borrado de cuenta elimina perfiles, notas, progreso y preferencias; anonimiza el actor de auditoría cuando sea necesario conservar el hecho. Revoca acceso operativo y limpia claims/recibos que referencien la cuenta. Preguntas y contacto por secreto se eliminan por solicitudes independientes; añadir funciones `delete_question(thread_id, secret_hash, request_id)` y `delete_contact(id, secret_hash, request_id)`, exclusivas del servidor, que validan prueba y ejecutan borrado de hijos. Eliminación no se promete instantánea en copias de seguridad.

## 10. Pruebas antes de aprobar migraciones

- Dos usuarios y dos visitantes: aislamiento completo de SELECT/INSERT/UPDATE/DELETE y RPC; suplantación por ID rechazada.
- Funciones de servidor no ejecutables con clave pública ni JWT de usuario; roles operativos no editables desde perfil.
- Claim conserva ID sin conflicto; fusiona correctamente true/false; reintentos no duplican; dos claims simultáneos y un like concurrente mantienen invariantes.
- Un cuerpo HTTP con verified_user_id o verified_staff_id falso se ignora/rechaza y nunca determina el actor.
- Revisión obsoleta de nota/preferencia devuelve conflicto; un reintento antiguo no restaura datos anteriores.
- Pregunta enviada estando autenticado sigue sin FK a cuenta o visitante; secreto incorrecto no filtra existencia.
- Borrado y vencimiento respetan retención, FKs y ausencia de secretos en logs.
- Publicación falla si manifiesto/hash no coincide o destino no publicado; datos privados nunca quedan en caché común.

Este diseño se está convirtiendo en migraciones SQL mediante Supabase CLI y pruebas de base de datos en el proyecto de desarrollo. Los contratos de RPC enumerados siguen siendo especificación hasta figurar como implementados en el estado de desarrollo. La aprobación técnica exige pruebas reales de permisos, concurrencia y recuperación; revisar el documento no sustituye esas pruebas.

## Fuentes técnicas

[Permisos por fila](https://supabase.com/docs/guides/database/postgres/row-level-security), [funciones de base de datos](https://supabase.com/docs/guides/database/functions) y [datos de usuario](https://supabase.com/docs/guides/auth/managing-user-data), consultadas el 18 de septiembre de 2026. Las tablas y contratos anteriores son diseño propio del proyecto.
