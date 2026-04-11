'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { diff } = require('../src/differ');

// ── Identical ────────────────────────────────────────────────────────────────
test('identical objects return no diffs', () => {
  const result = diff({ a: 1, b: 'hello' }, { a: 1, b: 'hello' });
  assert.equal(result.identical, true);
  assert.equal(result.diffs.length, 0);
  assert.deepEqual(result.summary, { total: 0, added: 0, removed: 0, changed: 0 });
});

// ── Added ────────────────────────────────────────────────────────────────────
test('detects added keys', () => {
  const result = diff({ a: 1 }, { a: 1, b: 2 });
  assert.equal(result.identical, false);
  assert.equal(result.summary.added, 1);
  const d = result.diffs.find(x => x.path === 'b');
  assert.equal(d.type, 'added');
  assert.equal(d.value, 2);
});

// ── Removed ──────────────────────────────────────────────────────────────────
test('detects removed keys', () => {
  const result = diff({ a: 1, b: 2 }, { a: 1 });
  assert.equal(result.summary.removed, 1);
  const d = result.diffs.find(x => x.path === 'b');
  assert.equal(d.type, 'removed');
});

// ── Changed ──────────────────────────────────────────────────────────────────
test('detects changed values', () => {
  const result = diff({ a: 1 }, { a: 99 });
  assert.equal(result.summary.changed, 1);
  const d = result.diffs.find(x => x.path === 'a');
  assert.equal(d.type, 'changed');
  assert.equal(d.from, 1);
  assert.equal(d.to, 99);
});

// ── Type change ───────────────────────────────────────────────────────────────
test('detects type changes', () => {
  const result = diff({ a: 1 }, { a: '1' });
  assert.equal(result.summary.changed, 1);
  const d = result.diffs[0];
  assert.equal(d.type, 'type_changed');
  assert.equal(d.from.type, 'number');
  assert.equal(d.to.type, 'string');
});

// ── Nested ────────────────────────────────────────────────────────────────────
test('diffs nested objects with dot-notation paths', () => {
  const a = { user: { name: 'Alice', age: 30 } };
  const b = { user: { name: 'Bob', age: 30 } };
  const result = diff(a, b);
  assert.equal(result.diffs.length, 1);
  assert.equal(result.diffs[0].path, 'user.name');
  assert.equal(result.diffs[0].from, 'Alice');
  assert.equal(result.diffs[0].to, 'Bob');
});

// ── Arrays ────────────────────────────────────────────────────────────────────
test('diffs arrays by index', () => {
  const result = diff({ arr: [1, 2, 3] }, { arr: [1, 2, 99] });
  assert.equal(result.diffs.length, 1);
  assert.equal(result.diffs[0].path, 'arr[2]');
  assert.equal(result.diffs[0].from, 3);
  assert.equal(result.diffs[0].to, 99);
});

test('detects added array elements', () => {
  const result = diff({ arr: [1] }, { arr: [1, 2] });
  assert.equal(result.summary.added, 1);
  assert.equal(result.diffs[0].path, 'arr[1]');
});

test('detects removed array elements', () => {
  const result = diff({ arr: [1, 2] }, { arr: [1] });
  assert.equal(result.summary.removed, 1);
});

// ── ignoreKeys ────────────────────────────────────────────────────────────────
test('ignores specified keys', () => {
  const a = { a: 1, updatedAt: '2024-01-01', b: 2 };
  const b = { a: 1, updatedAt: '2025-01-01', b: 99 };
  const result = diff(a, b, { ignoreKeys: ['updatedAt'] });
  assert.equal(result.diffs.length, 1);
  assert.equal(result.diffs[0].path, 'b');
});

// ── Null values ───────────────────────────────────────────────────────────────
test('handles null values correctly', () => {
  const result = diff({ a: null }, { a: null });
  assert.equal(result.identical, true);
});

test('detects null to value change', () => {
  const result = diff({ a: null }, { a: 42 });
  assert.equal(result.diffs[0].type, 'type_changed');
});

// ── Error handling ────────────────────────────────────────────────────────────
test('throws if inputs are not objects', () => {
  assert.throws(() => diff('string', {}), /must be non-null objects/);
  assert.throws(() => diff({}, null), /must be non-null objects/);
});

// ── Summary counts ────────────────────────────────────────────────────────────
test('summary counts are accurate', () => {
  const a = { keep: 1, change: 2, remove: 3 };
  const b = { keep: 1, change: 99, add: 4 };
  const result = diff(a, b);
  assert.equal(result.summary.added, 1);
  assert.equal(result.summary.removed, 1);
  assert.equal(result.summary.changed, 1);
  assert.equal(result.summary.total, 3);
});
