'use strict';

/**
 * Deep JSON differ — compares two objects and returns structured differences.
 */

const TYPES = {
  ADDED: 'added',
  REMOVED: 'removed',
  CHANGED: 'changed',
  UNCHANGED: 'unchanged',
  TYPE_CHANGED: 'type_changed',
};

function typeOf(val) {
  if (val === null) return 'null';
  if (Array.isArray(val)) return 'array';
  return typeof val;
}

function isPrimitive(val) {
  const t = typeOf(val);
  return t !== 'object' && t !== 'array';
}

/**
 * Recursively diff two values at a given path.
 * @param {*} a - left value
 * @param {*} b - right value
 * @param {string} path - dot-notation path
 * @param {string[]} ignoreKeys - keys to skip at any level
 * @returns {object[]} array of diff entries
 */
function diffValues(a, b, path, ignoreKeys) {
  const typeA = typeOf(a);
  const typeB = typeOf(b);

  // Type mismatch
  if (typeA !== typeB) {
    return [{
      path,
      type: TYPES.TYPE_CHANGED,
      from: { type: typeA, value: a },
      to: { type: typeB, value: b },
    }];
  }

  // Primitives / null
  if (isPrimitive(a)) {
    if (a === b) return [];
    return [{
      path,
      type: TYPES.CHANGED,
      from: a,
      to: b,
    }];
  }

  // Arrays
  if (typeA === 'array') {
    return diffArrays(a, b, path, ignoreKeys);
  }

  // Objects
  return diffObjects(a, b, path, ignoreKeys);
}

function diffObjects(a, b, path, ignoreKeys) {
  const diffs = [];
  const allKeys = new Set([...Object.keys(a), ...Object.keys(b)]);

  for (const key of allKeys) {
    if (ignoreKeys.includes(key)) continue;

    const childPath = path ? `${path}.${key}` : key;

    if (!(key in a)) {
      diffs.push({ path: childPath, type: TYPES.ADDED, value: b[key] });
    } else if (!(key in b)) {
      diffs.push({ path: childPath, type: TYPES.REMOVED, value: a[key] });
    } else {
      diffs.push(...diffValues(a[key], b[key], childPath, ignoreKeys));
    }
  }

  return diffs;
}

function diffArrays(a, b, path, ignoreKeys) {
  const diffs = [];
  const maxLen = Math.max(a.length, b.length);

  for (let i = 0; i < maxLen; i++) {
    const childPath = `${path}[${i}]`;

    if (i >= a.length) {
      diffs.push({ path: childPath, type: TYPES.ADDED, value: b[i] });
    } else if (i >= b.length) {
      diffs.push({ path: childPath, type: TYPES.REMOVED, value: a[i] });
    } else {
      diffs.push(...diffValues(a[i], b[i], childPath, ignoreKeys));
    }
  }

  return diffs;
}

/**
 * Main diff function.
 * @param {object} a - original JSON object
 * @param {object} b - modified JSON object
 * @param {object} options
 * @param {string[]} [options.ignoreKeys=[]] - keys to ignore
 * @returns {{ diffs: object[], summary: object, identical: boolean }}
 */
function diff(a, b, options = {}) {
  const ignoreKeys = options.ignoreKeys || [];

  if (typeof a !== 'object' || a === null || typeof b !== 'object' || b === null) {
    throw new Error('Both inputs must be non-null objects or arrays');
  }

  const diffs = diffValues(a, b, '', ignoreKeys);

  const summary = {
    total: diffs.length,
    added: diffs.filter(d => d.type === TYPES.ADDED).length,
    removed: diffs.filter(d => d.type === TYPES.REMOVED).length,
    changed: diffs.filter(d => d.type === TYPES.CHANGED || d.type === TYPES.TYPE_CHANGED).length,
  };

  return {
    identical: diffs.length === 0,
    summary,
    diffs,
  };
}

module.exports = { diff, TYPES };
