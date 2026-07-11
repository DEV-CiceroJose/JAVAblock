import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useProfessorAuth } from './ProfessorAuthProvider.jsx';
import { createChallenge, updateChallenge } from '../services/adminApi.js';
import { BLOCKS } from '../data/blocks.js';
import Button from '../components/ui/Button.jsx';

const CAMPOS_VAZIOS = {
  id: '',
  titulo: '',
  descricao: '',
  objetivoPedagogico: '',
  modulo: 1,
  ordem: 1,
  blocosPermitidos: [],
  obrigatorios: [],
  proibidos: [],
  ordemPares: [],
  quantidadeMinima: 1,
  dica1: '',
  dica2: '',
  dica3: ''
};

function challengeToForm(challenge) {
  if (!challenge) return { ...CAMPOS_VAZIOS };
  return {
    id: challenge.id || '',
    titulo: challenge.titulo || '',
    descricao: challenge.descricao || '',
    objetivoPedagogico: challenge.objetivoPedagogico || '',
    modulo: challenge.modulo ?? 1,
    ordem: challenge.ordem ?? 1,
    blocosPermitidos: challenge.blocosPermitidos || [],
    obrigatorios: challenge.regras?.obrigatorios || [],
    proibidos: challenge.regras?.proibidos || [],
    ordemPares: challenge.regras?.ordem || [],
    quantidadeMinima: challenge.regras?.quantidadeMinima ?? 1,
    dica1: challenge.dicas?.[0] || '',
    dica2: challenge.dicas?.[1] || '',
    dica3: challenge.dicas?.[2] || ''
  };
}

function formToChallenge(form) {
  return {
    id: form.id.trim(),
    titulo: form.titulo.trim(),
    descricao: form.descricao.trim(),
    objetivoPedagogico: form.objetivoPedagogico.trim(),
    modulo: Number(form.modulo),
    ordem: Number(form.ordem),
    blocosPermitidos: form.blocosPermitidos,
    regras: {
      obrigatorios: form.obrigatorios,
      proibidos: form.proibidos,
      ordem: form.ordemPares,
      quantidadeMinima: Number(form.quantidadeMinima)
    },
    dicas: [form.dica1.trim(), form.dica2.trim(), form.dica3.trim()]
  };
}

function validateForm(form) {
  const errors = [];
  if (!form.id.trim()) errors.push('id é obrigatório.');
  if (!form.titulo.trim()) errors.push('título é obrigatório.');
  if (!form.descricao.trim()) errors.push('descrição é obrigatória.');
  if (!form.objetivoPedagogico.trim()) errors.push('objetivo pedagógico é obrigatório.');
  if (form.blocosPermitidos.length === 0) errors.push('selecione ao menos um bloco permitido.');
  if (!form.dica1.trim() || !form.dica2.trim() || !form.dica3.trim()) {
    errors.push('as 3 dicas são obrigatórias.');
  }
  return errors;
}

function toggleInArray(array, value) {
  return array.includes(value) ? array.filter((v) => v !== value) : [...array, value];
}

export default function ChallengeFormModal({ open, challenge, onClose, onSaved }) {
  const { token } = useProfessorAuth();
  const [form, setForm] = useState(() => challengeToForm(challenge));
  const [errors, setErrors] = useState([]);
  const [saving, setSaving] = useState(false);
  const isEditing = Boolean(challenge);

  useEffect(() => {
    if (open) {
      setForm(challengeToForm(challenge));
      setErrors([]);
    }
  }, [open, challenge]);

  if (!open) return null;

  function updateField(name, value) {
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function addOrdemPar() {
    if (form.blocosPermitidos.length < 2) return;
    setForm((prev) => ({
      ...prev,
      ordemPares: [...prev.ordemPares, [prev.blocosPermitidos[0], prev.blocosPermitidos[1]]]
    }));
  }

  function updateOrdemPar(index, position, value) {
    setForm((prev) => ({
      ...prev,
      ordemPares: prev.ordemPares.map((par, i) =>
        i === index ? (position === 0 ? [value, par[1]] : [par[0], value]) : par
      )
    }));
  }

  function removeOrdemPar(index) {
    setForm((prev) => ({ ...prev, ordemPares: prev.ordemPares.filter((_, i) => i !== index) }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const localErrors = validateForm(form);
    if (localErrors.length > 0) {
      setErrors(localErrors);
      return;
    }
    setSaving(true);
    setErrors([]);
    const payload = formToChallenge(form);
    const result = isEditing
      ? await updateChallenge(token, challenge.id, payload)
      : await createChallenge(token, payload);
    setSaving(false);
    if (result.ok) {
      onSaved();
    } else {
      setErrors([result.error]);
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 overflow-y-auto"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.form
          onSubmit={handleSubmit}
          onClick={(e) => e.stopPropagation()}
          initial={{ scale: 0.95, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.95, y: 20 }}
          className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-base-panel border border-base-border
            rounded-2xl p-6 my-8"
        >
          <h2 className="text-xl font-bold mb-4">{isEditing ? 'Editar Desafio' : 'Novo Desafio'}</h2>

          {errors.length > 0 && (
            <div className="rounded-lg border border-red-500/40 bg-red-500/10 text-red-300 text-sm p-3 mb-4">
              {errors.map((err, i) => (
                <div key={i}>{err}</div>
              ))}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 mb-3">
            <label className="flex flex-col gap-1 text-xs text-slate-400">
              id (único, sem espaços)
              <input
                value={form.id}
                onChange={(e) => updateField('id', e.target.value)}
                disabled={isEditing}
                className="bg-base-bg border border-base-border rounded px-2 py-1.5 text-sm text-slate-100 disabled:opacity-50"
              />
            </label>
            <label className="flex flex-col gap-1 text-xs text-slate-400">
              título
              <input
                value={form.titulo}
                onChange={(e) => updateField('titulo', e.target.value)}
                className="bg-base-bg border border-base-border rounded px-2 py-1.5 text-sm text-slate-100"
              />
            </label>
          </div>

          <label className="flex flex-col gap-1 text-xs text-slate-400 mb-3">
            descrição
            <textarea
              value={form.descricao}
              onChange={(e) => updateField('descricao', e.target.value)}
              rows={3}
              className="bg-base-bg border border-base-border rounded px-2 py-1.5 text-sm text-slate-100"
            />
          </label>

          <label className="flex flex-col gap-1 text-xs text-slate-400 mb-3">
            objetivo pedagógico
            <input
              value={form.objetivoPedagogico}
              onChange={(e) => updateField('objetivoPedagogico', e.target.value)}
              className="bg-base-bg border border-base-border rounded px-2 py-1.5 text-sm text-slate-100"
            />
          </label>

          <div className="grid grid-cols-3 gap-3 mb-4">
            <label className="flex flex-col gap-1 text-xs text-slate-400">
              módulo
              <input
                type="number"
                value={form.modulo}
                onChange={(e) => updateField('modulo', e.target.value)}
                className="bg-base-bg border border-base-border rounded px-2 py-1.5 text-sm text-slate-100"
              />
            </label>
            <label className="flex flex-col gap-1 text-xs text-slate-400">
              ordem
              <input
                type="number"
                value={form.ordem}
                onChange={(e) => updateField('ordem', e.target.value)}
                className="bg-base-bg border border-base-border rounded px-2 py-1.5 text-sm text-slate-100"
              />
            </label>
            <label className="flex flex-col gap-1 text-xs text-slate-400">
              quantidade mínima de blocos
              <input
                type="number"
                value={form.quantidadeMinima}
                onChange={(e) => updateField('quantidadeMinima', e.target.value)}
                className="bg-base-bg border border-base-border rounded px-2 py-1.5 text-sm text-slate-100"
              />
            </label>
          </div>

          <fieldset className="mb-4">
            <legend className="text-xs text-slate-400 mb-2">blocos permitidos</legend>
            <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto border border-base-border rounded-lg p-2">
              {BLOCKS.map((block) => (
                <label
                  key={block.id}
                  className="flex items-center gap-1.5 text-xs px-2 py-1 rounded border border-base-border cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={form.blocosPermitidos.includes(block.id)}
                    onChange={() => updateField('blocosPermitidos', toggleInArray(form.blocosPermitidos, block.id))}
                  />
                  {block.label}
                </label>
              ))}
            </div>
          </fieldset>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <fieldset>
              <legend className="text-xs text-slate-400 mb-2">obrigatórios</legend>
              <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto border border-base-border rounded-lg p-2">
                {form.blocosPermitidos.map((id) => (
                  <label key={id} className="flex items-center gap-1.5 text-xs px-2 py-1">
                    <input
                      type="checkbox"
                      checked={form.obrigatorios.includes(id)}
                      onChange={() => updateField('obrigatorios', toggleInArray(form.obrigatorios, id))}
                    />
                    {id}
                  </label>
                ))}
              </div>
            </fieldset>
            <fieldset>
              <legend className="text-xs text-slate-400 mb-2">proibidos</legend>
              <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto border border-base-border rounded-lg p-2">
                {form.blocosPermitidos.map((id) => (
                  <label key={id} className="flex items-center gap-1.5 text-xs px-2 py-1">
                    <input
                      type="checkbox"
                      checked={form.proibidos.includes(id)}
                      onChange={() => updateField('proibidos', toggleInArray(form.proibidos, id))}
                    />
                    {id}
                  </label>
                ))}
              </div>
            </fieldset>
          </div>

          <fieldset className="mb-4">
            <legend className="text-xs text-slate-400 mb-2">ordem entre blocos (A antes de B)</legend>
            <div className="flex flex-col gap-2">
              {form.ordemPares.map((par, index) => (
                <div key={index} className="flex items-center gap-2">
                  <select
                    value={par[0]}
                    onChange={(e) => updateOrdemPar(index, 0, e.target.value)}
                    className="bg-base-bg border border-base-border rounded px-2 py-1 text-xs text-slate-100"
                  >
                    {form.blocosPermitidos.map((id) => (
                      <option key={id} value={id}>
                        {id}
                      </option>
                    ))}
                  </select>
                  <span className="text-xs text-slate-500">antes de</span>
                  <select
                    value={par[1]}
                    onChange={(e) => updateOrdemPar(index, 1, e.target.value)}
                    className="bg-base-bg border border-base-border rounded px-2 py-1 text-xs text-slate-100"
                  >
                    {form.blocosPermitidos.map((id) => (
                      <option key={id} value={id}>
                        {id}
                      </option>
                    ))}
                  </select>
                  <button type="button" onClick={() => removeOrdemPar(index)} className="text-red-400 text-sm hover:underline">
                    remover
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={addOrdemPar}
                disabled={form.blocosPermitidos.length < 2}
                className="text-xs text-adminAccent hover:underline text-left disabled:opacity-40"
              >
                + adicionar par de ordem
              </button>
            </div>
          </fieldset>

          <fieldset className="mb-6">
            <legend className="text-xs text-slate-400 mb-2">dicas progressivas (3, obrigatórias)</legend>
            <div className="flex flex-col gap-2">
              <input
                value={form.dica1}
                onChange={(e) => updateField('dica1', e.target.value)}
                placeholder="Dica 1 — conceito"
                className="bg-base-bg border border-base-border rounded px-2 py-1.5 text-sm text-slate-100"
              />
              <input
                value={form.dica2}
                onChange={(e) => updateField('dica2', e.target.value)}
                placeholder="Dica 2 — quais blocos"
                className="bg-base-bg border border-base-border rounded px-2 py-1.5 text-sm text-slate-100"
              />
              <input
                value={form.dica3}
                onChange={(e) => updateField('dica3', e.target.value)}
                placeholder="Dica 3 — ordem parcial"
                className="bg-base-bg border border-base-border rounded px-2 py-1.5 text-sm text-slate-100"
              />
            </div>
          </fieldset>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm text-slate-400 hover:text-slate-100 transition"
            >
              Cancelar
            </button>
            <Button type="submit" disabled={saving} accent="adminAccent">
              {saving ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </motion.form>
      </motion.div>
    </AnimatePresence>
  );
}
