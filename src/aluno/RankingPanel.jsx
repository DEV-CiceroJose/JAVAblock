import { motion } from 'framer-motion';
import { useChallenge } from '../context/ChallengeContext.jsx';
import { sortRanking } from '../gamification/ranking.js';
import Card from '../components/ui/Card';

const MEDALS = ['🥇', '🥈', '🥉'];

export default function RankingPanel() {
  const { grupos, grupoAtivo } = useChallenge();
  const ranked = sortRanking(grupos);

  return (
    <Card className="p-3 mb-4">
      <h2 className="text-sm font-semibold text-slate-300 mb-2 uppercase tracking-wide">
        Ranking da sala
      </h2>
      <ul className="flex flex-wrap gap-2">
        {ranked.map((grupo, index) => {
          const isActive = grupo.nome === grupoAtivo;
          return (
            <motion.li
              key={grupo.nome}
              layout
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm ${
                isActive
                  ? 'bg-accent/15 border-accent text-slate-100'
                  : 'bg-base-bg border-base-border text-slate-300'
              }`}
            >
              <span className="w-5 text-center">{MEDALS[index] || index + 1}</span>
              <span className="font-medium">{grupo.nome}</span>
              <span className="text-xs text-slate-400">{grupo.xp} XP</span>
            </motion.li>
          );
        })}
      </ul>
    </Card>
  );
}
