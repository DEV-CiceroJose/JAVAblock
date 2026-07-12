import { describe, it, expect } from 'vitest';
import { createFirestoreRepo } from '../src/repository/firestoreRepo.js';

// Simula a regra real do Firestore: não aceita arrays aninhados (array dentro
// de array) em nenhum lugar do documento. Isso reproduz o erro visto contra o
// Firestore de verdade ("Property regras contains an invalid nested entity.")
// caso o repository volte a gravar regras.ordem como [[a,b], ...] sem codificar.
function hasNestedArray(value) {
  if (Array.isArray(value)) {
    return value.some(
      (item) => Array.isArray(item) || (item && typeof item === 'object' && hasNestedArray(item))
    );
  }
  if (value && typeof value === 'object') {
    return Object.values(value).some(hasNestedArray);
  }
  return false;
}

function createFakeFirestoreDb() {
  const store = {};
  return {
    collection(name) {
      store[name] = store[name] || {};
      return {
        doc(id) {
          return {
            async get() {
              const data = store[name][id];
              return { exists: data !== undefined, data: () => data };
            },
            async set(value) {
              if (hasNestedArray(value)) {
                throw new Error('3 INVALID_ARGUMENT: Property contains an invalid nested entity.');
              }
              store[name][id] = value;
            },
            async delete() {
              delete store[name][id];
            }
          };
        },
        async get() {
          const docs = Object.entries(store[name]).map(([, data]) => ({ data: () => data }));
          return { docs };
        }
      };
    }
  };
}

const baseChallenge = {
  id: 'c1',
  titulo: 'T',
  modulo: 1,
  ordem: 1,
  regras: {
    obrigatorios: ['try'],
    proibidos: [],
    ordem: [
      ['a', 'b'],
      ['c', 'd']
    ],
    quantidadeMinima: 1
  }
};

describe('firestoreRepo — regras.ordem (array de pares) contra um Firestore simulado', () => {
  it('createChallenge não envia arrays aninhados e getChallengeById devolve os pares originais', async () => {
    const repo = createFirestoreRepo(createFakeFirestoreDb());
    await repo.createChallenge(baseChallenge);
    const found = await repo.getChallengeById('c1');
    expect(found.regras.ordem).toEqual([
      ['a', 'b'],
      ['c', 'd']
    ]);
  });

  it('updateChallenge preserva o formato de pares após ida e volta pelo Firestore', async () => {
    const repo = createFirestoreRepo(createFakeFirestoreDb());
    await repo.createChallenge(baseChallenge);
    const updated = await repo.updateChallenge('c1', { titulo: 'Novo' });
    expect(updated.regras.ordem).toEqual([
      ['a', 'b'],
      ['c', 'd']
    ]);
    const found = await repo.getChallengeById('c1');
    expect(found.regras.ordem).toEqual([
      ['a', 'b'],
      ['c', 'd']
    ]);
  });

  it('listChallenges devolve os pares no formato original para múltiplos desafios', async () => {
    const repo = createFirestoreRepo(createFakeFirestoreDb());
    await repo.createChallenge(baseChallenge);
    await repo.createChallenge({ ...baseChallenge, id: 'c2', ordem: 2 });
    const list = await repo.listChallenges();
    expect(list).toHaveLength(2);
    for (const c of list) {
      expect(c.regras.ordem).toEqual([
        ['a', 'b'],
        ['c', 'd']
      ]);
    }
  });
});
