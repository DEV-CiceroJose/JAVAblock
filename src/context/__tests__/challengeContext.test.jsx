// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { ChallengeProvider, useChallenge } from '../ChallengeContext.jsx';

beforeEach(() => {
  localStorage.clear();
});

describe('addBlockAt (inserção posicional de bloco)', () => {
  it('insere o bloco no índice indicado', () => {
    const { result } = renderHook(() => useChallenge(), { wrapper: ChallengeProvider });
    act(() => result.current.addBlock('print'));
    act(() => result.current.addBlock('try'));
    act(() => result.current.addBlockAt('if', 1));
    expect(result.current.instances.map((i) => i.blockId)).toEqual(['print', 'if', 'try']);
  });

  it('índice fora do intervalo faz append no fim', () => {
    const { result } = renderHook(() => useChallenge(), { wrapper: ChallengeProvider });
    act(() => result.current.addBlock('print'));
    act(() => result.current.addBlockAt('try', 99));
    expect(result.current.instances.map((i) => i.blockId)).toEqual(['print', 'try']);
  });

  it('insere no início com índice 0', () => {
    const { result } = renderHook(() => useChallenge(), { wrapper: ChallengeProvider });
    act(() => result.current.addBlock('print'));
    act(() => result.current.addBlockAt('try', 0));
    expect(result.current.instances.map((i) => i.blockId)).toEqual(['try', 'print']);
  });
});

describe('persistência da montagem (localStorage)', () => {
  it('restaura os blocos após remount (simula reload da página)', () => {
    const { result, unmount } = renderHook(() => useChallenge(), { wrapper: ChallengeProvider });
    act(() => result.current.addBlock('print'));
    unmount();

    const { result: result2 } = renderHook(() => useChallenge(), { wrapper: ChallengeProvider });
    expect(result2.current.instances.map((i) => i.blockId)).toEqual(['print']);
  });

  it('resetar o desafio também limpa o que foi salvo', () => {
    const { result, unmount } = renderHook(() => useChallenge(), { wrapper: ChallengeProvider });
    act(() => result.current.addBlock('print'));
    act(() => result.current.reset());
    unmount();

    const { result: result2 } = renderHook(() => useChallenge(), { wrapper: ChallengeProvider });
    expect(result2.current.instances).toEqual([]);
  });
});

describe('duplicateInstance (duplicar bloco)', () => {
  it('duplica o bloco logo depois do original, preservando os campos', () => {
    const { result } = renderHook(() => useChallenge(), { wrapper: ChallengeProvider });
    act(() => result.current.addBlock('print'));
    const originalId = result.current.instances[0].instanceId;
    act(() => result.current.updateField(originalId, 'text', '"Oi"'));
    act(() => result.current.duplicateInstance(originalId));

    expect(result.current.instances).toHaveLength(2);
    expect(result.current.instances[0].instanceId).toBe(originalId);
    expect(result.current.instances[1].blockId).toBe('print');
    expect(result.current.instances[1].fields.text).toBe('"Oi"');
    expect(result.current.instances[1].instanceId).not.toBe(originalId);
  });

  it('duplicar um bloco dentro de um container insere ao lado do original', () => {
    const { result } = renderHook(() => useChallenge(), { wrapper: ChallengeProvider });
    act(() => result.current.addBlock('try'));
    const tryId = result.current.instances[0].instanceId;
    act(() => result.current.addChildBlock(tryId, 'print'));
    const childId = result.current.instances[0].children[0].instanceId;
    act(() => result.current.duplicateInstance(childId));

    expect(result.current.instances[0].children).toHaveLength(2);
    expect(result.current.instances[0].children[0].instanceId).toBe(childId);
    expect(result.current.instances[0].children[1].blockId).toBe('print');
  });

  it('id inexistente não altera nada', () => {
    const { result } = renderHook(() => useChallenge(), { wrapper: ChallengeProvider });
    act(() => result.current.addBlock('print'));
    act(() => result.current.duplicateInstance('nao-existe'));
    expect(result.current.instances).toHaveLength(1);
  });
});
