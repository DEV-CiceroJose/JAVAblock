import Badge from '../components/ui/Badge';
import BlockPattern from '../components/ui/BlockPattern.jsx';

export default function ChallengeHeader({ challenge }) {
  if (!challenge) return null;

  return (
    <div className="relative overflow-hidden bg-base-panel border border-base-border rounded-xl p-4 mb-4">
      <BlockPattern color="#4f8cff" opacity={0.06} />
      <div className="relative">
        <h1 className="text-xl font-bold font-mono text-slate-100 mb-2">{challenge.titulo}</h1>
        <p className="text-sm text-slate-300 leading-relaxed mb-3">{challenge.descricao}</p>
        <Badge color="#4f8cff">{challenge.objetivoPedagogico}</Badge>
      </div>
    </div>
  );
}
