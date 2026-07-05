import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { BLOCKS, CATEGORIES } from '../data/blocks.js';
import { useChallenge } from '../context/ChallengeContext.jsx';
import BlockChip from './BlockChip.jsx';

const containerVariants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.03 }
  }
};

const chipVariants = {
  hidden: { opacity: 0, y: 6 },
  show: { opacity: 1, y: 0 }
};

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
    <div className="w-full lg:w-64 shrink-0 h-full max-h-full overflow-y-auto overflow-x-hidden bg-base-panel border border-base-border rounded-xl p-3">
      <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-3">
        Biblioteca de Blocos
      </h2>
      {groups.map(({ category, blocks }) => (
        <div key={category.key} className="mb-4">
          <h3 className="text-sm font-semibold mb-2" style={{ color: category.color }}>
            {category.label}
          </h3>
          <motion.div variants={containerVariants} initial="hidden" animate="show">
            {blocks.map((block) => (
              <motion.div key={block.id} variants={chipVariants}>
                <BlockChip block={block} onAdd={addBlock} />
              </motion.div>
            ))}
          </motion.div>
        </div>
      ))}
    </div>
  );
}
