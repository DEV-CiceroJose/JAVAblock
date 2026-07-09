// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { ChallengeProvider, useChallenge } from '../ChallengeContext.jsx';

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
