.PHONY: dev start test build docker lint

dev:
	npm run dev

start:
	npm start

test:
	NODE_ENV=test npm test

build:
	npm ci --omit=dev

docker:
	docker build -t json-diff-api .

lint:
	@node --check src/server.js src/differ.js src/config.js src/logger.js \
	  src/middleware/validate.js src/routes/diff.js src/routes/health.js && echo "Syntax OK"
