# json-diff-api

![Node.js](https://img.shields.io/badge/node-20-green) ![Express](https://img.shields.io/badge/express-4.x-blue) ![license](https://img.shields.io/badge/license-MIT-yellow)

API REST que compara dos objetos JSON y devuelve sus diferencias en formato legible. Detecta adiciones, eliminaciones, cambios de valor y cambios de tipo con rutas en notación de puntos.

## Instalación en 3 comandos

```bash
git clone https://github.com/Quesillo27/json-diff-api
cd json-diff-api
npm install
```

## Uso

```bash
npm start   # inicia el servicio en puerto 3100
```

## Ejemplo

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
  "identical": false,
  "summary": { "total": 3, "added": 1, "removed": 1, "changed": 1 },
  "diffs": [
    { "path": "name",   "type": "changed", "from": "Alice", "to": "Bob" },
    { "path": "active", "type": "removed", "value": true },
    { "path": "role",   "type": "added",   "value": "admin" }
  ]
}
```

## API / Endpoints

| Método | Endpoint | Descripción |
|---|---|---|
| GET | `/health` | Health check |
| POST | `/diff` | Diff completo con todas las diferencias |
| POST | `/diff/summary` | Solo resumen (totales sin detalle) |
| POST | `/diff/patch` | Diferencias en formato JSON Patch (RFC 6902) |

### Body de las peticiones POST

```json
{
  "original": { ... },
  "modified": { ... },
  "options": {
    "ignoreKeys": ["updatedAt", "timestamp"]
  }
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

Las rutas usan notación de puntos para objetos y notación `[n]` para arrays:

- `user.name` → propiedad anidada
- `items[2].price` → elemento de array anidado
- `meta.tags[0]` → primer elemento de un array

## Variables de entorno

| Variable | Default | Descripción |
|---|---|---|
| `PORT` | `3100` | Puerto del servidor |

## Docker

```bash
docker build -t json-diff-api .
docker run -p 3100:3100 json-diff-api
```

## Contribuir

PRs bienvenidos. Corre `npm test` antes de enviar.
