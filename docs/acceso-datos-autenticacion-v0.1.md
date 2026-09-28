# Decisión de arquitectura · Acceso a datos y autenticación

**Aplicación:** Osomi · Mira más de cerca.

Actualizado el 21 de septiembre de 2026. Acceso directo implementado en local contra Supabase de desarrollo. Correo con contraseña y Google confirmados. Véase estado-desarrollo.md para evidencia y pendientes.

## 1. Acceso directo, sin ORM

Usar `@supabase/supabase-js` para consultas y RPC, y `@supabase/ssr` para la integración de sesiones con Next.js. Clientes diferenciados para navegador y servidor; no compartir un cliente de servidor con sesión entre peticiones. No incorporar Prisma, Drizzle ni otro ORM. Las migraciones son SQL versionado y los tipos TypeScript se generan desde el esquema de Supabase.

La integración oficial admite clientes de navegador y servidor con sesiones mediante cookies. Su configuración debe seguir la documentación vigente al implementar. [Supabase SSR](https://supabase.com/docs/guides/auth/server-side/creating-a-client)

## 2. Qué va por consulta y qué por RPC

| Operación | Camino elegido |
|---|---|
| Notas, progreso y preferencias del usuario | Consultas directas con cliente oficial y permisos RLS por propietario; servidor o navegador según la pantalla. |
| Likes anónimos | Route Handler de Next.js valida cookie opaca y llama a operación acotada en base de datos. No permitir escritura pública por un ID de propietario suministrado por el navegador. |
| Transferencia/consolidación de likes | Servidor valida sesión registrada y vínculo anónimo; RPC ejecuta cambios en una transacción, conserva ID sin conflicto y evita duplicados. |
| Preguntas anónimas y consulta mediante secreto | Endpoints de servidor con validación de secreto y límites de abuso; tablas sin lectura pública. Independientes de la identidad del like. |
| Contacto humano y cambios de estado | Endpoints con permisos y validación; RPC si varias escrituras deben confirmarse juntas. |
| Contenido editorial | Archivos estructurados versionados inicialmente; Supabase solo donde haga falta persistencia dinámica. |

Las funciones PostgreSQL se invocan mediante `supabase.rpc`. [Referencia oficial](https://supabase.com/docs/reference/javascript/rpc). No convertir cada consulta simple en RPC ni introducir una API duplicada para todas las lecturas.

## 3. Permisos y atomicidad

RLS en tablas expuestas y políticas por operación/propietario. La clave pública no sustituye autorización. Claves privilegiadas solo en servidor y para operaciones expresamente acotadas, nunca como cliente general del sitio. Notas y respuestas privadas no se almacenan en caché compartida.

Preferir funciones con permisos del invocador. Si la transferencia necesita privilegios superiores, resolverlo expresamente en el esquema físico: verificar ambos propietarios, restringir ejecución, fijar contexto seguro y probar que no puede invocarse como operación pública arbitraria. Una RPC no es segura solo por ser una función.

Supabase Auth y la transferencia de likes no se tratarán como una única transacción distribuida: primero verificar sesión; después ejecutar transferencia idempotente. Si falla, mantenerla pendiente y reintentar sin recrear cuenta ni duplicar likes. No conceder al navegador la capacidad de elegir el usuario destino.

Identidad anónima: por ahora se mantiene la cookie propia del diseño, no se crean usuarios de Supabase Auth para cada visitante. Cambiar a Anonymous Sign-Ins sería otra decisión, no una consecuencia automática de usar Supabase.

## 4. Registro y acceso

Confirmado: **correo con contraseña**, confirmación del correo y enlace de recuperación; **Continuar con Google** mediante Supabase Auth, sin contraseña propia. Reemplaza la propuesta anterior de OTP. Google no da acceso al buzón Gmail.

El callback restringe los destinos y verifica la sesión antes de transferir favoritos. La integración implementada usa redirección de página completa. Antes de incorporar notas temporales habrá que conservar el borrador al salir y recuperarlo al volver.


La unificación de accesos depende de identidades verificadas y de las reglas de Supabase Auth, no de comparar emails en código propio. Probar correo → Google y Google → correo con el mismo correo verificado, y cuentas con correos distintos. No fusionar estas últimas automáticamente. [Vinculación de identidades](https://supabase.com/docs/guides/auth/auth-identity-linking)

La recuperación consiste en volver a autenticar mediante el correo o el proveedor; si se pierde acceso a ambos, no prometer recuperación automática. Para correo se necesita envío transaccional de producción configurado y probado; proveedor SMTP aún por elegir. [SMTP propio](https://supabase.com/docs/guides/auth/auth-smtp)

## 5. Pruebas obligatorias antes de publicar

- Código correcto, incorrecto, vencido y reenvío con límite; solicitarlo no cuenta como sesión iniciada.
- Google autorizado/cancelado, callback inválido y retorno al tema solicitado.
- Like anónimo transferido una sola vez tras correo/contraseña o Google; fallo y reintento de RPC sin duplicados.
- Consultas y RPC no permiten leer/escribir notas, preferencias o progreso ajenos.
- Preguntas anónimas siguen desvinculadas después de registrarse.
- Borrador de nota conservado durante autenticación; alternativa al bloqueo de ventana secundaria.
- Cierre de sesión y sesión vencida; ningún dato privado reaparece por caché compartida.
- Correos entregados a usuarios de prueba reales autorizados antes de habilitar registro público.

## 6. Próxima definición

Modelo físico de tablas, políticas RLS y firmas de RPC; configuración de entornos en Vercel/Supabase; URLs de Auth y proveedor SMTP. Se mantiene Next.js estable más reciente al iniciar implementación, con versión fijada y lockfile.

Fuentes consultadas el 18 de septiembre de 2026. El índice de changelog en Markdown no pudo leerse mediante el navegador de investigación; deberá revisarse antes de implementar. No se hicieron cambios en proyectos remotos.
