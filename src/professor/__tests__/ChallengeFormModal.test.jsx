// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ChallengeFormModal from '../ChallengeFormModal.jsx';
import { ProfessorAuthProvider } from '../ProfessorAuthProvider.jsx';

vi.mock('../../services/adminApi.js', async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, createChallenge: vi.fn(), updateChallenge: vi.fn() };
});
import { createChallenge } from '../../services/adminApi.js';

beforeEach(() => {
  sessionStorage.clear();
  vi.clearAllMocks();
});

function renderModal(props = {}) {
  return render(
    <ProfessorAuthProvider>
      <ChallengeFormModal open challenge={null} onClose={() => {}} onSaved={() => {}} {...props} />
    </ProfessorAuthProvider>
  );
}

describe('ChallengeFormModal', () => {
  it('não envia e mostra erros quando campos obrigatórios estão vazios', () => {
    renderModal();
    fireEvent.click(screen.getByText('Salvar'));
    expect(screen.getByText(/id é obrigatório/i)).toBeInTheDocument();
    expect(createChallenge).not.toHaveBeenCalled();
  });
});
