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
  const [showClearConfirm, setShowClearConfirm] = useState(false);
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

      {/* Fixed "Clear Builder" button */}
      <button
        onClick={() => setShowClearConfirm(true)}
        className="fixed bottom-5 right-5 z-40 flex items-center gap-2 px-4 py-2.5 rounded-full bg-white border border-gray-200 shadow-md text-sm font-semibold text-gray-500 hover:border-red-300 hover:text-red-500 hover:shadow-lg transition-all"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
          <polyline points="1,3.5 13,3.5" />
          <polyline points="5.5,3.5 5.5,1.5 8.5,1.5 8.5,3.5" />
          <path d="M2.5 3.5 L3.2 12 Q3.3 12.5 3.8 12.5 H10.2 Q10.7 12.5 10.8 12 L11.5 3.5" />
          <line x1="5.5" y1="6" x2="5.5" y2="10.5" />
          <line x1="8.5" y1="6" x2="8.5" y2="10.5" />
        </svg>
        Clear Builder
      </button>

      {/* Confirmation dialog */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-[2px]"
            onClick={() => setShowClearConfirm(false)}
          />
          {/* Dialog */}
          <div className="relative bg-white rounded-2xl shadow-2xl p-6 w-80 flex flex-col items-center gap-4">
            <div className="w-11 h-11 rounded-full bg-red-50 flex items-center justify-center flex-shrink-0">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="#ef4444" strokeWidth="1.8" strokeLinecap="round">
                <polyline points="1.5,5 18.5,5" />
                <polyline points="7.5,5 7.5,2.5 12.5,2.5 12.5,5" />
                <path d="M3.5 5 L4.5 17 Q4.6 17.5 5.2 17.5 H14.8 Q15.4 17.5 15.5 17 L16.5 5" />
                <line x1="7.5" y1="8.5" x2="7.5" y2="14.5" />
                <line x1="12.5" y1="8.5" x2="12.5" y2="14.5" />
              </svg>
            </div>
            <div className="text-center">
              <p className="text-base font-bold text-gray-800">Start from scratch?</p>
              <p className="text-sm text-gray-500 mt-1">This will clear all blocks and reset the builder. This can't be undone.</p>
            </div>
            <div className="flex gap-2 w-full">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="flex-1 px-4 py-2 rounded-lg border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  dispatch({ type: 'RESET' });
                  setShowClearConfirm(false);
                }}
                className="flex-1 px-4 py-2 rounded-lg bg-red-500 text-sm font-semibold text-white hover:bg-red-600 transition-colors"
              >
                Yes, clear it
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminDataContext.Provider>
  );
}
