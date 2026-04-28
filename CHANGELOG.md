# Changelog

## [Unreleased]

### Corregido
- `POST /diff/patch` ahora escapa correctamente claves con `/` y `~` usando JSON Pointer RFC 6901, y usa `path: ""` para reemplazos en la raíz del documento.
- `options.ignoreKeys` ahora valida que todos sus elementos sean strings, también dentro de `POST /diff/batch`, evitando resultados silenciosamente inconsistentes.

## [1.1.0] - 2026-04-18

### Añadido
- `POST /diff/batch` — compara hasta 20 pares de JSONs en una sola petición con resultados indexados
- `src/config.js` — configuración centralizada (puerto, rate limit, límites)
- `src/logger.js` — logger estructurado con Winston (niveles info/warn/error, silenciado en tests)
- `src/middleware/validate.js` — validación de inputs extraída como middleware reutilizable
- `src/routes/diff.js` — router de diff separado del entry point
- `src/routes/health.js` — endpoint `/health` con uptime, versión y memoria
- `helmet` — headers de seguridad HTTP en todos los endpoints
- `express-rate-limit` — rate limiting: 100 req/min por IP (IETF `RateLimit-*` headers)
- CI con GitHub Actions (Node.js 20 y 22)
- `Makefile` con targets `dev`, `start`, `test`, `build`, `docker`, `lint`
- `setup.sh` — instalación en 1 comando
- `examples/curl-examples.sh` — ejemplos de uso completos
- `LICENSE` MIT
- `.env.example`
- `ARCHITECTURE.md`

### Corregido
- **Bug crítico en `/diff/patch`**: para diferencias de tipo `type_changed`, la operación `replace` emitía el objeto `{ type, value }` completo en lugar del valor real. Ahora devuelve correctamente el valor primitivo.
- Respuestas de error en `/health` y rutas 404 ahora incluyen `success: false` consistente con el resto de la API
- Validación de `options` y `options.ignoreKeys` devuelve 400 con mensaje descriptivo en lugar de comportamiento indefinido

### Cambiado
- Todas las respuestas usan formato uniforme `{ success, data }` / `{ success, error }`
- Dockerfile actualizado a multi-stage build (imagen final más pequeña)
- `/health` ahora incluye `uptime` (segundos), `version` y métricas de memoria heap
- Tests: 14 → 43 (+29). Nuevos tests de endpoints HTTP + edge cases del differ

## [1.0.0] - 2026-04-11

### Añadido
- `POST /diff` — diff completo con rutas en notación puntos y corchetes
- `POST /diff/summary` — solo resumen de totales
- `POST /diff/patch` — diferencias en formato JSON Patch RFC 6902
- `GET /health` — health check básico
- Soporte para `ignoreKeys` en cualquier nivel de profundidad
- Dockerizado con HEALTHCHECK
- 14 tests unitarios
