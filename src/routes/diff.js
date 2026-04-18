'use strict';

const { Router } = require('express');
const { diff } = require('../differ');
const { validateDiffBody, validateBatchBody } = require('../middleware/validate');
const { batchMaxItems } = require('../config');
const logger = require('../logger');

const router = Router();

// POST /diff — full diff with all differences
router.post('/', validateDiffBody, (req, res) => {
  const { original, modified, options } = req.body;
  try {
    const result = diff(original, modified, options || {});
    return res.json({ success: true, data: result });
  } catch (err) {
    logger.warn('diff error', { message: err.message });
    return res.status(422).json({ success: false, error: err.message });
  }
});

// POST /diff/summary — totals only, no diff array
router.post('/summary', validateDiffBody, (req, res) => {
  const { original, modified, options } = req.body;
  try {
    const { identical, summary } = diff(original, modified, options || {});
    return res.json({ success: true, data: { identical, summary } });
  } catch (err) {
    logger.warn('diff/summary error', { message: err.message });
    return res.status(422).json({ success: false, error: err.message });
  }
});

// POST /diff/patch — RFC 6902 JSON Patch representation
router.post('/patch', validateDiffBody, (req, res) => {
  const { original, modified, options } = req.body;
  try {
    const { diffs } = diff(original, modified, options || {});

    const patch = diffs.map(d => {
      const pointer = '/' + d.path.replace(/\./g, '/').replace(/\[(\d+)\]/g, '/$1');

      if (d.type === 'added') return { op: 'add', path: pointer, value: d.value };
      if (d.type === 'removed') return { op: 'remove', path: pointer };
      // Bug fix: type_changed stores values as { type, value } — extract .value for the patch
      if (d.type === 'changed') return { op: 'replace', path: pointer, value: d.to };
      if (d.type === 'type_changed') return { op: 'replace', path: pointer, value: d.to.value };
      return null;
    }).filter(Boolean);

    return res.json({ success: true, data: { patch } });
  } catch (err) {
    logger.warn('diff/patch error', { message: err.message });
    return res.status(422).json({ success: false, error: err.message });
  }
});

// POST /diff/batch — compare up to batchMaxItems JSON pairs in a single request
router.post('/batch', validateBatchBody, (req, res) => {
  const { pairs } = req.body;

  if (pairs.length > batchMaxItems) {
    return res.status(400).json({
      success: false,
      error: `Batch limit is ${batchMaxItems} pairs per request`,
    });
  }

  const results = pairs.map((item, index) => {
    const { original, modified, options } = item;
    if (original === undefined || modified === undefined) {
      return { index, success: false, error: 'Both "original" and "modified" are required' };
    }
    try {
      return { index, success: true, data: diff(original, modified, options || {}) };
    } catch (err) {
      return { index, success: false, error: err.message };
    }
  });

  return res.json({ success: true, data: results });
});

module.exports = router;
