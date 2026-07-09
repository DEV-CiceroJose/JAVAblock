import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  DndContext,
  pointerWithin,
  closestCenter,
  rectIntersection,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors
} from '@dnd-kit/core';
import { arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { useChallenge } from '../context/ChallengeContext.jsx';
import { validate } from '../engine/validator.js';
import { computeXP } from '../gamification/scoring.js';
import { submitResult } from '../services/api.js';
import ChallengeHeader from './ChallengeHeader.jsx';
import BlockLibrary from './BlockLibrary.jsx';
import Workspace from './Workspace.jsx';
import CodePanel from './CodePanel.jsx';
import ActionBar from './ActionBar.jsx';
import SuccessOverlay from './SuccessOverlay.jsx';
import RankingPanel from './RankingPanel.jsx';
import Toast from './Toast.jsx';

const TABS = [
  { key: 'biblioteca', label: 'Biblioteca' },
  { key: 'montagem', label: 'Montagem' },
  { key: 'codigo', label: 'Código' }
];

// Colisão combinada:
// - Arrastar da biblioteca: usa o ponteiro (pointerWithin) para acertar containers
//   e posições; cai para rectIntersection quando o ponteiro está em um vão.
// - Reordenar blocos existentes: ignora as zonas de container e usa closestCenter
//   entre os irmãos, que é o esperado por verticalListSortingStrategy.
function combinedCollision(args) {
  const isLibrary = args.active?.data?.current?.source === 'library';
  if (isLibrary) {
    const hits = pointerWithin(args);
    return hits.length ? hits : rectIntersection(args);
  }
  const filtered = {
    ...args,
    droppableContainers: args.droppableContainers.filter(
      (c) => !String(c.id).startsWith('container:')
    )
  };
  return closestCenter(filtered);
}

export default function ChallengeScreen() {
  const {
    instances,
    moveInstances,
    addBlock,
    addBlockAt,
    addChildBlock,
    reset,
    challenge,
    goNext,
    registerWrong,
    hintsUsed,
    wrongAttempts,
    creditarXP,
    desafios,
    grupoAtivo
  } = useChallenge();

  const [highlightedId, setHighlightedId] = useState(null);
  const [showCode, setShowCode] = useState(true);
  const [completed, setCompleted] = useState(false);
  const [message, setMessage] = useState(null);
  const [activeTab, setActiveTab] = useState('montagem');
  const [earnedXp, setEarnedXp] = useState(0);
  const [overlayOpen, setOverlayOpen] = useState(false);
  const [xpCredited, setXpCredited] = useState(false);

  const isLast = challenge?.id === desafios[desafios.length - 1]?.id;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  function handleDragEnd(event) {
    const { active, over } = event;

    if (active.data.current?.source === 'library') {
      const blockId = active.data.current.blockId;
      if (over && String(over.id).startsWith('container:')) {
        const parentId = String(over.id).slice('container:'.length);
        addChildBlock(parentId, blockId);
      } else if (over) {
        // Soltou sobre um bloco de topo → insere naquela posição (não no fim).
        const overIndex = instances.findIndex((inst) => inst.instanceId === over.id);
        if (overIndex === -1) addBlock(blockId);
        else addBlockAt(blockId, overIndex);
      } else {
        addBlock(blockId);
      }
      return;
    }

    if (!over || active.id === over.id) return;

    const oldIndex = instances.findIndex((inst) => inst.instanceId === active.id);
    const newIndex = instances.findIndex((inst) => inst.instanceId === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    moveInstances(arrayMove(instances, oldIndex, newIndex));
  }

  function handleReset() {
    reset();
    setCompleted(false);
    setMessage(null);
    setHighlightedId(null);
    setOverlayOpen(false);
    setXpCredited(false);
  }

  function handleVerify() {
    const result = validate(instances, challenge);
    if (result.ok) {
      setCompleted(true);
      setMessage(null);
      const xp = computeXP({
        hintsUsed,
        wrongAttempts,
        forbiddenUsed: 0,
        firstTry: wrongAttempts === 0
      });
      setEarnedXp(xp);
      setOverlayOpen(true);
      // Task 15: creditar earnedXp ao grupo ativo no ranking
      if (!xpCredited) {
        creditarXP(xp);
        setXpCredited(true);
        // Task 10: envio fire-and-forget do resultado ao backend (no-op sem VITE_API_URL)
        const categoria = challenge.modulo != null ? String(challenge.modulo) : 'geral';
        submitResult({
          grupo: grupoAtivo,
          challengeId: challenge.id,
          categoria,
          xp,
          dicasUsadas: hintsUsed,
          tentativas: wrongAttempts + 1,
          tempoSegundos: 0,
          acertou: true
        });
      }
    } else {
      setMessage(result);
      registerWrong();
    }
  }

  function handleNext() {
    goNext();
    setCompleted(false);
    setMessage(null);
    setHighlightedId(null);
    setOverlayOpen(false);
    setXpCredited(false);
  }

  const libraryColumn = <BlockLibrary />;
  const workspaceColumn = (
    <Workspace highlightedId={highlightedId} onHover={setHighlightedId} />
  );
  const codeColumn = (
    <CodePanel
      instances={instances}
      highlightedId={highlightedId}
      onHoverLine={setHighlightedId}
      onLineClick={setHighlightedId}
      visible={showCode}
    />
  );

  return (
    <div className="min-h-screen bg-base-bg text-slate-100 p-3 sm:p-4 md:p-6 flex flex-col overflow-x-hidden">
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
      >
        <ChallengeHeader challenge={challenge} />
        <RankingPanel />
      </motion.div>

      {message && (
        <div className="rounded-lg border p-3 mb-4 text-sm break-words bg-amber-500/10 border-amber-500/40 text-amber-300">
          {message.mensagem}
        </div>
      )}

      <DndContext sensors={sensors} collisionDetection={combinedCollision} onDragEnd={handleDragEnd}>
        {/* Tabs for small screens */}
        <div className="lg:hidden mb-3 flex gap-2 overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium border whitespace-nowrap ${
                activeTab === tab.key
                  ? 'bg-accent text-white border-accent'
                  : 'bg-base-panel text-slate-300 border-base-border'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex-1 lg:grid lg:grid-cols-[16rem_1fr_1fr] gap-4 min-h-0 min-w-0">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: 'easeOut', delay: 0.05 }}
            className={`${activeTab === 'biblioteca' ? 'block' : 'hidden'} lg:block h-full min-h-0 min-w-0`}
          >
            {libraryColumn}
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: 'easeOut', delay: 0.1 }}
            className={`${activeTab === 'montagem' ? 'block' : 'hidden'} lg:block h-full min-h-0 min-w-0`}
          >
            {workspaceColumn}
          </motion.div>
          {showCode && (
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: 'easeOut', delay: 0.15 }}
              className={`${activeTab === 'codigo' ? 'block' : 'hidden'} lg:block h-full min-h-0 min-w-0`}
            >
              {codeColumn}
            </motion.div>
          )}
        </div>
      </DndContext>

      <ActionBar
        showCode={showCode}
        onToggleCode={() => setShowCode((prev) => !prev)}
        onReset={handleReset}
        onVerify={handleVerify}
        onNext={handleNext}
        canAdvance={completed}
      />

      <SuccessOverlay open={overlayOpen} xp={earnedXp} onNext={handleNext} isLast={isLast} />
      <Toast />
    </div>
  );
}
