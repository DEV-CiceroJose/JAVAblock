import Button from '../components/ui/Button';
import HintButton from './HintButton';

export default function ActionBar({
  showCode,
  onToggleCode,
  onReset,
  onVerify,
  onNext,
  canAdvance
}) {
  return (
    <div className="sticky bottom-0 z-10 bg-base-panel border border-base-border rounded-xl p-3 mt-4 flex flex-wrap gap-3 items-center justify-between">
      <div className="flex flex-wrap gap-2 sm:gap-3">
        <Button variant="ghost" onClick={onToggleCode}>
          {showCode ? 'Ocultar Código' : 'Mostrar Código'}
        </Button>
        <Button variant="ghost" onClick={onReset}>
          Resetar Desafio
        </Button>
        <HintButton />
      </div>
      <div className="flex flex-wrap gap-2 sm:gap-3">
        <Button variant="primary" onClick={onVerify}>
          Verificar Resposta
        </Button>
        <Button variant="success" onClick={onNext} disabled={!canAdvance}>
          Próximo Desafio
        </Button>
      </div>
    </div>
  );
}
