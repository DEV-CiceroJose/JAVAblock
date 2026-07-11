import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useProfessorAuth } from './ProfessorAuthProvider.jsx';
import Button from '../components/ui/Button.jsx';
import BlockPattern from '../components/ui/BlockPattern.jsx';

export default function ProfessorLogin() {
  const { login, isAuthenticated } = useProfessorAuth();
  const navigate = useNavigate();
  const [tokenInput, setTokenInput] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (isAuthenticated) {
    return <Navigate to="/professor/desafios" replace />;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const result = await login(tokenInput);
    setLoading(false);
    if (result.ok) {
      navigate('/professor/desafios', { replace: true });
    } else {
      setError(result.error);
    }
  }

  return (
    <div className="min-h-screen bg-base-bg text-slate-100 flex items-center justify-center p-4">
      <form
        onSubmit={handleSubmit}
        className="relative overflow-hidden w-full max-w-sm bg-base-panel border border-base-border rounded-2xl p-6 shadow-xl"
      >
        <div
          className="absolute -top-16 -right-16 w-48 h-48 rounded-full blur-3xl pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.25), transparent 70%)' }}
        />
        <BlockPattern color="#8b5cf6" opacity={0.06} />
        <div className="relative">
          <h1 className="text-xl font-bold font-mono mb-1">Área do Professor</h1>
          <p className="text-sm text-slate-400 mb-4">
            Informe o token de acesso para gerenciar desafios, configurações e ver o dashboard.
          </p>
          <label className="flex flex-col gap-1 text-sm text-slate-300 mb-4">
            Token
            <input
              type="password"
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              autoFocus
              className="bg-base-bg border border-base-border rounded-lg px-3 py-2 text-slate-100
                focus:outline-none focus:ring-1 focus:ring-adminAccent"
            />
          </label>
          {error && <div className="text-sm text-red-400 mb-4 break-words">{error}</div>}
          <Button type="submit" disabled={loading || !tokenInput} className="w-full" accent="adminAccent">
            {loading ? 'Verificando...' : 'Entrar'}
          </Button>
          <Link
            to="/"
            className="block text-center text-xs text-slate-500 hover:text-slate-300 mt-4 transition"
          >
            ← Voltar para o app do aluno
          </Link>
        </div>
      </form>
    </div>
  );
}
