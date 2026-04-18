#!/bin/sh
set -e

echo "==> Instalando dependencias..."
npm install

if [ ! -f .env ]; then
  cp .env.example .env
  echo "==> Copiado .env.example → .env"
fi

echo ""
echo "✅ Listo. Ejecuta:"
echo "   npm start    # producción (puerto 3100)"
echo "   npm run dev  # desarrollo con hot-reload"
echo "   npm test     # tests"
