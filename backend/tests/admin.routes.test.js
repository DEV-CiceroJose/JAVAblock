import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { createMemoryRepo } from '../src/repository/memoryRepo.js';

const TOKEN = 'segredo';
const challenge = { id: 'c1', titulo: 'T', descricao: 'D', objetivoPedagogico: 'O',
  blocosPermitidos: ['try'], regras: { obrigatorios: ['try'], proibidos: [], ordem: [], quantidadeMinima: 1 },
  dicas: ['a', 'b', 'c'], modulo: 1, ordem: 1 };

function app(seed) {
  return createApp(createMemoryRepo(seed), { adminToken: TOKEN });
}
const auth = (req) => req.set('x-admin-token', TOKEN);

describe('rotas admin', () => {
  it('bloqueia sem token', async () => {
    const res = await request(app()).get('/api/admin/challenges');
    expect(res.status).toBe(401);
  });
  it('verify aceita token correto', async () => {
    const res = await auth(request(app()).post('/api/admin/verify'));
    expect(res.status).toBe(200);
  });
  it('cria desafio válido (201) e recusa inválido (400)', async () => {
    const a = app();
    const ok = await auth(request(a).post('/api/admin/challenges')).send(challenge);
    expect(ok.status).toBe(201);
    const bad = await auth(request(a).post('/api/admin/challenges')).send({ ...challenge, id: '' });
    expect(bad.status).toBe(400);
  });
  it('update de inexistente 404', async () => {
    const res = await auth(request(app()).put('/api/admin/challenges/nope')).send({ titulo: 'x' });
    expect(res.status).toBe(404);
  });
  it('delete remove (200)', async () => {
    const res = await auth(request(app({ challenges: [challenge] })).delete('/api/admin/challenges/c1'));
    expect(res.status).toBe(200);
  });
  it('PUT /config faz merge', async () => {
    const res = await auth(request(app()).put('/api/admin/config')).send({ maxDicas: 5 });
    expect(res.status).toBe(200);
    expect(res.body.maxDicas).toBe(5);
  });
  it('GET /dashboard agrega', async () => {
    const seed = { groups: [{ nome: 'A', xp: 10 }],
      submissions: [{ grupo: 'A', categoria: 'excecoes', dicasUsadas: 1, tempoSegundos: 100, acertou: true }] };
    const res = await auth(request(app(seed)).get('/api/admin/dashboard'));
    expect(res.status).toBe(200);
    expect(res.body.totalConcluidos).toBe(1);
    expect(res.body.porCategoria.excecoes).toBe(100);
  });
});
