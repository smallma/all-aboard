'use client';

import { useMemo, useRef, useState } from 'react';
import {
  DndContext,
  DragOverlay,
  MouseSensor,
  TouchSensor,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { AnimatePresence, motion } from 'framer-motion';
import { Clipboard, ImageDown, Package, PanelRight, Plus, WandSparkles, X } from 'lucide-react';
import { clsx } from 'clsx';
import { toPng } from 'html-to-image';
import { parseDndId } from '@/lib/dnd-id';
import { buildLineReport } from '@/lib/plan-tools';
import { handleDragEnd } from '@/store/actions/dragdrop';
import { autoFillCurrentPlan } from '@/store/actions/autofill';
import { usePlanStore } from '@/store/usePlanStore';
import type { Car, Item, Passenger, Plan } from '@/lib/types';
import { useViewport } from '@/hooks/useViewport';
import { Avatar } from '../shared/Avatar';
import { CarView } from '../canvas/CarView';
import { StagingPanel } from '../staging/StagingPanel';
import { AddPassengerDialog } from '../staging/AddPassengerDialog';
import { AddItemDialog } from '../staging/AddItemDialog';
import { EmptyCanvasHint } from './EmptyCanvasHint';
import { TextOverview } from './TextOverview';
import { ToastHost } from './ToastHost';
import { NewCarDialog } from '../console/NewCarDialog';
import { WaypointsDialog } from '../console/WaypointsDialog';

type Props = {
  plan: Plan;
};

type DragSource =
  | { kind: 'passenger'; passenger: Passenger }
  | { kind: 'item'; item: Item }
  | null;

type MobileSheet = 'staging' | null;

export function EditorScreen({ plan }: Props) {
  const viewport = useViewport();
  const isMobile = viewport === 'mobile';
  const viewMode = usePlanStore((s) => s.ui.viewMode);
  const pushToast = usePlanStore((s) => s.pushToast);

  const [editingPassenger, setEditingPassenger] = useState<Passenger | null>(null);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [addPassengerOpen, setAddPassengerOpen] = useState(false);
  const [addItemOpen, setAddItemOpen] = useState(false);
  const [carDialogOpen, setCarDialogOpen] = useState(false);
  const [dragSource, setDragSource] = useState<DragSource>(null);
  const [mobileSheet, setMobileSheet] = useState<MobileSheet>(null);
  const [waypointsCar, setWaypointsCar] = useState<Car | null>(null);
  const exportRef = useRef<HTMLDivElement | null>(null);

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 120, tolerance: 8 } }),
  );

  const onStart = (event: DragStartEvent) => {
    const desc = parseDndId(String(event.active.id));
    const setDraggingKind = usePlanStore.getState().setDraggingKind;
    if (desc?.kind === 'passenger') {
      const p = plan.passengers.find((x) => x.id === desc.passengerId);
      if (p) setDragSource({ kind: 'passenger', passenger: p });
      setDraggingKind('passenger');
    } else if (desc?.kind === 'item') {
      const it = plan.items.find((x) => x.id === desc.itemId);
      if (it) setDragSource({ kind: 'item', item: it });
      setDraggingKind('item');
    } else {
      setDraggingKind(null);
    }
  };

  const onOver = (event: DragOverEvent) => {
    const activeDesc = parseDndId(String(event.active.id));
    const overDesc = event.over ? parseDndId(String(event.over.id)) : null;
    const setHover = usePlanStore.getState().setHoverInvalidDriver;

    if (
      activeDesc?.kind === 'passenger' &&
      overDesc?.kind === 'driver'
    ) {
      const passenger = plan.passengers.find((p) => p.id === activeDesc.passengerId);
      if (passenger && !passenger.canDrive) {
        setHover(overDesc.carId);
        return;
      }
    }
    setHover(null);
  };

  const onEnd = (event: DragEndEvent) => {
    setDragSource(null);
    const s = usePlanStore.getState();
    s.setHoverInvalidDriver(null);
    s.setDraggingKind(null);
    if (!event.over) return;
    handleDragEnd(String(event.active.id), String(event.over.id));
  };

  const { unassignedPassengerIds, unassignedItemIds } = useMemo(() => {
    const usedP = new Set<string>();
    const usedI = new Set<string>();
    for (const c of plan.cars) {
      if (c.driverId) usedP.add(c.driverId);
      for (const pid of c.passengerIds) {
        if (pid) usedP.add(pid);
      }
      for (const iid of c.itemIds) usedI.add(iid);
    }
    return {
      unassignedPassengerIds: new Set(
        plan.passengers.filter((p) => !usedP.has(p.id)).map((p) => p.id),
      ),
      unassignedItemIds: new Set(
        plan.items.filter((it) => !usedI.has(it.id)).map((it) => it.id),
      ),
    };
  }, [plan]);

  const canvasGridClass = clsx(
    'grid gap-6',
    'grid-cols-1 min-[731px]:grid-cols-2 min-[1280px]:grid-cols-3',
  );

  const copyLineReport = async () => {
    const text = buildLineReport(plan);
    try {
      await navigator.clipboard.writeText(text);
      pushToast('已複製 LINE 報數文');
    } catch {
      pushToast('剪貼簿權限被瀏覽器擋下');
    }
  };

  const exportImage = async () => {
    if (!exportRef.current) {
      pushToast('請切到視覺模式再匯出圖片');
      return;
    }
    try {
      const dataUrl = await toPng(exportRef.current, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: '#f8fafc',
      });
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `${sanitizeFilename(plan.name)}-出發安排.png`;
      a.click();
      pushToast('已產生 PNG 圖片');
    } catch {
      pushToast('圖片產生失敗，請稍後再試');
    }
  };

  const stagingPanel = (
    <StagingPanel
      passengers={plan.passengers}
      items={plan.items}
      unassignedPassengerIds={unassignedPassengerIds}
      unassignedItemIds={unassignedItemIds}
      onEditPassenger={(p) => {
        setEditingPassenger(p);
        setAddPassengerOpen(true);
        setMobileSheet(null);
      }}
      onEditItem={(it) => {
        setEditingItem(it);
        setAddItemOpen(true);
        setMobileSheet(null);
      }}
      onAddPassenger={() => {
        setEditingPassenger(null);
        setAddPassengerOpen(true);
        setMobileSheet(null);
      }}
      onAddItem={() => {
        setEditingItem(null);
        setAddItemOpen(true);
        setMobileSheet(null);
      }}
    />
  );

  return (
    <DndContext sensors={sensors} onDragStart={onStart} onDragOver={onOver} onDragEnd={onEnd}>
      <div className="flex-1 flex overflow-hidden relative">
        <section className="flex-1 overflow-auto bg-slate-50">
          <div className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 px-4 py-2 backdrop-blur">
            <div className="flex flex-wrap items-center justify-end gap-2">
              <ToolButton
                label="複製清單"
                icon={<Clipboard className="h-4 w-4" />}
                onClick={copyLineReport}
              />
              <ToolButton
                label="匯出圖片"
                icon={<ImageDown className="h-4 w-4" />}
                onClick={exportImage}
              />
              <ToolButton
                label="魔法分配"
                icon={<WandSparkles className="h-4 w-4" />}
                onClick={autoFillCurrentPlan}
                accent
              />
            </div>
          </div>
          {viewMode === 'visual' ? (
            <div className="p-6">
              <div className="mb-4 flex justify-end">
                <button
                  type="button"
                  onClick={() => setCarDialogOpen(true)}
                  className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4" />
                  新增車輛
                </button>
              </div>
              {plan.cars.length === 0 ? (
                <div className="h-full flex items-center justify-center">
                  <EmptyCanvasHint onAddCarHint={() => setCarDialogOpen(true)} />
                </div>
              ) : (
                <div ref={exportRef} className={clsx(canvasGridClass, 'rounded-xl bg-slate-50 p-1')}>
                  <AnimatePresence>
                    {plan.cars.map((car) => (
                      <CarView
                        key={car.id}
                        car={car}
                        plan={plan}
                        onAddCar={() => setCarDialogOpen(true)}
                        onEditWaypoints={() => setWaypointsCar(car)}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>
          ) : (
            <TextOverview plan={plan} onEditWaypoints={setWaypointsCar} />
          )}
        </section>

        {!isMobile && stagingPanel}

        {/* 手機版：底部 FAB 切換抽屜 */}
        {isMobile && (
          <>
            <div className="fixed bottom-4 left-4 right-4 z-30 flex justify-between pointer-events-none">
              <FabButton
                label="備戰區"
                onClick={() => setMobileSheet('staging')}
                icon={<PanelRight className="w-5 h-5" />}
                color="bg-emerald-600"
                badge={unassignedPassengerIds.size + unassignedItemIds.size}
              />
            </div>

            <AnimatePresence>
              {mobileSheet && (
                <motion.div
                  className="fixed inset-0 z-40 bg-black/40"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setMobileSheet(null)}
                >
                  <motion.div
                    className="absolute bottom-0 left-0 right-0 max-h-[80vh] bg-white rounded-t-2xl shadow-2xl overflow-hidden flex flex-col"
                    initial={{ y: '100%' }}
                    animate={{ y: 0 }}
                    exit={{ y: '100%' }}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <header className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                      <h2 className="font-semibold">備戰區</h2>
                      <button
                        type="button"
                        aria-label="關閉"
                        onClick={() => setMobileSheet(null)}
                        className="p-1.5 rounded-lg hover:bg-slate-100"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </header>
                    <div className="flex-1 overflow-auto">
                      <div className="w-full">{stagingPanel}</div>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}
      </div>

      <DragOverlay dropAnimation={null}>
        {dragSource?.kind === 'passenger' && (
          <div className="inline-flex items-center gap-2 px-2 py-1 bg-white border-2 border-blue-400 rounded-full text-sm shadow-lg">
            <Avatar avatarId={dragSource.passenger.avatarId} size={28} />
            <span>{dragSource.passenger.name}</span>
            {dragSource.passenger.canDrive && <span>💳</span>}
          </div>
        )}
        {dragSource?.kind === 'item' && (
          <div className="inline-flex items-center gap-2 px-2 py-1 bg-white border-2 border-blue-400 rounded-md text-sm shadow-lg">
            <Package className="w-4 h-4 text-slate-500" />
            <span>{dragSource.item.name}</span>
          </div>
        )}
      </DragOverlay>

      <AddPassengerDialog
        open={addPassengerOpen}
        onClose={() => setAddPassengerOpen(false)}
        editing={editingPassenger}
      />
      <AddItemDialog
        open={addItemOpen}
        onClose={() => setAddItemOpen(false)}
        editing={editingItem}
      />
      <NewCarDialog open={carDialogOpen} onClose={() => setCarDialogOpen(false)} />
      <WaypointsDialog
        open={waypointsCar !== null}
        car={waypointsCar}
        plan={plan}
        onClose={() => setWaypointsCar(null)}
      />
      <ToastHost />
    </DndContext>
  );
}

function ToolButton({
  label,
  icon,
  onClick,
  accent,
}: {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  accent?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        'inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium shadow-sm transition',
        accent
          ? 'bg-violet-600 text-white hover:bg-violet-700'
          : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50',
      )}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

function FabButton({
  label,
  onClick,
  icon,
  color,
  badge,
}: {
  label: string;
  onClick: () => void;
  icon: React.ReactNode;
  color: string;
  badge?: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        'pointer-events-auto inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-white font-medium shadow-lg relative',
        color,
      )}
    >
      {icon}
      <span>{label}</span>
      {badge !== undefined && badge > 0 && (
        <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-xs rounded-full flex items-center justify-center">
          {badge}
        </span>
      )}
    </button>
  );
}

function sanitizeFilename(name: string): string {
  return name.trim().replace(/[\\/:*?"<>|]+/g, '-').replace(/\s+/g, '-').slice(0, 80) || '出發安排';
}
