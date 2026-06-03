'use client';

import type { JSX } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { AnimatePresence, motion } from 'framer-motion';
import { clsx } from 'clsx';
import { buildDndId } from '@/lib/dnd-id';
import type { Item } from '@/lib/types';
import { unstowItem } from '@/store/actions/dragdrop';
import { usePlanStore } from '@/store/usePlanStore';
import { ItemChip } from '../staging/ItemChip';

type Props = {
  carId: string;
  items: Item[];
};

export function GearBasket({ carId, items }: Props): JSX.Element {
  const { setNodeRef, isOver } = useDroppable({
    id: buildDndId({ kind: 'trunk', carId }),
  });
  const draggingItem = usePlanStore((s) => s.ui.draggingKind === 'item');
  return (
    <div
      ref={setNodeRef}
      className={clsx(
        'w-full min-[1980px]:w-56 flex flex-col rounded-xl border-2 border-dashed transition-colors',
        isOver
          ? 'border-amber-400 bg-amber-100/70'
          : draggingItem
            ? 'border-amber-300 bg-amber-50/80'
            : 'border-amber-200 bg-amber-50/60',
      )}
    >
      <div className="px-3 pt-2.5 pb-1 flex items-center gap-1.5">
        <span className="text-base leading-none">🧺</span>
        <span className="text-xs font-semibold text-amber-800">裝備區</span>
        {items.length > 0 && (
          <span className="ml-auto text-[10px] font-semibold text-amber-600 bg-amber-100 rounded-full px-1.5 py-0.5">
            {items.length}
          </span>
        )}
      </div>

      <div className="flex-1 px-2 pb-2 min-h-[60px]">
        {items.length === 0 ? (
          <p className="text-[11px] text-amber-400 text-center pt-3">拖曳物品到這裡</p>
        ) : (
          <ul className="flex flex-col gap-1">
            <AnimatePresence initial={false}>
              {items.map((item) => (
                <motion.li
                  key={item.id}
                  layout
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.85 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 24 }}
                >
                  <ItemChip
                    item={item}
                    placement="trunk"
                    onRemove={() => unstowItem(item.id)}
                  />
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        )}
      </div>
    </div>
  );
}

