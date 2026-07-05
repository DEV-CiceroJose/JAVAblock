import { useDraggable } from '@dnd-kit/core';
import { CATEGORIES } from '../data/blocks.js';

export default function BlockChip({ block, onAdd }) {
  const category = CATEGORIES.find((c) => c.key === block.category);
  const color = category ? category.color : '#4f8cff';

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `lib:${block.id}`,
    data: { source: 'library', blockId: block.id }
  });

  const style = {
    borderLeftColor: color,
    backgroundColor: color + '1a',
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    opacity: isDragging ? 0.5 : 1
  };

  return (
    <button
      ref={setNodeRef}
      type="button"
      style={style}
      onClick={() => onAdd(block.id)}
      className="w-full text-left px-3 py-2 mb-2 rounded-md border-l-4 border border-base-border
        text-sm text-slate-100 cursor-grab active:cursor-grabbing
        hover:brightness-125 transition"
      {...listeners}
      {...attributes}
    >
      {block.label}
    </button>
  );
}
