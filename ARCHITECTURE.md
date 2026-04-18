# Arquitectura — json-diff-api

## Estructura de carpetas

```
src/
├── config.js          # Constantes centralizadas (puerto, límites, rate limit)
├── logger.js          # Logger Winston (silenciado en NODE_ENV=test)
├── server.js          # Entry point: Express + middleware global + montaje de routers
├── differ.js          # Lógica core de diffing (sin dependencias de Express)
├── middleware/
│   └── validate.js    # Validación de inputs como middleware reutilizable
└── routes/
    ├── diff.js        # POST /diff, /diff/summary, /diff/patch, /diff/batch
    └── health.js      # GET /health
tests/
├── differ.test.js     # Tests unitarios de la lógica de diff
└── api.test.js        # Tests de integración HTTP (endpoints reales)
```

## Decisiones de diseño

### Por qué differ.js no depende de Express
El differ es lógica pura — recibe dos objetos y devuelve un resultado. Mantenerlo separado de
Express permite testearlo sin levantar un servidor y reutilizarlo en otros contextos.

### Por qué validación como middleware
En lugar de repetir los mismos checks en cada handler, los middlewares `validateDiffBody` y
`validateBatchBody` centralizan la validación. Resultado: handlers más cortos y un único lugar
para ajustar reglas de validación.

### Por qué `ignoreKeys` filtra por nombre de clave (no por path)
Filtrar por nombre es el caso de uso dominante: ignorar `updatedAt`, `timestamp`, `__v`, etc.
independientemente de dónde aparezcan en el árbol. Un filtro por path exacto requeriría conocer
la profundidad de la clave en cada objeto, lo que complica el API.

### Por qué arrays se comparan por índice (no por contenido)
La comparación semántica de arrays (matching por `id` u otro campo) requiere conocer el dominio.
Sin esa información, la comparación por índice es el comportamiento más predecible y reversible.
Para arrays de objetos con id, el cliente puede ordenar antes de difar.

### Format uniforme `{ success, data, error }`
Todas las respuestas usan este envelope. Ventaja: los clientes siempre saben dónde buscar el
resultado o el error, sin inspeccionar el status code para determinar la forma de la respuesta.

## Flujo de una petición

```
Cliente → [helmet] → [rateLimit] → [express.json] → Router → validateMiddleware → Handler → differ.js → Respuesta
```

## Consideraciones de producción

- Rate limit: 100 req/min por IP. Ajustable en `config.js`.
- Límite de body: 10MB. Suficiente para JSONs grandes; rechaza payloads abusivos.
- Batch: máximo 20 pares. Evita timeouts en peticiones batch muy grandes.
- Logger silenciado en `NODE_ENV=test` para no contaminar la salida de los tests.
