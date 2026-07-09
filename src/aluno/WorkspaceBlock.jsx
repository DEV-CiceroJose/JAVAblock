import { useDroppable } from '@dnd-kit/core';
import { getBlock, CATEGORIES } from '../data/blocks.js';
import { useChallenge } from '../context/ChallengeContext.jsx';

function ContainerDropZone({ node, highlightedId, onHover }) {
  const { isOver, setNodeRef } = useDroppable({ id: 'container:' + node.instanceId });
  const hasChildren = node.children && node.children.length > 0;

  return (
    <div
      ref={setNodeRef}
      className={`ml-4 mr-2 mb-2 pl-3 border-l-2 border-dashed rounded-sm transition-colors ${
        isOver ? 'border-accent bg-accent/10 ring-1 ring-accent' : 'border-base-border'
      }`}
    >
      {hasChildren ? (
        <div className="flex flex-col gap-2 py-2">
          {node.children.map((child) => (
            <WorkspaceBlock
              key={child.instanceId}
              node={child}
              highlightedId={highlightedId}
              onHover={onHover}
            />
          ))}
        </div>
      ) : (
        <div
          className={`my-2 py-3 text-center text-xs border border-dashed rounded-md transition-colors ${
            isOver ? 'border-accent text-accent' : 'border-base-border text-slate-500'
          }`}
        >
          Solte blocos aqui
        </div>
      )}
    </div>
  );
}

export default function WorkspaceBlock({ node, highlightedId, onHover, dragHandleProps }) {
  const { removeInstance, updateField } = useChallenge();
  const blockDef = getBlock(node.blockId);
  if (!blockDef) return null;

  const category = CATEGORIES.find((c) => c.key === blockDef.category);
  const color = category ? category.color : '#4f8cff';
  const isHighlighted = Boolean(highlightedId) && node.instanceId === highlightedId;

  return (
    <div
      className={`rounded-md border bg-base-panel overflow-hidden transition-colors ${
        isHighlighted ? 'border-accent ring-1 ring-accent' : 'border-base-border'
      }`}
      style={{ borderLeft: `4px solid ${color}` }}
      onMouseEnter={() => onHover?.(node.instanceId)}
      onMouseLeave={() => onHover?.(null)}
    >
      <div className="flex items-center justify-between gap-2 px-3 py-2">
        <div className="flex items-center gap-2 min-w-0">
          {dragHandleProps && (
            <button
              type="button"
              ref={dragHandleProps.setActivatorNodeRef}
              {...dragHandleProps.attributes}
              {...dragHandleProps.listeners}
              aria-label="Arrastar bloco"
              title="Arraste para mover"
              className="cursor-grab active:cursor-grabbing touch-none select-none text-slate-500 hover:text-slate-200 leading-none px-1"
            >
              ⠿
            </button>
          )}
          <span className="text-sm font-semibold text-slate-100 truncate">{blockDef.label}</span>
        </div>
        <button
          type="button"
          onClick={() => removeInstance(node.instanceId)}
          aria-label="Remover bloco"
          className="text-slate-400 hover:text-red-400 transition text-lg leading-none px-1 shrink-0"
        >
          ×
        </button>
      </div>

      {blockDef.fields && blockDef.fields.length > 0 && (
        <div className="flex flex-wrap gap-3 px-3 pb-2">
          {blockDef.fields.map((field) => (
            <label key={field.name} className="flex flex-col text-xs text-slate-400 gap-1">
              {field.label}
              <input
                type="text"
                value={node.fields[field.name] ?? ''}
                onChange={(e) => updateField(node.instanceId, field.name, e.target.value)}
                className="bg-base-bg border border-base-border rounded px-2 py-1 text-sm text-slate-100
                  focus:outline-none focus:ring-1 focus:ring-slate-400"
              />
            </label>
          ))}
        </div>
      )}

      {blockDef.container && (
        <ContainerDropZone node={node} highlightedId={highlightedId} onHover={onHover} />
      )}
    </div>
  );
}
