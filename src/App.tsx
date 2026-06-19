import { useReducer, useRef, useState } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCenter,
} from '@dnd-kit/core';
import type { DragStartEvent, DragOverEvent, DragEndEvent } from '@dnd-kit/core';
import { sortableKeyboardCoordinates, arrayMove } from '@dnd-kit/sortable';
import { canvasReducer, initialState } from './store/canvasReducer';
import { useAdminStore } from './store/adminStore';
import { AdminDataContext } from './contexts/AdminDataContext';
import type { CanvasBlock } from './types';
import { Sidebar } from './components/Sidebar/Sidebar';
import { Canvas } from './components/Canvas/Canvas';
import { Toolbar } from './components/Toolbar/Toolbar';
import { AdminModal } from './components/Admin/AdminModal';

export default function App() {
  const [state, dispatch] = useReducer(canvasReducer, initialState);
  const { adminState, adminDispatch, isDirty, save, cancel, resetToDefaults } = useAdminStore();
  const [showAdmin, setShowAdmin] = useState(false);
  const [insertIndex, setInsertIndex] = useState<number | null>(null);
  const [dragLabel, setDragLabel] = useState<string | null>(null);
  const draggedFactoryRef = useRef<(() => CanvasBlock) | null>(null);
  const insertIndexRef = useRef<number | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  function handleDragStart(event: DragStartEvent) {
    const data = event.active.data.current;
    if (data?.type === 'sidebar') {
      draggedFactoryRef.current = data.blockFactory;
      setDragLabel(data.label ?? '');
    }
  }

  function handleDragOver(event: DragOverEvent) {
    if (!draggedFactoryRef.current) return; // not a sidebar drag
    const { over, active } = event;
    if (!over) {
      setInsertIndex(null);
      insertIndexRef.current = null;
      return;
    }
    if (over.id === 'canvas-end') {
      setInsertIndex(state.blocks.length);
      insertIndexRef.current = state.blocks.length;
    } else {
      const idx = state.blocks.findIndex(b => b.instanceId === String(over.id));
      if (idx < 0) {
        setInsertIndex(null);
        insertIndexRef.current = null;
        return;
      }
      // Insert before or after the hovered block based on which half the cursor is in.
      // If the dragged item's midpoint is below the hovered block's midpoint, insert after.
      const overMidY = over.rect.top + over.rect.height / 2;
      const translated = active.rect.current.translated;
      const activeMidY = translated ? translated.top + translated.height / 2 : null;
      const resolved = activeMidY !== null && activeMidY > overMidY ? idx + 1 : idx;
      setInsertIndex(resolved);
      insertIndexRef.current = resolved;
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    const factory = draggedFactoryRef.current;
    draggedFactoryRef.current = null;
    setDragLabel(null);

    if (factory) {
      // sidebar item dropped — capture index BEFORE clearing it
      const idx = insertIndexRef.current !== null ? insertIndexRef.current : state.blocks.length;
      setInsertIndex(null);
      insertIndexRef.current = null;
      if (!over) return;
      dispatch({ type: 'ADD_BLOCK_AT', block: factory(), index: idx });
    } else {
      // canvas reorder
      setInsertIndex(null);
      insertIndexRef.current = null;
      if (!over || active.id === over.id) return;
      const oldIndex = state.blocks.findIndex(b => b.instanceId === String(active.id));
      const newIndex = state.blocks.findIndex(b => b.instanceId === String(over.id));
      if (oldIndex !== -1 && newIndex !== -1) {
        const reordered = arrayMove(state.blocks, oldIndex, newIndex);
        dispatch({ type: 'REORDER_BLOCKS', orderedIds: reordered.map(b => b.instanceId) });
      }
    }
  }

  return (
    <AdminDataContext.Provider value={{ plans: adminState.plans, addons: adminState.addons, adminDispatch, isDirty, save, cancel, resetToDefaults }}>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="flex h-screen overflow-hidden bg-gray-50">
          <Sidebar dispatch={dispatch} />
          <div className="flex flex-col flex-1 overflow-hidden">
            <Toolbar state={state} onOpenAdmin={() => setShowAdmin(true)} />
            <Canvas
              state={state}
              dispatch={dispatch}
              insertIndex={insertIndex}
              isSidebarDrag={draggedFactoryRef.current !== null}
            />
          </div>
        </div>
        <DragOverlay>
          {dragLabel ? (
            <div className="bg-white border-2 border-jobber shadow-xl rounded-lg px-4 py-2.5 text-sm font-semibold text-jobber-dark opacity-95 cursor-grabbing">
              + {dragLabel}
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {showAdmin && <AdminModal onClose={() => setShowAdmin(false)} />}
    </AdminDataContext.Provider>
  );
}
