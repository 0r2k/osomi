# Osomi · Mira más de cerca

Documental interactivo, experiencia editorial y espacio de exploración. Primer piloto: **¿Por qué necesito descansar?**

## Documentos vigentes

- [PRD](docs/prd-mvp-v0.1.md)
- [Diseño de experiencia](docs/product-experience-design-document-v0.3.md)
- [Storyboard](docs/storyboard-piloto-descanso-v0.1.md)
- [Acceso a datos y autenticación](docs/acceso-datos-autenticacion-v0.1.md)
- [Tablas, permisos y RPC](docs/esquema-datos-permisos-rpc-v0.1.md)
- [Guías de desarrollo](docs/guias-de-desarrollo.md)

Las versiones internas de los documentos prevalecen sobre los nombres de archivo, conservados para mantener enlaces. `work/revisions` contiene antecedentes. La app local y el historial de migraciones están en esta carpeta. El estado vigente se detalla en [Estado de desarrollo](docs/estado-desarrollo.md).

## Aplicación y base de desarrollo

La aplicación está en esta misma carpeta.

- `npm ci` instala las versiones del lockfile.
- `npm run dev` inicia Next.js localmente.
- `npm test` verifica el contrato de preferencias y aislamiento con PostgreSQL embebido.
- `npm run typecheck`, `npm run lint` y `npm run build` verifican la app.
- Copiar `.env.example` a `.env.local` y completar la URL y clave pública del proyecto permite activar los clientes Supabase. Nunca guardar secretos en Git.

El primer bloque implementa perfiles, catálogo mínimo sin publicación y preferencias: alta de visitante, guardado autenticado/anónimo, revisiones, idempotencia y transferencia al registrarse. El segundo bloque añade catálogo versionado, progreso, notas y tablas privadas de preguntas y contacto. Sus formularios y RPC operativas siguen pendientes. Tampoco hay formularios de Auth ni endpoints de cookies anónimas conectados a la interfaz. La pantalla inicial es una comprobación local, no el diseño del piloto.

Las pruebas funcionales actuales usan PGlite y roles simulados de Supabase: no sustituyen pruebas de Auth/Google/correo, PostgREST o concurrencia real. Las funciones de servidor requieren que la futura capa HTTP verifique la sesión y derive el usuario; no debe aceptar un `user_id` arbitrario del navegador.
