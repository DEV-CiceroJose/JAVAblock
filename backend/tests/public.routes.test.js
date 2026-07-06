import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { createMemoryRepo } from '../src/repository/memoryRepo.js';

const challenge = { id: 'c1', titulo: 'T', descricao: 'D', objetivoPedagogico: 'O',
  blocosPermitidos: ['try'], regras: { obrigatorios: ['try'], proibidos: [], ordem: [], quantidadeMinima: 1 },
  dicas: ['a', 'b', 'c'], modulo: 1, ordem: 1 };

function app() {
  return createApp(createMemoryRepo({ challenges: [challenge], groups: [{ nome: 'A', xp: 0 }] }));
}

describe('rotas públicas', () => {
  it('GET /api/challenges lista', async () => {
    const res = await request(app()).get('/api/challenges');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
  });
  it('GET /api/challenges/:id devolve 404 se não existe', async () => {
    const res = await request(app()).get('/api/challenges/nope');
    expect(res.status).toBe(404);
  });
  it('GET /api/config expõe só campos do aluno', async () => {
    const res = await request(app()).get('/api/config');
    expect(res.status).toBe(200);
    expect(res.body.maxDicas).toBe(3);
    expect(res.body).not.toHaveProperty('penalidadeProibido');
  });
  it('GET /api/ranking ordena por xp', async () => {
    const a = createApp(createMemoryRepo({ groups: [{ nome: 'A', xp: 5 }, { nome: 'B', xp: 9 }] }));
    const res = await request(a).get('/api/ranking');
    expect(res.body[0].nome).toBe('B');
  });
  it('POST /api/results aceita válido (202) e incrementa', async () => {
    const a = app();
    const res = await request(a).post('/api/results')
      .send({ grupo: 'A', challengeId: 'c1', xp: 50, dicasUsadas: 0, tentativas: 1, tempoSegundos: 10, acertou: true });
    expect(res.status).toBe(202);
    const rank = await request(a).get('/api/ranking');
    expect(rank.body.find((g) => g.nome === 'A').xp).toBe(50);
  });
  it('POST /api/results rejeita inválido (400)', async () => {
    const res = await request(app()).post('/api/results').send({ grupo: '' });
    expect(res.status).toBe(400);
  });
});
