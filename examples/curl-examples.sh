#!/bin/sh
# Ejemplos de uso de json-diff-api
# Asegúrate de que el servidor esté corriendo: npm start

BASE="http://localhost:3100"

echo "=== GET /health ==="
curl -s "$BASE/health" | python3 -m json.tool

echo ""
echo "=== POST /diff — detección de cambios ==="
curl -s -X POST "$BASE/diff" \
  -H "Content-Type: application/json" \
  -d '{
    "original": {"name": "Alice", "age": 30, "active": true},
    "modified": {"name": "Bob",   "age": 30, "role": "admin"}
  }' | python3 -m json.tool

echo ""
echo "=== POST /diff — con ignoreKeys ==="
curl -s -X POST "$BASE/diff" \
  -H "Content-Type: application/json" \
  -d '{
    "original": {"id": 1, "name": "Alice", "updatedAt": "2024-01-01"},
    "modified": {"id": 1, "name": "Alice", "updatedAt": "2025-06-01"},
    "options": {"ignoreKeys": ["updatedAt"]}
  }' | python3 -m json.tool

echo ""
echo "=== POST /diff/summary — solo totales ==="
curl -s -X POST "$BASE/diff/summary" \
  -H "Content-Type: application/json" \
  -d '{
    "original": {"a": 1, "b": 2, "c": 3},
    "modified": {"a": 99, "d": 4}
  }' | python3 -m json.tool

echo ""
echo "=== POST /diff/patch — formato RFC 6902 ==="
curl -s -X POST "$BASE/diff/patch" \
  -H "Content-Type: application/json" \
  -d '{
    "original": {"user": {"name": "Alice", "role": "viewer"}},
    "modified": {"user": {"name": "Alice", "role": "admin"}}
  }' | python3 -m json.tool

echo ""
echo "=== POST /diff/batch — comparación múltiple ==="
curl -s -X POST "$BASE/diff/batch" \
  -H "Content-Type: application/json" \
  -d '{
    "pairs": [
      {"original": {"x": 1}, "modified": {"x": 2}},
      {"original": {"y": "hello"}, "modified": {"y": "hello"}},
      {"original": {"z": null}, "modified": {"z": 42}}
    ]
  }' | python3 -m json.tool
