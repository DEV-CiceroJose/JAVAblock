import { AnimatePresence, motion } from 'framer-motion';
import Button from '../components/ui/Button';
import BlockPattern from '../components/ui/BlockPattern.jsx';

export default function SuccessOverlay({ open, xp = 0, onNext, isLast = false }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="relative overflow-hidden bg-base-panel border border-base-border rounded-2xl max-w-md w-full p-8 text-center"
            initial={{ scale: 0.6, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 20 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
          >
            <BlockPattern color="#4f8cff" opacity={0.07} />
            <div className="relative">
              <motion.div
                className="mx-auto mb-4 flex items-center justify-center w-20 h-20 rounded-full bg-emerald-500/15 border border-emerald-500/40"
                initial={{ scale: 0, rotate: -45 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 15, delay: 0.15 }}
              >
                <motion.svg
                  viewBox="0 0 24 24"
                  className="w-10 h-10 text-emerald-400"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={3}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <motion.path
                    d="M4 12.5 L9.5 18 L20 6"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.5, delay: 0.35, ease: 'easeOut' }}
                  />
                </motion.svg>
              </motion.div>

              <motion.h2
                className="text-xl font-bold text-slate-100 mb-2"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                Parabéns! Você concluiu este desafio.
              </motion.h2>

              <motion.p
                className="text-3xl font-extrabold font-mono text-accent mb-6"
                initial={{ opacity: 0, scale: 0.7 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'spring', stiffness: 220, damping: 14, delay: 0.45 }}
              >
                +{xp} XP
              </motion.p>

              <Button variant="success" className="w-full" onClick={onNext}>
                {isLast ? 'Você concluiu todos os desafios!' : 'Próximo Desafio'}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
