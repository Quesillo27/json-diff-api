# json-diff-api

![CI](https://github.com/Quesillo27/json-diff-api/actions/workflows/ci.yml/badge.svg)
![Node.js](https://img.shields.io/badge/node-20+-green)
![Express](https://img.shields.io/badge/express-4.x-blue)
![license](https://img.shields.io/badge/license-MIT-yellow)
![version](https://img.shields.io/badge/version-1.1.0-orange)

API REST que compara dos objetos JSON y devuelve sus diferencias en formato legible. Detecta adiciones, eliminaciones, cambios de valor y cambios de tipo con rutas en notación de puntos. Soporta comparación en batch de múltiples pares.

## Instalación en 3 comandos

```bash
git clone https://github.com/Quesillo27/json-diff-api
cd json-diff-api
./setup.sh
```

## Uso

```bash
npm start      # producción — puerto 3100
npm run dev    # desarrollo con hot-reload
npm test       # tests
make docker    # build imagen Docker
```

## Ejemplos

### Diff básico

```bash
curl -s -X POST http://localhost:3100/diff \
  -H "Content-Type: application/json" \
  -d '{
    "original": {"name": "Alice", "age": 30, "active": true},
    "modified": {"name": "Bob",   "age": 30, "role": "admin"}
  }'
```

```json
{
  "success": true,
  "data": {
    "identical": false,
    "summary": { "total": 3, "added": 1, "removed": 1, "changed": 1 },
    "diffs": [
      { "path": "name",   "type": "changed", "from": "Alice", "to": "Bob" },
      { "path": "active", "type": "removed", "value": true },
      { "path": "role",   "type": "added",   "value": "admin" }
    ]
  }
}
```

### Ignorar claves dinámicas

```bash
curl -s -X POST http://localhost:3100/diff \
  -H "Content-Type: application/json" \
  -d '{
    "original": {"id": 1, "name": "Alice", "updatedAt": "2024-01-01"},
    "modified": {"id": 1, "name": "Alice", "updatedAt": "2025-06-01"},
    "options": {"ignoreKeys": ["updatedAt"]}
  }'
# → identical: true
```

### Patch RFC 6902

```bash
curl -s -X POST http://localhost:3100/diff/patch \
  -H "Content-Type: application/json" \
  -d '{"original": {"role": "viewer"}, "modified": {"role": "admin"}}'
# → [{ "op": "replace", "path": "/role", "value": "admin" }]
```

Las rutas del patch usan JSON Pointer RFC 6901, por lo que claves con `/` o `~` se escapan correctamente.

### Comparación en batch

```bash
curl -s -X POST http://localhost:3100/diff/batch \
  -H "Content-Type: application/json" \
  -d '{
    "pairs": [
      {"original": {"x": 1}, "modified": {"x": 2}},
      {"original": {"y": "ok"}, "modified": {"y": "ok"}}
    ]
  }'
```

## API

| Método | Endpoint | Descripción |
|---|---|---|
| GET | `/health` | Estado del servicio, versión, uptime, memoria |
| POST | `/diff` | Diff completo — diffs + resumen |
| POST | `/diff/summary` | Solo totales (sin array de diffs) |
| POST | `/diff/patch` | Diferencias como JSON Patch RFC 6902 |
| POST | `/diff/batch` | Hasta 20 pares en una petición |

### Body de las peticiones POST (excepto `/batch`)

```json
{
  "original": { ... },
  "modified": { ... },
  "options": {
    "ignoreKeys": ["updatedAt", "timestamp"]
  }
}
```

`options.ignoreKeys` debe ser un arreglo de strings.

### Body de `/diff/batch`

```json
{
  "pairs": [
    { "original": { ... }, "modified": { ... }, "options": {} },
    { "original": { ... }, "modified": { ... } }
  ]
}
```

### Tipos de diferencia

| Tipo | Descripción |
|---|---|
| `added` | Clave presente en `modified` pero no en `original` |
| `removed` | Clave presente en `original` pero no en `modified` |
| `changed` | Mismo tipo, distinto valor |
| `type_changed` | Distinto tipo (`number` → `string`, etc.) |

### Rutas de diferencia

- `user.name` → propiedad anidada
- `items[2].price` → elemento de array anidado

## Variables de entorno

| Variable | Default | Obligatoria | Descripción |
|---|---|---|---|
| `PORT` | `3100` | No | Puerto del servidor |
| `LOG_LEVEL` | `info` | No | Nivel de log: error, warn, info, debug |

## Docker

```bash
docker build -t json-diff-api .
docker run -p 3100:3100 json-diff-api
```

## Roadmap

- Diff semántico de arrays por campo `id` configurable
- Endpoint `POST /diff/apply` para aplicar un patch sobre un objeto base
- Salida en formato `unified diff` (estilo git)
- Soporte para comparar archivos JSON vía upload

## Contribuir

PRs bienvenidos. Corre `npm test` antes de enviar. Ver `ARCHITECTURE.md` para entender la estructura.
