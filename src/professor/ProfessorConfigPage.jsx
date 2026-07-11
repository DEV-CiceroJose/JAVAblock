import { useEffect, useState } from 'react';
import ProfessorLayout from './ProfessorLayout.jsx';
import { useProfessorAuth } from './ProfessorAuthProvider.jsx';
import { getAdminConfig, setAdminConfig } from '../services/adminApi.js';
import Button from '../components/ui/Button.jsx';

const CAMPOS = [
  { name: 'maxDicas', label: 'Máximo de dicas por desafio' },
  { name: 'penalidadePorDica', label: 'Penalidade por dica usada (XP)' },
  { name: 'tempoEntreDicasSeg', label: 'Tempo mínimo entre dicas (segundos)' },
  { name: 'xpBase', label: 'XP base por desafio concluído' },
  { name: 'bonusPrimeira', label: 'Bônus por acertar na primeira tentativa' },
  { name: 'bonusSemDicas', label: 'Bônus por concluir sem usar dicas' },
  { name: 'penalidadeErro', label: 'Penalidade por tentativa incorreta (XP)' },
  { name: 'penalidadeProibido', label: 'Penalidade por usar bloco proibido (XP)' }
];

export default function ProfessorConfigPage() {
  const { token } = useProfessorAuth();
  const [form, setForm] = useState(null);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ativo = true;
    getAdminConfig(token).then((result) => {
      if (!ativo) return;
      setLoading(false);
      if (result.ok) setForm(result.data);
      else setError(result.error);
    });
    return () => {
      ativo = false;
    };
  }, [token]);

  function updateField(name, value) {
    setForm((prev) => ({ ...prev, [name]: value }));
    setSaved(false);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    const patch = {};
    for (const campo of CAMPOS) patch[campo.name] = Number(form[campo.name]);
    const result = await setAdminConfig(token, patch);
    setSaving(false);
    if (result.ok) {
      setForm(result.data);
      setSaved(true);
    } else {
      setError(result.error);
    }
  }

  return (
    <ProfessorLayout>
      <h2 className="text-2xl font-bold mb-6">Configurações</h2>

      {error && (
        <div className="rounded-lg border border-red-500/40 bg-red-500/10 text-red-300 text-sm p-3 mb-4">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-slate-400 text-sm">Carregando...</p>
      ) : form ? (
        <form onSubmit={handleSubmit} className="bg-base-panel border border-base-border rounded-xl p-6 max-w-xl">
          <div className="grid grid-cols-2 gap-4 mb-6">
            {CAMPOS.map((campo) => (
              <label key={campo.name} className="flex flex-col gap-1 text-xs text-slate-400">
                {campo.label}
                <input
                  type="number"
                  value={form[campo.name]}
                  onChange={(e) => updateField(campo.name, e.target.value)}
                  className="bg-base-bg border border-base-border rounded px-2 py-1.5 text-sm text-slate-100"
                />
              </label>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <Button type="submit" disabled={saving} accent="adminAccent">
              {saving ? 'Salvando...' : 'Salvar configurações'}
            </Button>
            {saved && <span className="text-sm text-emerald-400">Salvo!</span>}
          </div>
        </form>
      ) : null}
    </ProfessorLayout>
  );
}
