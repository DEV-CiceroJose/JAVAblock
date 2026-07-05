import { useState } from 'react';
import { DndContext, closestCenter } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { useChallenge } from '../context/ChallengeContext.jsx';
import { validate } from '../engine/validator.js';
import { computeXP } from '../gamification/scoring.js';
import { CHALLENGES } from '../data/challenges.js';
import ChallengeHeader from './ChallengeHeader.jsx';
import BlockLibrary from './BlockLibrary.jsx';
import Workspace from './Workspace.jsx';
import CodePanel from './CodePanel.jsx';
import ActionBar from './ActionBar.jsx';
import SuccessOverlay from './SuccessOverlay.jsx';

const TABS = [
  { key: 'biblioteca', label: 'Biblioteca' },
  { key: 'montagem', label: 'Montagem' },
  { key: 'codigo', label: 'Código' }
];

export default function ChallengeScreen() {
  const {
    instances,
    moveInstances,
    addBlock,
    reset,
    challenge,
    goNext,
    registerWrong,
    hintsUsed,
    wrongAttempts
  } = useChallenge();

  const [highlightedId, setHighlightedId] = useState(null);
  const [showCode, setShowCode] = useState(true);
  const [completed, setCompleted] = useState(false);
  const [message, setMessage] = useState(null);
  const [activeTab, setActiveTab] = useState('montagem');
  const [earnedXp, setEarnedXp] = useState(0);
  const [overlayOpen, setOverlayOpen] = useState(false);

  const isLast = challenge?.id === CHALLENGES[CHALLENGES.length - 1].id;

  function handleDragEnd(event) {
    const { active, over } = event;

    if (active.data.current?.source === 'library') {
      addBlock(active.data.current.blockId);
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
    <div className="min-h-screen bg-base-bg text-slate-100 p-4 md:p-6 flex flex-col">
      <ChallengeHeader challenge={challenge} />

      {message && (
        <div
          className={`rounded-lg border p-3 mb-4 text-sm ${
            message.ok
              ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
              : 'bg-amber-500/10 border-amber-500/40 text-amber-300'
          }`}
        >
          {message.mensagem}
        </div>
      )}

      <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        {/* Tabs for small screens */}
        <div className="lg:hidden mb-3 flex gap-2">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium border ${
                activeTab === tab.key
                  ? 'bg-accent text-white border-accent'
                  : 'bg-base-panel text-slate-300 border-base-border'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex-1 lg:grid lg:grid-cols-[16rem_1fr_1fr] gap-4 min-h-0">
          <div className={`${activeTab === 'biblioteca' ? 'block' : 'hidden'} lg:block h-full`}>
            {libraryColumn}
          </div>
          <div className={`${activeTab === 'montagem' ? 'block' : 'hidden'} lg:block h-full`}>
            {workspaceColumn}
          </div>
          {showCode && (
            <div className={`${activeTab === 'codigo' ? 'block' : 'hidden'} lg:block h-full`}>
              {codeColumn}
            </div>
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
    </div>
  );
}
