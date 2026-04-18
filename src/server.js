'use strict';

const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { port, rateLimitWindowMs, rateLimitMax, maxJsonSizeMb } = require('./config');
const logger = require('./logger');
const diffRouter = require('./routes/diff');
const healthRouter = require('./routes/health');

const app = express();

app.use(helmet());
app.use(express.json({ limit: maxJsonSizeMb }));

app.use(
  rateLimit({
    windowMs: rateLimitWindowMs,
    max: rateLimitMax,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, error: 'Too many requests, please try again later' },
  })
);

// JSON parse error handler
app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ success: false, error: 'Invalid JSON body' });
  }
  next(err);
});

app.use('/health', healthRouter);
app.use('/diff', diffRouter);

app.use((_req, res) => {
  res.status(404).json({
    success: false,
    error: 'Not found',
    endpoints: ['GET /health', 'POST /diff', 'POST /diff/summary', 'POST /diff/patch', 'POST /diff/batch'],
  });
});

// Global error handler
app.use((err, _req, res, _next) => {
  logger.error('Unhandled error', { message: err.message, stack: err.stack });
  res.status(500).json({ success: false, error: 'Internal server error' });
});

if (require.main === module) {
  app.listen(port, () => {
    logger.info(`json-diff-api running on port ${port}`);
  });
}

module.exports = app;
