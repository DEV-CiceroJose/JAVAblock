import { DndContext, closestCenter } from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useChallenge } from '../context/ChallengeContext.jsx';
import WorkspaceBlock from './WorkspaceBlock.jsx';

function SortableWorkspaceBlock({ node }) {
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
      <WorkspaceBlock node={node} />
    </div>
  );
}

export default function Workspace() {
  const { instances, addBlock, moveInstances } = useChallenge();

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

  return (
    <div className="flex-1 h-full overflow-y-auto bg-base-panel border border-base-border rounded-xl p-4">
      <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-3">
        Área de Montagem
      </h2>
      <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
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
                <SortableWorkspaceBlock key={node.instanceId} node={node} />
              ))}
            </div>
          )}
        </SortableContext>
      </DndContext>
    </div>
  );
}
