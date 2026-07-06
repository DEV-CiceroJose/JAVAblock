import { describe, it, expect } from 'vitest';
import { createMemoryRepo } from '../src/repository/memoryRepo.js';

const challenge = { id: 'c1', titulo: 'T', descricao: 'D', objetivoPedagogico: 'O',
  blocosPermitidos: ['try'], regras: { obrigatorios: ['try'], proibidos: [], ordem: [], quantidadeMinima: 1 },
  dicas: ['a', 'b', 'c'], modulo: 1, ordem: 1 };

describe('memoryRepo', () => {
  it('cria e lista desafios', async () => {
    const repo = createMemoryRepo();
    await repo.createChallenge(challenge);
    const list = await repo.listChallenges();
    expect(list).toHaveLength(1);
    expect(list[0].id).toBe('c1');
  });

  it('não vaza referência mutável', async () => {
    const repo = createMemoryRepo();
    await repo.createChallenge(challenge);
    const list = await repo.listChallenges();
    list[0].titulo = 'MUTADO';
    const again = await repo.listChallenges();
    expect(again[0].titulo).toBe('T');
  });

  it('atualiza e remove', async () => {
    const repo = createMemoryRepo();
    await repo.createChallenge(challenge);
    const up = await repo.updateChallenge('c1', { titulo: 'Novo' });
    expect(up.titulo).toBe('Novo');
    expect(await repo.deleteChallenge('c1')).toBe(true);
    expect(await repo.getChallengeById('c1')).toBeNull();
  });

  it('incrementa xp do grupo e adiciona submission', async () => {
    const repo = createMemoryRepo({ groups: [{ nome: 'A', xp: 10 }] });
    await repo.incrementGroupXp('A', 5);
    const groups = await repo.listGroups();
    expect(groups.find((g) => g.nome === 'A').xp).toBe(15);
    await repo.addSubmission({ grupo: 'A', challengeId: 'c1', xp: 5, acertou: true });
    expect(await repo.listSubmissions()).toHaveLength(1);
  });

  it('incrementGroupXp cria grupo inexistente', async () => {
    const repo = createMemoryRepo();
    await repo.incrementGroupXp('Novo', 7);
    expect((await repo.listGroups()).find((g) => g.nome === 'Novo').xp).toBe(7);
  });
});
