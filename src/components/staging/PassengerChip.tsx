'use client';

import type { CSSProperties, JSX, MouseEvent } from 'react';

import { useDraggable, useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { clsx } from 'clsx';
import { X } from 'lucide-react';

import { Avatar } from '@/components/shared/Avatar';
import { buildDndId } from '@/lib/dnd-id';
import { usePlanStore } from '@/store/usePlanStore';
import type { Passenger } from '@/lib/types';

type Placement = 'staging' | 'driver' | 'seat';

type Props = {
  passenger: Passenger;
  placement: Placement;
  onRemove?: () => void;
};

export function PassengerChip({ passenger, placement, onRemove }: Props): JSX.Element {
  const { attributes, listeners, setNodeRef: setDragRef, transform, isDragging } =
    useDraggable({
      id: buildDndId({ kind: 'passenger', passengerId: passenger.id }),
    });
  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id: buildDndId({ kind: 'passenger-target', passengerId: passenger.id }),
  });
  const draggingItem = usePlanStore((s) => s.ui.draggingKind === 'item');

  // Only apply transform when in staging — in-car chips use DragOverlay for positioning.
  const style: CSSProperties =
    placement === 'staging'
      ? { transform: CSS.Translate.toString(transform) }
      : {};

  function handleRemove(event: MouseEvent<HTMLButtonElement>): void {
    event.stopPropagation();
    onRemove?.();
  }

  // Compose refs so the element is BOTH draggable and droppable
  const setRef = (node: HTMLElement | null) => {
    setDragRef(node);
    setDropRef(node);
  };

  const dropHighlight = draggingItem && isOver;
  const dropHintActive = draggingItem;

  if (placement === 'staging') {
    return (
      <div
        ref={setRef}
        style={style}
        className={clsx(
          'inline-flex items-center rounded-full bg-white border border-slate-200 px-2 py-1 gap-2 transition',
          isDragging && 'opacity-50',
          dropHintActive && 'border-dashed border-amber-300',
          dropHighlight && 'ring-2 ring-amber-400 border-amber-400 bg-amber-50',
        )}
        {...listeners}
        {...attributes}
      >
        <Avatar avatarId={passenger.avatarId} size={28} />
        <span className="text-sm text-slate-800">
          {passenger.name}
          {passenger.canDrive && <span className="ml-1">💳</span>}
        </span>
      </div>
    );
  }

  const avatarSize = placement === 'driver' ? 42 : 38;

  return (
    <div
      ref={setRef}
      style={style}
      className={clsx(
        'group relative inline-flex flex-col items-center gap-0.5 transition',
        isDragging && 'opacity-50',
        dropHighlight && 'ring-2 ring-amber-400 rounded-full bg-amber-50',
      )}
      {...listeners}
      {...attributes}
    >
      <div className="relative">
        <Avatar avatarId={passenger.avatarId} size={avatarSize} />
        {placement === 'driver' && (
          <span className="absolute -top-1 -right-1 text-base leading-none">👨‍✈️</span>
        )}
      </div>
      <span className="absolute -bottom-2 max-w-[70px] truncate rounded-md border border-slate-200 bg-white/95 px-1.5 py-0.5 text-[11px] font-medium text-slate-700 shadow-sm">
        {passenger.name}
      </span>
      <button
        type="button"
        aria-label="移除"
        onClick={handleRemove}
        className="absolute -top-1 -right-1 hidden w-4 h-4 items-center justify-center rounded-full bg-white text-slate-500 shadow border border-slate-200 hover:text-slate-900 group-hover:flex"
      >
        <X className="w-3 h-3" />
      </button>
    </div>
  );
}
