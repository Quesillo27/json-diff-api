'use strict';

const { Router } = require('express');
const { version } = require('../../package.json');

const router = Router();
const startTime = Date.now();

router.get('/', (_req, res) => {
  const uptimeSeconds = Math.floor((Date.now() - startTime) / 1000);
  const mem = process.memoryUsage();

  res.json({
    status: 'ok',
    service: 'json-diff-api',
    version,
    uptime: uptimeSeconds,
    memory: {
      heapUsedMb: Math.round(mem.heapUsed / 1024 / 1024),
      heapTotalMb: Math.round(mem.heapTotal / 1024 / 1024),
    },
  });
});

module.exports = router;
