import { useEffect, useState } from 'react';
import ProfessorLayout from './ProfessorLayout.jsx';
import { useProfessorAuth } from './ProfessorAuthProvider.jsx';
import { getDashboard } from '../services/adminApi.js';

function StatCard({ label, value }) {
  return (
    <div className="bg-base-panel border border-base-border rounded-xl p-4">
      <div className="text-xs text-slate-400 mb-1">{label}</div>
      <div className="text-2xl font-bold text-slate-100">{value}</div>
    </div>
  );
}

export default function ProfessorDashboardPage() {
  const { token } = useProfessorAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ativo = true;
    setLoading(true);
    getDashboard(token).then((result) => {
      if (!ativo) return;
      setLoading(false);
      if (result.ok) setData(result.data);
      else setError(result.error);
    });
    return () => {
      ativo = false;
    };
  }, [token]);

  return (
    <ProfessorLayout>
      <h2 className="text-2xl font-bold mb-6">Dashboard</h2>

      {error && (
        <div className="rounded-lg border border-red-500/40 bg-red-500/10 text-red-300 text-sm p-3 mb-4">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-slate-400 text-sm">Carregando...</p>
      ) : data ? (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <StatCard label="Desafios concluídos" value={data.totalConcluidos} />
            <StatCard label="Tempo médio" value={`${data.tempoMedioSeg}s`} />
            <StatCard label="Taxa de acerto" value={`${Math.round(data.taxaAcerto * 100)}%`} />
            <StatCard label="Dicas usadas" value={data.dicasUsadas} />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-base-panel border border-base-border rounded-xl p-4">
              <h3 className="text-sm font-semibold text-slate-300 mb-3">Ranking</h3>
              <ol className="flex flex-col gap-2">
                {data.ranking.map((grupo, i) => (
                  <li key={grupo.nome} className="flex items-center justify-between text-sm">
                    <span className="text-slate-200">
                      {i + 1}. {grupo.nome}
                    </span>
                    <span className="text-adminAccent font-semibold">{grupo.xp} XP</span>
                  </li>
                ))}
              </ol>
            </div>

            <div className="bg-base-panel border border-base-border rounded-xl p-4">
              <h3 className="text-sm font-semibold text-slate-300 mb-3">Desempenho por categoria</h3>
              <div className="flex flex-col gap-3">
                {Object.entries(data.porCategoria).map(([categoria, percentual]) => (
                  <div key={categoria}>
                    <div className="flex justify-between text-xs text-slate-400 mb-1">
                      <span>{categoria}</span>
                      <span>{percentual}%</span>
                    </div>
                    <div className="h-2 bg-base-bg rounded-full overflow-hidden">
                      <div className="h-full bg-adminAccent rounded-full" style={{ width: `${percentual}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      ) : null}
    </ProfessorLayout>
  );
}
