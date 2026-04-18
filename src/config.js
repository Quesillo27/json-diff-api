'use strict';

module.exports = {
  port: parseInt(process.env.PORT, 10) || 3100,
  rateLimitWindowMs: 60 * 1000,
  rateLimitMax: 100,
  maxJsonSizeMb: '10mb',
  batchMaxItems: 20,
};
