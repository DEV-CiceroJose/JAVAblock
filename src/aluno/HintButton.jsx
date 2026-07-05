import { useEffect, useRef, useState } from 'react';
import { useChallenge } from '../context/ChallengeContext.jsx';
import { HINT_PENALTY } from '../gamification/scoring.js';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';

const COOLDOWN_MS = 15000;

export default function HintButton() {
  const { challenge, hintsUsed, useHint } = useChallenge();
  const [lastHintAt, setLastHintAt] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [revealOpen, setRevealOpen] = useState(false);
  const [revealedHint, setRevealedHint] = useState(null);
  const [revealedIndex, setRevealedIndex] = useState(null);
  const [, forceTick] = useState(0);
  const intervalRef = useRef(null);

  const totalHints = challenge.dicas.length;
  const allUsed = hintsUsed >= totalHints;

  // Reset cooldown when a new challenge starts (hintsUsed resets to 0).
  useEffect(() => {
    if (hintsUsed === 0) {
      setLastHintAt(null);
      setRevealedHint(null);
      setRevealedIndex(null);
    }
  }, [hintsUsed]);

  const now = Date.now();
  const inCooldown = lastHintAt !== null && now - lastHintAt < COOLDOWN_MS;

  // Tick every second while in cooldown so the button re-enables automatically.
  useEffect(() => {
    if (inCooldown) {
      intervalRef.current = setInterval(() => forceTick((t) => t + 1), 1000);
      return () => clearInterval(intervalRef.current);
    }
  }, [inCooldown]);

  const disabled = allUsed || inCooldown;
  const remaining = Math.max(0, totalHints - hintsUsed);

  function handleOpenConfirm() {
    if (disabled) return;
    setConfirmOpen(true);
  }

  function handleCancel() {
    setConfirmOpen(false);
  }

  function handleConfirm() {
    const index = hintsUsed; // capture BEFORE incrementing
    useHint();
    setLastHintAt(Date.now());
    setConfirmOpen(false);
    setRevealedIndex(index);
    setRevealedHint(challenge.dicas[index]);
    setRevealOpen(true);
  }

  function handleCloseReveal() {
    setRevealOpen(false);
  }

  let label = `Dica (${remaining} restante${remaining === 1 ? '' : 's'})`;
  if (allUsed) label = 'Dica (esgotadas)';

  return (
    <>
      <div className="flex flex-col items-start gap-1">
        <Button variant="ghost" onClick={handleOpenConfirm} disabled={disabled}>
          {label}
        </Button>
        {inCooldown && !allUsed && (
          <span className="text-xs text-slate-400">
            Aguarde alguns segundos para a próxima dica.
          </span>
        )}
      </div>

      <Modal open={confirmOpen} onClose={handleCancel} title="Usar dica?">
        <p className="text-slate-300 mb-4">
          Pedir uma dica custa {HINT_PENALTY} XP. Deseja continuar?
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="ghost" onClick={handleCancel}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={handleConfirm}>
            Confirmar
          </Button>
        </div>
      </Modal>

      <Modal open={revealOpen} onClose={handleCloseReveal} title={`Dica ${revealedIndex !== null ? revealedIndex + 1 : ''}`}>
        <p className="text-slate-300 mb-4">{revealedHint}</p>
        <div className="flex justify-end">
          <Button variant="primary" onClick={handleCloseReveal}>
            Entendi
          </Button>
        </div>
      </Modal>
    </>
  );
}
