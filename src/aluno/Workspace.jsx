import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useChallenge } from '../context/ChallengeContext.jsx';
import WorkspaceBlock from './WorkspaceBlock.jsx';

function SortableWorkspaceBlock({ node, highlightedId, onHover }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: node.instanceId
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <WorkspaceBlock node={node} highlightedId={highlightedId} onHover={onHover} />
    </div>
  );
}

export default function Workspace({ highlightedId, onHover }) {
  const { instances } = useChallenge();

  return (
    <div className="flex-1 h-full max-h-full min-w-0 overflow-y-auto overflow-x-hidden bg-base-panel border border-base-border rounded-xl p-4">
      <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-3">
        Área de Montagem
      </h2>
      <SortableContext
        items={instances.map((inst) => inst.instanceId)}
        strategy={verticalListSortingStrategy}
      >
        {instances.length === 0 ? (
          <div className="h-40 flex items-center justify-center text-center text-sm text-slate-500 border border-dashed border-base-border rounded-md">
            Arraste blocos aqui para montar seu programa
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {instances.map((node) => (
              <SortableWorkspaceBlock
                key={node.instanceId}
                node={node}
                highlightedId={highlightedId}
                onHover={onHover}
              />
            ))}
          </div>
        )}
      </SortableContext>
    </div>
  );
}
