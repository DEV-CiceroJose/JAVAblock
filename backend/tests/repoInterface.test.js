import { describe, it, expect } from 'vitest';
import { createMemoryRepo } from '../src/repository/memoryRepo.js';
import { createFirestoreRepo } from '../src/repository/firestoreRepo.js';

// db fake: só precisa existir para o factory montar o objeto.
const fakeDb = { collection: () => ({ doc: () => ({}), get: async () => ({ docs: [] }) }) };

describe('conformidade de interface do repository', () => {
  it('firestoreRepo expõe os mesmos métodos do memoryRepo', () => {
    const mem = createMemoryRepo();
    const fs = createFirestoreRepo(fakeDb);
    const memMethods = Object.keys(mem).sort();
    const fsMethods = Object.keys(fs).sort();
    expect(fsMethods).toEqual(memMethods);
    for (const m of memMethods) expect(typeof fs[m]).toBe('function');
  });
});
