import { describe, it, expect } from 'vitest';
import { requireAdmin } from '../src/middleware/auth.js';

function fakeRes() {
  return { statusCode: 0, body: null, status(c) { this.statusCode = c; return this; }, json(b) { this.body = b; return this; } };
}

describe('requireAdmin', () => {
  it('chama next com token correto', () => {
    const mw = requireAdmin('segredo');
    let called = false;
    mw({ headers: { 'x-admin-token': 'segredo' } }, fakeRes(), () => { called = true; });
    expect(called).toBe(true);
  });
  it('401 com token errado', () => {
    const mw = requireAdmin('segredo');
    const res = fakeRes();
    let called = false;
    mw({ headers: { 'x-admin-token': 'errado' } }, res, () => { called = true; });
    expect(called).toBe(false);
    expect(res.statusCode).toBe(401);
  });
  it('401 sem token', () => {
    const mw = requireAdmin('segredo');
    const res = fakeRes();
    mw({ headers: {} }, res, () => {});
    expect(res.statusCode).toBe(401);
  });
});
