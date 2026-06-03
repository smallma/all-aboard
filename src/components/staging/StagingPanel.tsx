'use client';

import { useDroppable } from '@dnd-kit/core';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronRight, Edit2, Plus } from 'lucide-react';
import { clsx } from 'clsx';
import { buildDndId } from '@/lib/dnd-id';
import { usePlanStore } from '@/store/usePlanStore';
import type { Item, Passenger } from '@/lib/types';
import { PassengerChip } from './PassengerChip';
import { ItemChip } from './ItemChip';

type Props = {
  passengers: Passenger[];
  items: Item[];
  unassignedPassengerIds: Set<string>;
  unassignedItemIds: Set<string>;
  onEditPassenger: (p: Passenger) => void;
  onEditItem: (it: Item) => void;
  onAddPassenger: () => void;
  onAddItem: () => void;
};

export function StagingPanel({
  passengers,
  items,
  unassignedPassengerIds,
  unassignedItemIds,
  onEditPassenger,
  onEditItem,
  onAddPassenger,
  onAddItem,
}: Props) {
  const collapsed = usePlanStore((s) => s.ui.stagingCollapsed);
  const setCollapsed = usePlanStore((s) => s.setStagingCollapsed);

  const { setNodeRef: setPassengersRef, isOver: isOverP } = useDroppable({
    id: buildDndId({ kind: 'staging-passengers' }),
  });
  const { setNodeRef: setItemsRef, isOver: isOverI } = useDroppable({
    id: buildDndId({ kind: 'staging-items' }),
  });

  const unassignedPassengers = passengers.filter((p) => unassignedPassengerIds.has(p.id));
  const unassignedItems = items.filter((it) => unassignedItemIds.has(it.id));

  return (
    <aside
      className={clsx(
        'flex-shrink-0 bg-white border-l border-slate-200 flex flex-col transition-all',
        collapsed ? 'w-12' : 'w-64 xl:w-[20rem]',
      )}
    >
      <header className="px-2 py-2 flex items-center justify-between border-b border-slate-100">
        <button
          type="button"
          onClick={() => setCollapsed(!collapsed)}
          aria-label={collapsed ? '展開備戰區' : '收合備戰區'}
          className="p-1.5 rounded-lg hover:bg-slate-100"
        >
          <ChevronRight
            className={clsx(
              'w-4 h-4 transition-transform text-slate-500',
              !collapsed && 'rotate-180',
            )}
          />
        </button>
        {!collapsed && (
          <span className="text-sm font-semibold text-slate-700 pr-2">備戰區</span>
        )}
      </header>

      {!collapsed && (
        <div className="flex-1 flex flex-col overflow-hidden min-h-0">
          {/* ── 上半：待分配人員（獨立滾動）── */}
          <div className="flex-1 overflow-y-auto p-3 min-h-0">
            <section
              ref={setPassengersRef}
              className={clsx(
                'rounded-xl p-2 border-2 border-dashed transition',
                isOverP ? 'border-blue-400 bg-blue-50/50' : 'border-transparent',
              )}
            >
              <div className="mb-2 flex items-center justify-between">
                <SectionTitle
                  title="待分配人員"
                  count={unassignedPassengers.length}
                  highlight
                  className="mb-0"
                />
                <button
                  type="button"
                  onClick={onAddPassenger}
                  aria-label="新增待分配人員"
                  className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-blue-600"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                <AnimatePresence>
                  {unassignedPassengers.map((p) => (
                    <motion.div
                      key={p.id}
                      layout
                      initial={{ x: 24, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      exit={{ opacity: 0, scale: 0.85 }}
                      transition={{ type: 'spring', stiffness: 280, damping: 22 }}
                      className="relative group"
                    >
                      <PassengerChip passenger={p} placement="staging" />
                      <button
                        type="button"
                        onClick={() => onEditPassenger(p)}
                        aria-label="編輯"
                        className="absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 transition w-5 h-5 rounded-full bg-white border border-slate-200 shadow flex items-center justify-center"
                      >
                        <Edit2 className="w-3 h-3 text-slate-500" />
                      </button>
                    </motion.div>
                  ))}
                </AnimatePresence>
                {unassignedPassengers.length === 0 && (
                  <EmptyHint text="所有人都已上車 🎉" />
                )}
              </div>
            </section>
          </div>

          {/* ── 分隔線 ── */}
          <div className="border-t border-slate-200 mx-3" />

          {/* ── 下半：待分配物品（獨立滾動）── */}
          <div className="flex-1 overflow-y-auto p-3 min-h-0">
            <section
              ref={setItemsRef}
              className={clsx(
                'rounded-xl p-2 border-2 border-dashed transition',
                isOverI ? 'border-blue-400 bg-blue-50/50' : 'border-transparent',
              )}
            >
              <div className="mb-2 flex items-center justify-between">
                <SectionTitle
                  title="待分配物品"
                  count={unassignedItems.length}
                  highlight
                  className="mb-0"
                />
                <button
                  type="button"
                  onClick={onAddItem}
                  aria-label="新增待分配物品"
                  className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-blue-600"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                <AnimatePresence>
                  {unassignedItems.map((it) => (
                    <motion.div
                      key={it.id}
                      layout
                      initial={{ x: 24, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      exit={{ opacity: 0, scale: 0.85 }}
                      transition={{ type: 'spring', stiffness: 280, damping: 22 }}
                      className="relative group"
                    >
                      <ItemChip item={it} placement="staging" />
                      <button
                        type="button"
                        onClick={() => onEditItem(it)}
                        aria-label="編輯"
                        className="absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 transition w-5 h-5 rounded-full bg-white border border-slate-200 shadow flex items-center justify-center"
                      >
                        <Edit2 className="w-3 h-3 text-slate-500" />
                      </button>
                    </motion.div>
                  ))}
                </AnimatePresence>
                {unassignedItems.length === 0 && (
                  <EmptyHint text="所有物品都已上車 🎉" />
                )}
              </div>
            </section>
          </div>
        </div>
      )}
    </aside>
  );
}

function SectionTitle({
  title,
  count,
  highlight,
  muted,
  className,
}: {
  title: string;
  count: number;
  highlight?: boolean;
  muted?: boolean;
  className?: string;
}) {
  return (
    <h3
      className={clsx(
        'mb-2 px-1 flex items-baseline gap-1',
        muted ? 'text-[11px]' : 'text-xs font-semibold',
        className,
      )}
    >
      <span className={clsx(muted ? 'text-slate-400' : 'text-slate-700')}>{title}</span>
      <span
        className={clsx(
          'inline-flex items-center justify-center min-w-[20px] px-1 rounded-full text-[10px] font-semibold',
          highlight && count > 0 && 'bg-amber-100 text-amber-700',
          highlight && count === 0 && 'bg-slate-100 text-slate-400',
          muted && 'bg-slate-100 text-slate-400',
        )}
      >
        {count}
      </span>
    </h3>
  );
}

function EmptyHint({ text }: { text: string }) {
  return <p className="text-xs text-slate-400 px-1 py-2">{text}</p>;
}
