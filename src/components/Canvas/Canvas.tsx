import type { Dispatch } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import type { AppState } from '../../types';
import type { CanvasAction } from '../../store/canvasReducer';
import { EmailHeader } from './EmailHeader';
import { SortableBlock } from './SortableBlock';

interface Props {
  state: AppState;
  dispatch: Dispatch<CanvasAction>;
}

export function Canvas({ state, dispatch }: Props) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = state.blocks.findIndex(b => b.instanceId === active.id);
    const newIndex = state.blocks.findIndex(b => b.instanceId === over.id);
    const reordered = arrayMove(state.blocks, oldIndex, newIndex);
    dispatch({ type: 'REORDER_BLOCKS', orderedIds: reordered.map(b => b.instanceId) });
  }

  return (
    <div className="flex-1 overflow-y-auto bg-gray-100 p-6">
      <div className="max-w-2xl mx-auto">
        <EmailHeader header={state.header} dispatch={dispatch} />

        {state.blocks.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <div className="text-4xl mb-3">📧</div>
            <p className="font-medium">Your email is empty</p>
            <p className="text-sm mt-1">Click items in the sidebar to add them here</p>
          </div>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={state.blocks.map(b => b.instanceId)} strategy={verticalListSortingStrategy}>
              {state.blocks.map(block => (
                <SortableBlock key={block.instanceId} block={block} dispatch={dispatch} />
              ))}
            </SortableContext>
          </DndContext>
        )}
      </div>
    </div>
  );
}
