// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { ProfessorAuthProvider, useProfessorAuth } from '../ProfessorAuthProvider.jsx';

vi.mock('../../services/adminApi.js', () => ({
  verifyAdminToken: vi.fn()
}));
import { verifyAdminToken } from '../../services/adminApi.js';

beforeEach(() => {
  sessionStorage.clear();
  vi.clearAllMocks();
});

describe('ProfessorAuthProvider', () => {
  it('começa não autenticado sem token salvo', () => {
    const { result } = renderHook(() => useProfessorAuth(), { wrapper: ProfessorAuthProvider });
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('login com token válido autentica e persiste em sessionStorage', async () => {
    verifyAdminToken.mockResolvedValue({ ok: true });
    const { result } = renderHook(() => useProfessorAuth(), { wrapper: ProfessorAuthProvider });
    let response;
    await act(async () => {
      response = await result.current.login('meu-token');
    });
    expect(response.ok).toBe(true);
    expect(result.current.isAuthenticated).toBe(true);
    expect(sessionStorage.getItem('javablocks_professor_token')).toBe('meu-token');
  });

  it('login com token inválido não autentica e devolve o erro', async () => {
    verifyAdminToken.mockResolvedValue({ ok: false, error: 'Token inválido.' });
    const { result } = renderHook(() => useProfessorAuth(), { wrapper: ProfessorAuthProvider });
    let response;
    await act(async () => {
      response = await result.current.login('errado');
    });
    expect(response.ok).toBe(false);
    expect(response.error).toBe('Token inválido.');
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('restaura sessão de um token salvo em sessionStorage', () => {
    sessionStorage.setItem('javablocks_professor_token', 'ja-salvo');
    const { result } = renderHook(() => useProfessorAuth(), { wrapper: ProfessorAuthProvider });
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.token).toBe('ja-salvo');
  });

  it('logout limpa o token e a sessão', async () => {
    verifyAdminToken.mockResolvedValue({ ok: true });
    const { result } = renderHook(() => useProfessorAuth(), { wrapper: ProfessorAuthProvider });
    await act(async () => {
      await result.current.login('meu-token');
    });
    act(() => result.current.logout());
    expect(result.current.isAuthenticated).toBe(false);
    expect(sessionStorage.getItem('javablocks_professor_token')).toBeNull();
  });
});
