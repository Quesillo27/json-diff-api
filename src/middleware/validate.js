'use strict';

function validateDiffBody(req, res, next) {
  const { original, modified, options } = req.body;

  if (original === undefined || modified === undefined) {
    return res.status(400).json({
      success: false,
      error: 'Both "original" and "modified" fields are required',
    });
  }

  if (options !== undefined && typeof options !== 'object') {
    return res.status(400).json({
      success: false,
      error: '"options" must be an object',
    });
  }

  if (options?.ignoreKeys !== undefined && !Array.isArray(options.ignoreKeys)) {
    return res.status(400).json({
      success: false,
      error: '"options.ignoreKeys" must be an array of strings',
    });
  }

  next();
}

function validateBatchBody(req, res, next) {
  const { pairs } = req.body;

  if (!Array.isArray(pairs) || pairs.length === 0) {
    return res.status(400).json({
      success: false,
      error: '"pairs" must be a non-empty array',
    });
  }

  next();
}

module.exports = { validateDiffBody, validateBatchBody };
