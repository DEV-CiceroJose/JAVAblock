// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import RequireProfessorAuth from '../RequireProfessorAuth.jsx';
import { ProfessorAuthProvider } from '../ProfessorAuthProvider.jsx';

beforeEach(() => {
  sessionStorage.clear();
});

function renderProtected(initialEntry) {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <ProfessorAuthProvider>
        <Routes>
          <Route path="/professor" element={<div>Tela de login</div>} />
          <Route
            path="/professor/desafios"
            element={
              <RequireProfessorAuth>
                <div>Conteúdo protegido</div>
              </RequireProfessorAuth>
            }
          />
        </Routes>
      </ProfessorAuthProvider>
    </MemoryRouter>
  );
}

describe('RequireProfessorAuth', () => {
  it('redireciona para /professor quando não autenticado', () => {
    renderProtected('/professor/desafios');
    expect(screen.getByText('Tela de login')).toBeInTheDocument();
    expect(screen.queryByText('Conteúdo protegido')).not.toBeInTheDocument();
  });

  it('mostra o conteúdo protegido quando já autenticado (token salvo)', () => {
    sessionStorage.setItem('javablocks_professor_token', 'valido');
    renderProtected('/professor/desafios');
    expect(screen.getByText('Conteúdo protegido')).toBeInTheDocument();
  });
});
