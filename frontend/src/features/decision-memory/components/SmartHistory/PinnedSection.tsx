/**
 * PinnedSection - Pinned sessions with drag-to-reorder functionality
 * Uses @dnd-kit for smooth drag and drop with keyboard accessibility
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Pin, GripVertical, ChevronRight } from 'lucide-react';
import { HistoryItem } from './HistoryItem';
import type { SmartHistorySession, ViewMode } from '../../types';

interface PinnedSectionProps {
  sessions: SmartHistorySession[];
  onReorder: (sessionIds: string[]) => Promise<void>;
  onSelect: (sessionId: string) => void;
  onUnpin: (sessionId: string) => void;
  onArchive: (session: SmartHistorySession) => void;
  onDelete: (sessionId: string) => void;
  onRerunExact?: (sessionId: string) => void;
  onReusePrompt?: (sessionId: string) => void;
  onReuseCouncil?: (sessionId: string) => void;
  viewMode: ViewMode;
}

export function PinnedSection({
  sessions,
  onReorder,
  onSelect,
  onUnpin,
  onArchive,
  onDelete,
  onRerunExact,
  onReusePrompt,
  onReuseCouncil,
  viewMode,
}: PinnedSectionProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (over && active.id !== over.id) {
      const oldIndex = sessions.findIndex((s) => s.id === active.id);
      const newIndex = sessions.findIndex((s) => s.id === over.id);

      const newOrder = arrayMove(sessions, oldIndex, newIndex);
      await onReorder(newOrder.map((s) => s.id));
    }
  };

  const activeSession = activeId ? sessions.find((s) => s.id === activeId) : null;

  if (sessions.length === 0) {
    return null;
  }

  return (
    <div className="mb-2">
      {/* Section Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg
          text-amber-400 hover:text-amber-300 hover:bg-slate-800/30
          transition-colors text-sm"
      >
        <ChevronRight
          className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
        />
        <Pin className="w-4 h-4 fill-current" />
        <span className="font-medium">Pinned</span>
        <span className="ml-auto text-xs text-slate-500">({sessions.length}/5)</span>
      </button>

      {/* Pinned Items with Drag Context */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={sessions.map((s) => s.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className={`
                  mt-1 ml-3 space-y-0.5
                  ${viewMode === 'cards' ? 'grid grid-cols-1 gap-2' : ''}
                `}>
                  {sessions.map((session) => (
                    <SortablePinnedItem
                      key={session.id}
                      session={session}
                      onSelect={onSelect}
                      onUnpin={onUnpin}
                      onArchive={onArchive}
                      onDelete={onDelete}
                      onRerunExact={onRerunExact}
                      onReusePrompt={onReusePrompt}
                      onReuseCouncil={onReuseCouncil}
                      viewMode={viewMode}
                      isDragging={activeId === session.id}
                    />
                  ))}
                </div>
              </SortableContext>

              {/* Drag Overlay - Shows the item being dragged */}
              <DragOverlay>
                {activeSession ? (
                  <div className="opacity-90">
                    <HistoryItem
                      session={activeSession}
                      onSelect={() => {}}
                      onDelete={() => {}}
                      viewMode={viewMode}
                      isDragging
                      showPinButton={false}
                    />
                  </div>
                ) : null}
              </DragOverlay>
            </DndContext>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Sortable wrapper for pinned items
interface SortablePinnedItemProps {
  session: SmartHistorySession;
  onSelect: (sessionId: string) => void;
  onUnpin: (sessionId: string) => void;
  onArchive: (session: SmartHistorySession) => void;
  onDelete: (sessionId: string) => void;
  onRerunExact?: (sessionId: string) => void;
  onReusePrompt?: (sessionId: string) => void;
  onReuseCouncil?: (sessionId: string) => void;
  viewMode: ViewMode;
  isDragging?: boolean;
}

function SortablePinnedItem({
  session,
  onSelect,
  onUnpin,
  onArchive,
  onDelete,
  onRerunExact,
  onReusePrompt,
  onReuseCouncil,
  viewMode,
  isDragging,
}: SortablePinnedItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: session.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isSortableDragging ? 0.3 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-1 group"
    >
      {/* Drag Handle */}
      <button
        className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-slate-700/50
          cursor-grab active:cursor-grabbing transition-opacity touch-none"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="w-3.5 h-3.5 text-slate-500" />
      </button>

      {/* Session Item */}
      <div className="flex-1">
        <HistoryItem
          session={session}
          onSelect={onSelect}
          onPin={() => onUnpin(session.id)}
          onArchive={onArchive}
          onDelete={onDelete}
          onRerunExact={onRerunExact}
          onReusePrompt={onReusePrompt}
          onReuseCouncil={onReuseCouncil}
          viewMode={viewMode}
          isDragging={isDragging || isSortableDragging}
          showPinButton={true}
        />
      </div>
    </div>
  );
}
