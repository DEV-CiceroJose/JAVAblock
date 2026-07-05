// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useLocalStorage } from '../useLocalStorage.js';

describe('useLocalStorage', () => {
  it('persiste valor', () => {
    const { result } = renderHook(() => useLocalStorage('k', 1));
    act(() => result.current[1](5));
    expect(JSON.parse(localStorage.getItem('k'))).toBe(5);
  });
});
