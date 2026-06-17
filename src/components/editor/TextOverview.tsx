'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Car as CarIcon, MapPin, Package, Trash2, UserCircle2, X } from 'lucide-react';
import { CAR_SPECS } from '@/lib/constants';
import type { Car, Item, Passenger, Plan } from '@/lib/types';
import { Avatar } from '../shared/Avatar';
import { deleteCar } from '@/store/actions/cars';
import { unseatPassenger, unstowItem } from '@/store/actions/dragdrop';
import { AddPassengerDialog } from '../staging/AddPassengerDialog';
import { AddItemDialog } from '../staging/AddItemDialog';

type Props = {
  plan: Plan;
  onEditWaypoints?: (car: Car) => void;
};

export function TextOverview({ plan, onEditWaypoints }: Props) {
  const [editingPassenger, setEditingPassenger] = useState<Passenger | null>(null);
  const [editingItem, setEditingItem] = useState<Item | null>(null);

  const findP = (id: string | null): Passenger | null =>
    id ? plan.passengers.find((p) => p.id === id) ?? null : null;
  const findI = (id: string): Item | undefined => plan.items.find((it) => it.id === id);

  return (
    <div className="max-w-3xl mx-auto py-6 px-4 space-y-6">
      {plan.cars.length === 0 && (
        <div className="text-center text-slate-400 py-12">
          還沒有任何車輛 — 請切回視覺模式新增車輛
        </div>
      )}

      {plan.cars.length > 0 && (
        <section className="space-y-4">
          {plan.cars.map((car, idx) => (
            <motion.article
              key={car.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.04 }}
              className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm"
            >
              <CarHeader
                car={car}
                driver={findP(car.driverId)}
                onEditWaypoints={() => onEditWaypoints?.(car)}
                onDelete={() => {
                  const driver = findP(car.driverId);
                  const title = driver ? `${driver.name} 的車` : `${car.type}`;
                  if (window.confirm(`刪除「${title}」？`)) deleteCar(car.id);
                }}
              />

              {car.waypoints.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {car.waypoints.map((waypoint, waypointIndex) => (
                    <span
                      key={waypoint.id}
                      className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-2 py-1 text-xs font-medium text-sky-800"
                    >
                      <MapPin className="h-3.5 w-3.5" />
                      {['A', 'B', 'C'][waypointIndex]} {waypoint.location}
                    </span>
                  ))}
                </div>
              )}

              <div className="mt-3 grid sm:grid-cols-2 gap-3">
                <div>
                  <h4 className="text-xs font-semibold text-slate-500 mb-2">乘客</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {car.driverId && findP(car.driverId) && (
                      <PersonPill
                        passenger={findP(car.driverId)!}
                        isDriver
                        onClick={() => setEditingPassenger(findP(car.driverId)!)}
                        onRemove={() => unseatPassenger(car.driverId!)}
                      />
                    )}
                    {car.passengerIds.map((pid, i) => {
                      const p = findP(pid);
                      if (!p) return null;
                      return (
                        <PersonPill
                          key={`${car.id}-seat-${i}`}
                          passenger={p}
                          onClick={() => setEditingPassenger(p)}
                          onRemove={() => unseatPassenger(p.id)}
                        />
                      );
                    })}
                    {car.driverId === null && car.passengerIds.every((p) => !p) && (
                      <EmptySpan text="無乘客" />
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-semibold text-slate-500 mb-2">後車廂物品</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {car.itemIds.map((iid) => {
                      const item = findI(iid);
                      if (!item) return null;
                      const owner = findP(item.ownerId);
                      return (
                        <ItemPill
                          key={iid}
                          item={item}
                          owner={owner}
                          onClick={() => setEditingItem(item)}
                          onRemove={() => unstowItem(iid)}
                        />
                      );
                    })}
                    {car.itemIds.length === 0 && <EmptySpan text="無物品" />}
                  </div>
                </div>
              </div>
            </motion.article>
          ))}
        </section>
      )}

      <AddPassengerDialog
        open={editingPassenger !== null}
        onClose={() => setEditingPassenger(null)}
        editing={editingPassenger}
      />
      <AddItemDialog
        open={editingItem !== null}
        onClose={() => setEditingItem(null)}
        editing={editingItem}
      />
    </div>
  );
}

function CarHeader({
  car,
  driver,
  onEditWaypoints,
  onDelete,
}: {
  car: Car;
  driver: Passenger | null;
  onEditWaypoints?: () => void;
  onDelete: () => void;
}) {
  const title = driver ? `${driver.name} 的車` : '請指派司機';
  const isPlaceholder = !driver;
  return (
    <header className="flex items-center justify-between gap-2">
      <div className="flex items-center gap-2 min-w-0">
        <span
          className="inline-flex items-center justify-center w-8 h-8 rounded-lg shrink-0"
          style={{ backgroundColor: '#f8fafc' }}
        >
          <CarIcon className="w-4 h-4 text-slate-500" />
        </span>
        <div className="min-w-0">
          <h3
            className={
              isPlaceholder
                ? 'font-semibold text-amber-700 truncate'
                : 'font-semibold text-slate-900 truncate'
            }
          >
            {title}
          </h3>
          <p className="text-xs text-slate-400">{car.type}</p>
        </div>
      </div>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={onEditWaypoints}
          aria-label="編輯停靠站"
          className="p-1.5 rounded-lg text-slate-400 hover:bg-sky-50 hover:text-sky-600"
        >
          <MapPin className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={onDelete}
          aria-label="刪除車輛"
          className="p-1.5 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}

function PersonPill({
  passenger,
  isDriver,
  onClick,
  onRemove,
}: {
  passenger: Passenger;
  isDriver?: boolean;
  onClick?: () => void;
  onRemove?: () => void;
}) {
  return (
    <span
      className="group inline-flex items-center gap-1 pl-1 pr-1 py-0.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-full text-sm cursor-pointer transition"
      onClick={onClick}
    >
      <Avatar avatarId={passenger.avatarId} size={22} />
      <span className="text-slate-800">
        {passenger.name}
        {isDriver && <span className="ml-1 text-amber-600">(駕)</span>}
        {passenger.canDrive && !isDriver && <span className="ml-0.5">💳</span>}
      </span>
      {onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          aria-label={`移除 ${passenger.name}`}
          className="opacity-0 group-hover:opacity-100 transition w-4 h-4 flex items-center justify-center rounded-full hover:bg-white text-slate-500 hover:text-red-600"
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </span>
  );
}

function ItemPill({
  item,
  owner,
  onClick,
  onRemove,
}: {
  item: Item;
  owner: Passenger | null;
  onClick?: () => void;
  onRemove?: () => void;
}) {
  return (
    <span
      className="group inline-flex items-center gap-1 pl-2 pr-1 py-0.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-full text-sm cursor-pointer transition"
      onClick={onClick}
    >
      <Package className="w-3.5 h-3.5 text-slate-400" />
      <span className="text-slate-800">{item.name}</span>
      {owner ? (
        <>
          <span title={`${owner.name} 帶`} className="inline-flex">
            <Avatar avatarId={owner.avatarId} size={16} />
          </span>
          <span className="text-xs text-slate-500">· {owner.name}</span>
        </>
      ) : (
        <>
          <UserCircle2 className="w-4 h-4 text-slate-300" />
          <span className="text-xs text-slate-400">· 未指派</span>
        </>
      )}
      {onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          aria-label={`移除 ${item.name}`}
          className="opacity-0 group-hover:opacity-100 transition w-4 h-4 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-500 hover:text-red-600"
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </span>
  );
}

function EmptySpan({ text }: { text: string }) {
  return <span className="text-xs text-slate-400 py-1">{text}</span>;
}
