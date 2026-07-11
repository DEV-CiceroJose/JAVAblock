import { useCallback, useEffect, useState } from 'react';
import ProfessorLayout from './ProfessorLayout.jsx';
import { useProfessorAuth } from './ProfessorAuthProvider.jsx';
import { listChallengesAdmin, deleteChallenge, reorderChallenges } from '../services/adminApi.js';
import ChallengeFormModal from './ChallengeFormModal.jsx';
import Button from '../components/ui/Button.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';

function sortChallenges(list) {
  return [...list].sort((a, b) => a.modulo - b.modulo || a.ordem - b.ordem);
}

export default function ProfessorChallengesPage() {
  const { token } = useProfessorAuth();
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const result = await listChallengesAdmin(token);
    setLoading(false);
    if (result.ok) {
      setChallenges(result.data || []);
      setError('');
    } else {
      setError(result.error);
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  function openCreate() {
    setEditing(null);
    setModalOpen(true);
  }

  function openEdit(challenge) {
    setEditing(challenge);
    setModalOpen(true);
  }

  async function handleDelete(challenge) {
    if (!window.confirm(`Excluir o desafio "${challenge.titulo}"? Essa ação não pode ser desfeita.`)) return;
    const result = await deleteChallenge(token, challenge.id);
    if (result.ok) load();
    else setError(result.error);
  }

  async function handleMove(challenge, direction) {
    const sorted = sortChallenges(challenges);
    const index = sorted.findIndex((c) => c.id === challenge.id);
    const swapWith = direction === 'up' ? index - 1 : index + 1;
    if (swapWith < 0 || swapWith >= sorted.length) return;

    const a = sorted[index];
    const b = sorted[swapWith];
    const order = sorted.map((c) => {
      if (c.id === a.id) return { id: a.id, modulo: b.modulo, ordem: b.ordem };
      if (c.id === b.id) return { id: b.id, modulo: a.modulo, ordem: a.ordem };
      return { id: c.id, modulo: c.modulo, ordem: c.ordem };
    });
    const result = await reorderChallenges(token, order);
    if (result.ok) load();
    else setError(result.error);
  }

  function handleSaved() {
    setModalOpen(false);
    load();
  }

  const sorted = sortChallenges(challenges);

  return (
    <ProfessorLayout>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Desafios</h2>
        <Button onClick={openCreate} accent="adminAccent">Novo Desafio</Button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/40 bg-red-500/10 text-red-300 text-sm p-3 mb-4">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-slate-400 text-sm">Carregando...</p>
      ) : sorted.length === 0 ? (
        <EmptyState
          title="Nenhum desafio cadastrado ainda."
          description='Clique em "Novo Desafio" para começar.'
        />
      ) : (
        <div className="bg-base-panel border border-base-border rounded-xl overflow-hidden overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-400 border-b border-base-border">
                <th className="px-4 py-3 font-medium">Título</th>
                <th className="px-4 py-3 font-medium">Módulo</th>
                <th className="px-4 py-3 font-medium">Ordem</th>
                <th className="px-4 py-3 font-medium text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((challenge, index) => (
                <tr key={challenge.id} className="border-b border-base-border last:border-0">
                  <td className="px-4 py-3 text-slate-100">{challenge.titulo}</td>
                  <td className="px-4 py-3 text-slate-400">{challenge.modulo}</td>
                  <td className="px-4 py-3 text-slate-400">{challenge.ordem}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => handleMove(challenge, 'up')}
                        disabled={index === 0}
                        aria-label="Mover para cima"
                        className="text-slate-400 hover:text-slate-100 disabled:opacity-30 transition"
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMove(challenge, 'down')}
                        disabled={index === sorted.length - 1}
                        aria-label="Mover para baixo"
                        className="text-slate-400 hover:text-slate-100 disabled:opacity-30 transition"
                      >
                        ↓
                      </button>
                      <button type="button" onClick={() => openEdit(challenge)} className="px-2 py-1 text-adminAccent hover:underline">
                        Editar
                      </button>
                      <button type="button" onClick={() => handleDelete(challenge)} className="px-2 py-1 text-red-400 hover:underline">
                        Excluir
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ChallengeFormModal open={modalOpen} challenge={editing} onClose={() => setModalOpen(false)} onSaved={handleSaved} />
    </ProfessorLayout>
  );
}
