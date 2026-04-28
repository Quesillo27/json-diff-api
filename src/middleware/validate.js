'use strict';

function validateDiffPayload(body) {
  const { original, modified, options } = body;

  if (original === undefined || modified === undefined) {
    return 'Both "original" and "modified" fields are required';
  }

  if (options !== undefined && (options === null || Array.isArray(options) || typeof options !== 'object')) {
    return '"options" must be an object';
  }

  if (options?.ignoreKeys !== undefined) {
    if (!Array.isArray(options.ignoreKeys) || options.ignoreKeys.some(key => typeof key !== 'string')) {
      return '"options.ignoreKeys" must be an array of strings';
    }
  }

  return null;
}

function validateDiffBody(req, res, next) {
  const error = validateDiffPayload(req.body);

  if (error) {
    return res.status(400).json({
      success: false,
      error,
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

module.exports = { validateDiffBody, validateBatchBody, validateDiffPayload };
