# Guías de desarrollo del proyecto

**Aplicación:** Osomi · Mira más de cerca.

Verificación local: 18 de septiembre de 2026. Este documento acompaña el PRD; no es un plan de implementación ni una lista de dependencias del sitio.

## Next.js

Confirmados los archivos SKILL.md instalados:

| Skill | Ubicación local | Aplicación prevista |
|---|---|---|
| next-best-practices | /.agents/skills/next-best-practices/SKILL.md | Guía principal al desarrollar y revisar Next.js: estructura, límites servidor/cliente, datos, errores y optimización. |
| next-cache-components | /.agents/skills/next-cache-components/SKILL.md | Solo si la arquitectura adopta Cache Components; instalar la skill no obliga a activar esa función. |
| next-upgrade | /.agents/skills/next-upgrade/SKILL.md | Actualizaciones posteriores. Al ser un proyecto nuevo, no hay una migración existente que ejecutar ahora. |

Se verificaron presencia y encabezados; las instrucciones completas y referencias aplicables se leerán al realizar cada trabajo. La documentación oficial vigente y los requisitos acordados se contrastarán antes de implementar.

## Otras guías ya consultadas

GSAP ScrollTrigger y Timeline: secuencias de scroll y coordinación del movimiento de P08. Supabase: integración de autenticación, permisos, persistencia y transferencia de likes. Las guías adicionales de GSAP se aplicarán según el trabajo concreto, sin cargar todas por defecto.

## Política de versiones

Utilizar la versión estable más reciente de Next.js al crear el proyecto. Consulta del registro npm del 18 de septiembre de 2026: latest = 16.3.5. Fuente: https://registry.npmjs.org/next/latest.

Revalidar al instalar; fijar versión exacta y lockfile, con versiones compatibles de React y Node. Las actualizaciones posteriores requieren revisión y pruebas; no utilizar una etiqueta flotante como sustituto de un entorno reproducible.

## Ubicación y esquema de datos actualizados

Esquema propuesto: [Tablas, permisos y RPC](esquema-datos-permisos-rpc-v0.1.md).
