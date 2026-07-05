import { useMemo } from 'react';
import { generateJava } from '../engine/codeGenerator.js';

export default function CodePanel({ instances, highlightedId, onHoverLine, onLineClick, visible = true }) {
  const { lines } = useMemo(() => generateJava(instances), [instances]);

  if (!visible) return null;

  return (
    <div className="flex-1 h-full overflow-y-auto bg-base-panel border border-base-border rounded-xl p-4">
      <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-3">
        Código Java
      </h2>
      <pre className="overflow-x-auto text-sm font-mono leading-relaxed bg-base-bg rounded-md border border-base-border">
        <code>
          {lines.map((line, index) => {
            const isHighlighted = Boolean(line.instanceId) && line.instanceId === highlightedId;
            const isIncomplete = line.text.includes('// Falta completar aqui');

            return (
              <div
                key={index}
                data-instance-id={line.instanceId ?? ''}
                onMouseEnter={() => onHoverLine?.(line.instanceId)}
                onMouseLeave={() => onHoverLine?.(null)}
                onClick={() => line.instanceId && onLineClick?.(line.instanceId)}
                className={`flex whitespace-pre px-2 ${
                  isHighlighted ? 'bg-accent/20 border-l-2 border-accent' : 'border-l-2 border-transparent'
                } ${line.instanceId ? 'cursor-pointer' : ''}`}
              >
                <span className="select-none text-slate-600 w-8 shrink-0 text-right pr-3">
                  {index + 1}
                </span>
                <span className={isIncomplete ? 'text-amber-400' : 'text-slate-200'}>
                  {line.text}
                </span>
              </div>
            );
          })}
        </code>
      </pre>
    </div>
  );
}
