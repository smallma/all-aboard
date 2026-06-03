'use client';

import type { JSX } from 'react';

import { useDroppable } from '@dnd-kit/core';
import { clsx } from 'clsx';
import { Plus } from 'lucide-react';

import { buildDndId } from '@/lib/dnd-id';
import { usePlanStore } from '@/store/usePlanStore';

type Props = {
  carId: string;
  seatIndex: number;
  passengerId: string | null;
  xPct: number;
  yPct: number;
  label: string;
};

export function SeatSlot({
  carId,
  seatIndex,
  passengerId,
  xPct,
  yPct,
  label,
}: Props): JSX.Element {
  const { setNodeRef, isOver } = useDroppable({
    id: buildDndId({ kind: 'seat', carId, seatIndex }),
  });
  const draggingPassenger = usePlanStore((s) => s.ui.draggingKind === 'passenger');
  const isEmpty = passengerId === null;
  const highlightEmpty = isEmpty && draggingPassenger;

  return (
    <div
      ref={setNodeRef}
      aria-label={label}
      style={{ left: `${xPct}%`, top: `${yPct}%` }}
      className={clsx(
        'absolute -translate-x-1/2 -translate-y-1/2',
        'flex h-10 w-10 items-center justify-center rounded-full transition-colors',
        passengerId
          ? 'bg-slate-200'
          : 'border-2 border-dashed border-slate-300',
        highlightEmpty && 'border-blue-400 bg-blue-50/50',
        isOver && 'ring-2 ring-blue-500 ring-offset-1',
      )}
    >
      {isEmpty && (
        <Plus
          className={clsx(
            'w-4 h-4 transition-colors',
            highlightEmpty ? 'text-blue-500' : 'text-slate-300',
          )}
        />
      )}
    </div>
  );
}
