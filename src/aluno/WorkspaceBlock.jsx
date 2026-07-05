import { getBlock, CATEGORIES } from '../data/blocks.js';
import { useChallenge } from '../context/ChallengeContext.jsx';

export default function WorkspaceBlock({ node, highlightedId, onHover }) {
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
        <span className="text-sm font-semibold text-slate-100">{blockDef.label}</span>
        <button
          type="button"
          onClick={() => removeInstance(node.instanceId)}
          aria-label="Remover bloco"
          className="text-slate-400 hover:text-red-400 transition text-lg leading-none px-1"
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
        <div className="ml-4 mr-2 mb-2 pl-3 border-l-2 border-dashed border-base-border">
          {node.children && node.children.length > 0 ? (
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
            <div className="my-2 py-3 text-center text-xs text-slate-500 border border-dashed border-base-border rounded-md">
              Solte blocos aqui
            </div>
          )}
        </div>
      )}
    </div>
  );
}
