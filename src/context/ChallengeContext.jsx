import { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { CHALLENGES } from '../data/challenges.js';
import { getBlock } from '../data/blocks.js';
import { useLocalStorage } from '../hooks/useLocalStorage.js';
import { newId } from '../utils/id.js';
import { SEED_GROUPS, GRUPO_ATIVO } from '../data/groups.js';
import { sortRanking, addXP } from '../gamification/ranking.js';
import { fetchChallenges } from '../services/api.js';

const ChallengeContext = createContext(null);

function defaultFields(blockDef) {
  const fields = {};
  for (const f of blockDef.fields || []) {
    fields[f.name] = f.default;
  }
  return fields;
}

function createInstance(blockId) {
  const blockDef = getBlock(blockId);
  if (!blockDef) return null;
  return {
    instanceId: newId(),
    blockId,
    fields: defaultFields(blockDef),
    children: []
  };
}

function addChildRecursive(list, parentId, childInstance) {
  return list.map((inst) => {
    if (inst.instanceId === parentId) {
      return { ...inst, children: [...(inst.children || []), childInstance] };
    }
    if (inst.children && inst.children.length) {
      return { ...inst, children: addChildRecursive(inst.children, parentId, childInstance) };
    }
    return inst;
  });
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

function duplicateRecursive(list, id) {
  const index = list.findIndex((inst) => inst.instanceId === id);
  if (index !== -1) {
    const original = list[index];
    const copy = {
      instanceId: newId(),
      blockId: original.blockId,
      fields: { ...original.fields },
      children: []
    };
    const copyOfList = [...list];
    copyOfList.splice(index + 1, 0, copy);
    return copyOfList;
  }
  return list.map((inst) =>
    inst.children && inst.children.length
      ? { ...inst, children: duplicateRecursive(inst.children, id) }
      : inst
  );
}

export function ChallengeProvider({ children }) {
  const [challengeIndex, setChallengeIndex] = useState(0);
  const [workspaceSave, setWorkspaceSave] = useLocalStorage('javablocks_workspace', {});
  const [instances, setInstances] = useState(() => workspaceSave[CHALLENGES[0]?.id] || []);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [wrongAttempts, setWrongAttempts] = useState(0);
  const [progress, setProgress] = useLocalStorage('javablocks_progress', {});
  const [grupos, setGrupos] = useLocalStorage('javablocks_ranking', SEED_GROUPS);
  const [toasts, setToasts] = useState([]);
  const [desafios, setDesafios] = useState(CHALLENGES); // fallback imediato

  useEffect(() => {
    let ativo = true;
    fetchChallenges().then((remota) => {
      if (ativo && Array.isArray(remota) && remota.length > 0) setDesafios(remota);
    });
    return () => {
      ativo = false;
    };
  }, []);

  const challenge = desafios[challengeIndex];

  // Salva a montagem atual (por desafio) para sobreviver a um reload da página.
  useEffect(() => {
    if (!challenge) return;
    setWorkspaceSave((prev) => ({ ...prev, [challenge.id]: instances }));
  }, [instances, challenge, setWorkspaceSave]);

  const addBlock = useCallback((blockId) => {
    const instance = createInstance(blockId);
    if (!instance) return;
    setInstances((prev) => [...prev, instance]);
  }, []);

  const addBlockAt = useCallback((blockId, index) => {
    const instance = createInstance(blockId);
    if (!instance) return;
    setInstances((prev) => {
      const i = index == null || index < 0 || index > prev.length ? prev.length : index;
      const copy = [...prev];
      copy.splice(i, 0, instance);
      return copy;
    });
  }, []);

  const addChildBlock = useCallback((parentInstanceId, blockId) => {
    const instance = createInstance(blockId);
    if (!instance) return;
    setInstances((prev) => addChildRecursive(prev, parentInstanceId, instance));
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

  const duplicateInstance = useCallback((id) => {
    setInstances((prev) => duplicateRecursive(prev, id));
  }, []);

  const reset = useCallback(() => {
    setInstances([]);
    setHintsUsed(0);
    setWrongAttempts(0);
  }, []);

  const goNext = useCallback(() => {
    setProgress((prev) => ({ ...prev, [challenge.id]: true }));
    setChallengeIndex((prev) => Math.min(prev + 1, desafios.length - 1));
    setInstances([]);
    setHintsUsed(0);
    setWrongAttempts(0);
  }, [challenge, setProgress, desafios]);

  const useHint = useCallback(() => {
    setHintsUsed((prev) => prev + 1);
  }, []);

  const registerWrong = useCallback(() => {
    setWrongAttempts((prev) => prev + 1);
  }, []);

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const creditarXP = useCallback(
    (xp) => {
      let novosToasts = [];
      setGrupos((prevGrupos) => {
        const liderAntes = sortRanking(prevGrupos)[0]?.nome;
        const novosGrupos = addXP(prevGrupos, GRUPO_ATIVO, xp);
        const liderDepois = sortRanking(novosGrupos)[0]?.nome;

        novosToasts = [
          { id: newId(), text: `Grupo ${GRUPO_ATIVO} concluiu o desafio.` }
        ];
        if (liderDepois && liderDepois !== liderAntes) {
          novosToasts.push({ id: newId(), text: `${liderDepois} assumiu a liderança.` });
        }

        return novosGrupos;
      });
      setToasts((prev) => [...prev, ...novosToasts]);
    },
    [setGrupos]
  );

  const value = useMemo(
    () => ({
      instances,
      addBlock,
      addBlockAt,
      addChildBlock,
      removeInstance,
      duplicateInstance,
      moveInstances,
      updateField,
      reset,
      challenge,
      desafios,
      goNext,
      hintsUsed,
      useHint,
      wrongAttempts,
      registerWrong,
      progress,
      grupos,
      grupoAtivo: GRUPO_ATIVO,
      creditarXP,
      toasts,
      dismissToast
    }),
    [
      instances,
      addBlock,
      addBlockAt,
      addChildBlock,
      removeInstance,
      duplicateInstance,
      moveInstances,
      updateField,
      reset,
      challenge,
      desafios,
      goNext,
      hintsUsed,
      useHint,
      wrongAttempts,
      registerWrong,
      progress,
      grupos,
      creditarXP,
      toasts,
      dismissToast
    ]
  );

  return <ChallengeContext.Provider value={value}>{children}</ChallengeContext.Provider>;
}

export function useChallenge() {
  const ctx = useContext(ChallengeContext);
  if (!ctx) throw new Error('useChallenge must be used within a ChallengeProvider');
  return ctx;
}
