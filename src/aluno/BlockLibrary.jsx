import { useMemo } from 'react';
import { BLOCKS, CATEGORIES } from '../data/blocks.js';
import { useChallenge } from '../context/ChallengeContext.jsx';
import BlockChip from './BlockChip.jsx';

export default function BlockLibrary() {
  const { challenge, addBlock } = useChallenge();

  const groups = useMemo(() => {
    const allowed = new Set(challenge?.blocosPermitidos || []);
    const permittedBlocks = BLOCKS.filter((b) => allowed.has(b.id));
    return CATEGORIES.map((category) => ({
      category,
      blocks: permittedBlocks.filter((b) => b.category === category.key)
    })).filter((group) => group.blocks.length > 0);
  }, [challenge]);

  return (
    <div className="w-64 shrink-0 h-full overflow-y-auto bg-base-panel border border-base-border rounded-xl p-3">
      <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-3">
        Biblioteca de Blocos
      </h2>
      {groups.map(({ category, blocks }) => (
        <div key={category.key} className="mb-4">
          <h3 className="text-sm font-semibold mb-2" style={{ color: category.color }}>
            {category.label}
          </h3>
          {blocks.map((block) => (
            <BlockChip key={block.id} block={block} onAdd={addBlock} />
          ))}
        </div>
      ))}
    </div>
  );
}
