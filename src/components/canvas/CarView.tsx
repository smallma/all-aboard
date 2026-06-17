'use client';

import { useEffect } from 'react';
import { motion, useAnimation } from 'framer-motion';
import { MapPin, Trash2 } from 'lucide-react';
import { clsx } from 'clsx';
import { CAR_SPECS } from '@/lib/constants';
import type { Car, Item, Passenger, Plan } from '@/lib/types';
import { usePlanStore } from '@/store/usePlanStore';
import { deleteCar } from '@/store/actions/cars';
import { unseatPassenger } from '@/store/actions/dragdrop';
import { PassengerChip } from '../staging/PassengerChip';
import { CarBody } from './CarBody';
import { DriverSeat } from './DriverSeat';
import { SeatSlot } from './SeatSlot';
import { OwnerBadge } from './OwnerBadge';
import { GearBasket } from './GearBasket';

type Props = {
  car: Car;
  plan: Plan;
  onAddCar?: () => void;
  onEditWaypoints?: () => void;
};

export function CarView({ car, plan, onAddCar, onEditWaypoints }: Props) {
  const spec = CAR_SPECS[car.type];
  const driver = car.driverId
    ? plan.passengers.find((p) => p.id === car.driverId) ?? null
    : null;
  const title = driver ? `${driver.name} 的車` : '請指派司機';

  const totalSeats = 1 + spec.seatCount;
  const occupiedSeats = (car.driverId ? 1 : 0) + car.passengerIds.filter(Boolean).length;
  const isFull = occupiedSeats >= totalSeats;

  const shake = useAnimation();
  const rejectFlash = usePlanStore((s) => s.ui.rejectFlash);

  useEffect(() => {
    if (rejectFlash?.carId === car.id) {
      void shake.start({
        x: [-4, 4, -3, 3, -2, 2, 0],
        transition: { duration: 0.4 },
      });
    }
  }, [rejectFlash, car.id, shake]);

  const onDelete = () => {
    if (window.confirm(`刪除「${title}」？`)) deleteCar(car.id);
  };

  const findPassenger = (id: string | null): Passenger | null => {
    if (!id) return null;
    return plan.passengers.find((p) => p.id === id) ?? null;
  };

  const trunkItems: Item[] = car.itemIds
    .map((iid) => plan.items.find((it) => it.id === iid))
    .filter((it): it is Item => Boolean(it));

  return (
    <motion.div
      layout
      initial={{ y: -120, scale: 0.85, opacity: 0 }}
      animate={{ y: 0, scale: 1, opacity: 1 }}
      exit={{ scale: 0.5, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 240, damping: 20 }}
      className="rounded-2xl bg-white shadow-md p-3"
    >
      {/* ── Header ── */}
      <header className="flex items-center justify-between mb-3 gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <OwnerBadge title={title} />
          <span
            className={clsx(
              'flex-shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold',
              isFull ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500',
            )}
          >
            {isFull ? '滿載' : `${occupiedSeats} / ${totalSeats}`}
          </span>
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

      {car.waypoints.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-1.5">
          {car.waypoints.map((waypoint, index) => (
            <span
              key={waypoint.id}
              className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-2 py-1 text-[11px] font-medium text-sky-800"
            >
              <MapPin className="h-3 w-3" />
              {['A', 'B', 'C'][index]} {waypoint.location}
            </span>
          ))}
        </div>
      )}

      {/* ── Body: 車體 (左/上) + 裝備籃 (右/下) ── */}
      <div
        className={clsx(
          'flex flex-col items-center gap-3 min-[1980px]:flex-row min-[1980px]:items-start',
        )}
      >
        {/* 左側：車體俯視圖 */}
        <motion.div
          className="relative flex-shrink-0"
          style={{ width: 270, aspectRatio: '3/5' }}
          animate={shake}
        >
          <CarBody type={car.type} color={car.color} />

          <DriverSeat
            carId={car.id}
            driverId={car.driverId}
            xPct={spec.driverPos.xPct}
            yPct={spec.driverPos.yPct}
          />

          {spec.layout.map((seat) => (
            <SeatSlot
              key={seat.index}
              carId={car.id}
              seatIndex={seat.index}
              passengerId={car.passengerIds[seat.index] ?? null}
              xPct={seat.xPct}
              yPct={seat.yPct}
              label={seat.label}
            />
          ))}

          {/* PassengerChip overlays */}
          {driver && (
            <div
              className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-auto"
              style={{ left: `${spec.driverPos.xPct}%`, top: `${spec.driverPos.yPct}%` }}
            >
              <PassengerChip
                passenger={driver}
                placement="driver"
                onRemove={() => unseatPassenger(driver.id)}
              />
            </div>
          )}

          {spec.layout.map((seat) => {
            const p = findPassenger(car.passengerIds[seat.index] ?? null);
            if (!p) return null;
            return (
              <div
                key={`chip-${seat.index}`}
                className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-auto"
                style={{ left: `${seat.xPct}%`, top: `${seat.yPct}%` }}
              >
                <PassengerChip
                  passenger={p}
                  placement="seat"
                  onRemove={() => unseatPassenger(p.id)}
                />
              </div>
            );
          })}
        </motion.div>

        {/* 右側：裝備籃 */}
        <GearBasket
          carId={car.id}
          items={trunkItems}
        />
      </div>
    </motion.div>
  );
}
