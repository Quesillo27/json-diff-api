'use strict';

const express = require('express');
const { diff } = require('./differ');

const app = express();
const PORT = process.env.PORT || 3100;

app.use(express.json({ limit: '10mb' }));

// ── Health ─────────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'json-diff-api', version: '1.0.0' });
});

// ── POST /diff ─────────────────────────────────────────────────────────────
// Body: { "original": {...}, "modified": {...}, "options": { "ignoreKeys": [] } }
app.post('/diff', (req, res) => {
  const { original, modified, options } = req.body;

  if (original === undefined || modified === undefined) {
    return res.status(400).json({
      error: 'Both "original" and "modified" fields are required',
    });
  }

  try {
    const result = diff(original, modified, options || {});
    return res.json(result);
  } catch (err) {
    return res.status(422).json({ error: err.message });
  }
});

// ── POST /diff/summary ─────────────────────────────────────────────────────
// Same as /diff but returns only the summary (no diff array)
app.post('/diff/summary', (req, res) => {
  const { original, modified, options } = req.body;

  if (original === undefined || modified === undefined) {
    return res.status(400).json({
      error: 'Both "original" and "modified" fields are required',
    });
  }

  try {
    const { identical, summary } = diff(original, modified, options || {});
    return res.json({ identical, summary });
  } catch (err) {
    return res.status(422).json({ error: err.message });
  }
});

// ── POST /diff/patch ───────────────────────────────────────────────────────
// Returns a JSON Patch (RFC 6902 subset) representation of the diffs
app.post('/diff/patch', (req, res) => {
  const { original, modified, options } = req.body;

  if (original === undefined || modified === undefined) {
    return res.status(400).json({
      error: 'Both "original" and "modified" fields are required',
    });
  }

  try {
    const { diffs } = diff(original, modified, options || {});

    const patch = diffs.map(d => {
      const pointer = '/' + d.path.replace(/\./g, '/').replace(/\[(\d+)\]/g, '/$1');

      if (d.type === 'added') return { op: 'add', path: pointer, value: d.value };
      if (d.type === 'removed') return { op: 'remove', path: pointer };
      if (d.type === 'changed' || d.type === 'type_changed') {
        return { op: 'replace', path: pointer, value: d.to !== undefined ? d.to : d.to };
      }
      return null;
    }).filter(Boolean);

    return res.json({ patch });
  } catch (err) {
    return res.status(422).json({ error: err.message });
  }
});

// ── 404 ────────────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({
    error: 'Not found',
    endpoints: ['GET /health', 'POST /diff', 'POST /diff/summary', 'POST /diff/patch'],
  });
});

// ── Start ──────────────────────────────────────────────────────────────────
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`json-diff-api running on port ${PORT}`);
  });
}

module.exports = app;
