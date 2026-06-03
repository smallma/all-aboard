'use client';

import type { CSSProperties, JSX, MouseEvent } from 'react';

import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { clsx } from 'clsx';
import { Package, X } from 'lucide-react';

import { Avatar } from '@/components/shared/Avatar';
import { buildDndId } from '@/lib/dnd-id';
import { usePlanStore } from '@/store/usePlanStore';
import type { Item } from '@/lib/types';

type Placement = 'staging' | 'trunk';

type Props = {
  item: Item;
  placement: Placement;
  onRemove?: () => void;
  showOwnerName?: boolean;
};

export function ItemChip({ item, placement, onRemove, showOwnerName = false }: Props): JSX.Element {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: buildDndId({ kind: 'item', itemId: item.id }),
  });
  const owner = usePlanStore((s) =>
    item.ownerId
      ? s.currentPlan?.passengers.find((p) => p.id === item.ownerId) ?? null
      : null,
  );

  // Only apply transform in staging; trunk items use DragOverlay for positioning.
  const style: CSSProperties =
    placement === 'staging'
      ? { transform: CSS.Translate.toString(transform) }
      : {};

  function handleRemove(event: MouseEvent<HTMLButtonElement>): void {
    event.stopPropagation();
    onRemove?.();
  }

  if (placement === 'staging') {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className={clsx(
          'relative inline-flex items-center bg-white border border-slate-200 rounded-md px-2 py-1 gap-2',
          isDragging && 'opacity-50',
        )}
        {...listeners}
        {...attributes}
      >
        <Package className="w-4 h-4 text-slate-500" />
        <span className="text-sm text-slate-800">{item.name}</span>
        {showOwnerName && (
          <span className="text-xs text-slate-500">
            · {owner?.name ?? '未指派'}
          </span>
        )}
        {owner && (
          <span
            className="ml-0.5 inline-block rounded-full ring-1 ring-white"
            title={`${owner.name} 帶`}
          >
            <Avatar avatarId={owner.avatarId} size={16} />
          </span>
        )}
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={clsx(
        'relative w-full bg-white border border-slate-200 rounded-md px-2 py-1.5 flex gap-2 items-center',
        isDragging && 'opacity-50',
      )}
      {...listeners}
      {...attributes}
    >
      <Package className="w-4 h-4 shrink-0 text-slate-500" />
      <span className="min-w-0 flex-1 break-words text-sm text-slate-800">{item.name}</span>
      {owner && (
        <span title={`${owner.name} 帶`} className="shrink-0 flex flex-col items-center gap-0.5">
          <Avatar avatarId={owner.avatarId} size={20} />
          <span className="text-[9px] text-slate-500 leading-tight max-w-[40px] text-center truncate">{owner.name}</span>
        </span>
      )}
      {onRemove ? (
        <button
          type="button"
          aria-label="移除"
          onClick={handleRemove}
          className="flex w-4 h-4 shrink-0 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 hover:text-red-600"
        >
          <X className="w-3 h-3" />
        </button>
      ) : null}
    </div>
  );
}
