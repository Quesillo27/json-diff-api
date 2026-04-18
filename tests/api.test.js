'use strict';

const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const app = require('../src/server');

let server;
let baseUrl;

before(async () => {
  await new Promise(resolve => {
    server = app.listen(0, () => {
      baseUrl = `http://localhost:${server.address().port}`;
      resolve();
    });
  });
});

after(async () => {
  await new Promise(resolve => server.close(resolve));
});

async function request(method, path, body) {
  const url = new URL(path, baseUrl);
  const options = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  return new Promise((resolve, reject) => {
    const req = http.request(url, options, res => {
      let data = '';
      res.on('data', chunk => (data += chunk));
      res.on('end', () => resolve({ status: res.statusCode, body: JSON.parse(data) }));
    });
    req.on('error', reject);
    if (body !== undefined) req.write(JSON.stringify(body));
    req.end();
  });
}

// ── /health ─────────────────────────────────────────────────────────────────

test('GET /health returns status ok with uptime and version', async () => {
  const { status, body } = await request('GET', '/health');
  assert.equal(status, 200);
  assert.equal(body.status, 'ok');
  assert.equal(body.service, 'json-diff-api');
  assert.ok(typeof body.version === 'string');
  assert.ok(typeof body.uptime === 'number');
  assert.ok(body.memory?.heapUsedMb >= 0);
});

// ── POST /diff ───────────────────────────────────────────────────────────────

test('POST /diff returns full diff for changed objects', async () => {
  const { status, body } = await request('POST', '/diff', {
    original: { name: 'Alice', age: 30 },
    modified: { name: 'Bob', age: 30, role: 'admin' },
  });
  assert.equal(status, 200);
  assert.equal(body.success, true);
  assert.equal(body.data.identical, false);
  assert.equal(body.data.summary.changed, 1);
  assert.equal(body.data.summary.added, 1);
  assert.ok(Array.isArray(body.data.diffs));
});

test('POST /diff returns identical:true for equal objects', async () => {
  const { status, body } = await request('POST', '/diff', {
    original: { a: 1 },
    modified: { a: 1 },
  });
  assert.equal(status, 200);
  assert.equal(body.data.identical, true);
  assert.equal(body.data.diffs.length, 0);
});

test('POST /diff returns 400 when original is missing', async () => {
  const { status, body } = await request('POST', '/diff', { modified: { a: 1 } });
  assert.equal(status, 400);
  assert.equal(body.success, false);
  assert.ok(body.error.includes('"original"'));
});

test('POST /diff returns 400 when modified is missing', async () => {
  const { status, body } = await request('POST', '/diff', { original: { a: 1 } });
  assert.equal(status, 400);
  assert.equal(body.success, false);
});

test('POST /diff returns 422 when inputs are primitives', async () => {
  const { status, body } = await request('POST', '/diff', {
    original: 'string',
    modified: {},
  });
  assert.equal(status, 422);
  assert.equal(body.success, false);
  assert.ok(body.error.includes('non-null objects'));
});

test('POST /diff respects ignoreKeys option', async () => {
  const { status, body } = await request('POST', '/diff', {
    original: { a: 1, ts: '2024-01-01' },
    modified: { a: 1, ts: '2025-01-01' },
    options: { ignoreKeys: ['ts'] },
  });
  assert.equal(status, 200);
  assert.equal(body.data.identical, true);
});

test('POST /diff detects nested differences with dot-notation paths', async () => {
  const { status, body } = await request('POST', '/diff', {
    original: { user: { name: 'Alice' } },
    modified: { user: { name: 'Bob' } },
  });
  assert.equal(status, 200);
  assert.equal(body.data.diffs[0].path, 'user.name');
});

test('POST /diff returns 400 for invalid options type', async () => {
  const { status, body } = await request('POST', '/diff', {
    original: { a: 1 },
    modified: { a: 2 },
    options: 'not-an-object',
  });
  assert.equal(status, 400);
  assert.equal(body.success, false);
});

// ── POST /diff/summary ───────────────────────────────────────────────────────

test('POST /diff/summary returns totals without diffs array', async () => {
  const { status, body } = await request('POST', '/diff/summary', {
    original: { a: 1, b: 2 },
    modified: { a: 99, c: 3 },
  });
  assert.equal(status, 200);
  assert.equal(body.success, true);
  assert.ok(body.data.summary !== undefined);
  assert.ok(body.data.diffs === undefined);
  assert.equal(body.data.summary.changed, 1);
  assert.equal(body.data.summary.removed, 1);
  assert.equal(body.data.summary.added, 1);
});

test('POST /diff/summary returns 400 when body is missing fields', async () => {
  const { status, body } = await request('POST', '/diff/summary', {});
  assert.equal(status, 400);
  assert.equal(body.success, false);
});

// ── POST /diff/patch ─────────────────────────────────────────────────────────

test('POST /diff/patch returns RFC 6902 patch operations', async () => {
  const { status, body } = await request('POST', '/diff/patch', {
    original: { a: 1, b: 'hello' },
    modified: { a: 99, c: 'new' },
  });
  assert.equal(status, 200);
  assert.equal(body.success, true);
  assert.ok(Array.isArray(body.data.patch));
  const replace = body.data.patch.find(op => op.op === 'replace');
  assert.ok(replace, 'should have a replace op');
  assert.equal(replace.path, '/a');
  assert.equal(replace.value, 99);
});

test('POST /diff/patch correctly handles type_changed — bug fix', async () => {
  const { status, body } = await request('POST', '/diff/patch', {
    original: { count: 5 },
    modified: { count: '5' },
  });
  assert.equal(status, 200);
  const replace = body.data.patch.find(op => op.op === 'replace' && op.path === '/count');
  assert.ok(replace, 'should have replace op for /count');
  // Must be the actual value '5', not { type: 'string', value: '5' }
  assert.equal(replace.value, '5');
  assert.notEqual(typeof replace.value, 'object');
});

test('POST /diff/patch generates correct pointers for nested paths', async () => {
  const { status, body } = await request('POST', '/diff/patch', {
    original: { user: { name: 'Alice' } },
    modified: { user: { name: 'Bob' } },
  });
  assert.equal(status, 200);
  const op = body.data.patch[0];
  assert.equal(op.path, '/user/name');
  assert.equal(op.value, 'Bob');
});

test('POST /diff/patch generates correct pointers for array indices', async () => {
  const { status, body } = await request('POST', '/diff/patch', {
    original: { items: [1, 2, 3] },
    modified: { items: [1, 2, 99] },
  });
  assert.equal(status, 200);
  const op = body.data.patch[0];
  assert.equal(op.path, '/items/2');
  assert.equal(op.value, 99);
});

test('POST /diff/patch returns 400 when fields are missing', async () => {
  const { status, body } = await request('POST', '/diff/patch', { original: {} });
  assert.equal(status, 400);
  assert.equal(body.success, false);
});

// ── POST /diff/batch ─────────────────────────────────────────────────────────

test('POST /diff/batch compares multiple pairs and returns indexed results', async () => {
  const { status, body } = await request('POST', '/diff/batch', {
    pairs: [
      { original: { a: 1 }, modified: { a: 2 } },
      { original: { x: 'foo' }, modified: { x: 'foo' } },
    ],
  });
  assert.equal(status, 200);
  assert.equal(body.success, true);
  assert.equal(body.data.length, 2);
  assert.equal(body.data[0].index, 0);
  assert.equal(body.data[0].success, true);
  assert.equal(body.data[0].data.identical, false);
  assert.equal(body.data[1].data.identical, true);
});

test('POST /diff/batch returns per-item error for invalid pairs', async () => {
  const { status, body } = await request('POST', '/diff/batch', {
    pairs: [
      { original: { a: 1 }, modified: { a: 2 } },
      { modified: { x: 'foo' } },
    ],
  });
  assert.equal(status, 200);
  assert.equal(body.data[0].success, true);
  assert.equal(body.data[1].success, false);
  assert.ok(body.data[1].error.includes('"original"'));
});

test('POST /diff/batch returns 400 when pairs is not an array', async () => {
  const { status, body } = await request('POST', '/diff/batch', { pairs: 'not-array' });
  assert.equal(status, 400);
  assert.equal(body.success, false);
});

test('POST /diff/batch returns 400 when pairs exceeds limit', async () => {
  const pairs = Array.from({ length: 21 }, (_, i) => ({
    original: { i },
    modified: { i: i + 1 },
  }));
  const { status, body } = await request('POST', '/diff/batch', { pairs });
  assert.equal(status, 400);
  assert.equal(body.success, false);
  assert.ok(body.error.includes('limit'));
});

// ── 404 ──────────────────────────────────────────────────────────────────────

test('unknown route returns 404 with endpoints list', async () => {
  const { status, body } = await request('GET', '/nonexistent');
  assert.equal(status, 404);
  assert.equal(body.success, false);
  assert.ok(Array.isArray(body.endpoints));
});
