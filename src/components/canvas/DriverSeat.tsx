'use client';

import type { JSX } from 'react';

import { useDroppable } from '@dnd-kit/core';
import { clsx } from 'clsx';
import { Car } from 'lucide-react';

import { buildDndId } from '@/lib/dnd-id';
import { usePlanStore } from '@/store/usePlanStore';

type Props = {
  carId: string;
  driverId: string | null;
  xPct: number;
  yPct: number;
};

export function DriverSeat({ carId, driverId, xPct, yPct }: Props): JSX.Element {
  const { setNodeRef, isOver } = useDroppable({
    id: buildDndId({ kind: 'driver', carId }),
  });
  const invalid = usePlanStore((s) => s.ui.hoverInvalidDriverCarId === carId);
  const draggingPassenger = usePlanStore((s) => s.ui.draggingKind === 'passenger');
  const isEmpty = driverId === null;
  const highlightEmpty = isEmpty && draggingPassenger && !invalid;

  return (
    <div
      ref={setNodeRef}
      style={{ left: `${xPct}%`, top: `${yPct}%` }}
      className={clsx(
        'absolute -translate-x-1/2 -translate-y-1/2',
        'flex h-12 w-12 items-center justify-center rounded-full transition-colors',
        driverId ? 'bg-amber-100' : 'border-2 border-dashed border-slate-300',
        highlightEmpty && 'border-amber-400 bg-amber-50',
        isOver && !invalid && 'ring-2 ring-blue-500 ring-offset-1',
        invalid && 'ring-4 ring-red-500 bg-red-100 border-red-500',
      )}
    >
      {isEmpty && (
        <Car
          className={clsx(
            'h-5 w-5 transition-colors',
            invalid ? 'text-red-500' : highlightEmpty ? 'text-amber-600' : 'text-slate-400',
          )}
        />
      )}
    </div>
  );
}
