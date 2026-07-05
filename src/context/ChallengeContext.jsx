import { createContext, useContext, useState, useMemo, useCallback } from 'react';
import { CHALLENGES } from '../data/challenges.js';
import { getBlock } from '../data/blocks.js';
import { useLocalStorage } from '../hooks/useLocalStorage.js';
import { newId } from '../utils/id.js';

const ChallengeContext = createContext(null);

function defaultFields(blockDef) {
  const fields = {};
  for (const f of blockDef.fields || []) {
    fields[f.name] = f.default;
  }
  return fields;
}

function removeRecursive(list, id) {
  return list
    .filter((inst) => inst.instanceId !== id)
    .map((inst) =>
      inst.children && inst.children.length
        ? { ...inst, children: removeRecursive(inst.children, id) }
        : inst
    );
}

function updateFieldRecursive(list, id, name, value) {
  return list.map((inst) => {
    if (inst.instanceId === id) {
      return { ...inst, fields: { ...inst.fields, [name]: value } };
    }
    if (inst.children && inst.children.length) {
      return { ...inst, children: updateFieldRecursive(inst.children, id, name, value) };
    }
    return inst;
  });
}

export function ChallengeProvider({ children }) {
  const [challengeIndex, setChallengeIndex] = useState(0);
  const [instances, setInstances] = useState([]);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [wrongAttempts, setWrongAttempts] = useState(0);
  const [progress, setProgress] = useLocalStorage('javablocks_progress', {});

  const challenge = CHALLENGES[challengeIndex];

  const addBlock = useCallback((blockId) => {
    const blockDef = getBlock(blockId);
    if (!blockDef) return;
    const instance = {
      instanceId: newId(),
      blockId,
      fields: defaultFields(blockDef),
      children: []
    };
    setInstances((prev) => [...prev, instance]);
  }, []);

  const removeInstance = useCallback((id) => {
    setInstances((prev) => removeRecursive(prev, id));
  }, []);

  const moveInstances = useCallback((newArray) => {
    setInstances(newArray);
  }, []);

  const updateField = useCallback((id, name, value) => {
    setInstances((prev) => updateFieldRecursive(prev, id, name, value));
  }, []);

  const reset = useCallback(() => {
    setInstances([]);
    setHintsUsed(0);
    setWrongAttempts(0);
  }, []);

  const goNext = useCallback(() => {
    setProgress((prev) => ({ ...prev, [challenge.id]: true }));
    setChallengeIndex((prev) => Math.min(prev + 1, CHALLENGES.length - 1));
    setInstances([]);
    setHintsUsed(0);
    setWrongAttempts(0);
  }, [challenge, setProgress]);

  const useHint = useCallback(() => {
    setHintsUsed((prev) => prev + 1);
  }, []);

  const registerWrong = useCallback(() => {
    setWrongAttempts((prev) => prev + 1);
  }, []);

  const value = useMemo(
    () => ({
      instances,
      addBlock,
      removeInstance,
      moveInstances,
      updateField,
      reset,
      challenge,
      goNext,
      hintsUsed,
      useHint,
      wrongAttempts,
      registerWrong,
      progress
    }),
    [instances, addBlock, removeInstance, moveInstances, updateField, reset, challenge, goNext, hintsUsed, useHint, wrongAttempts, registerWrong, progress]
  );

  return <ChallengeContext.Provider value={value}>{children}</ChallengeContext.Provider>;
}

export function useChallenge() {
  const ctx = useContext(ChallengeContext);
  if (!ctx) throw new Error('useChallenge must be used within a ChallengeProvider');
  return ctx;
}
