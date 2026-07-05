import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useChallenge } from '../context/ChallengeContext.jsx';

function ToastItem({ toast, onDismiss }) {
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(toast.id), 3000);
    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 40, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 40, scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      className="bg-base-panel border border-base-border rounded-lg px-4 py-3 shadow-lg text-sm text-slate-100 max-w-xs"
    >
      {toast.text}
    </motion.div>
  );
}

export default function Toast() {
  const { toasts, dismissToast } = useChallenge();

  return (
    <div className="fixed bottom-4 right-4 z-[60] flex flex-col gap-2 items-end">
      <AnimatePresence>
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onDismiss={dismissToast} />
        ))}
      </AnimatePresence>
    </div>
  );
}
