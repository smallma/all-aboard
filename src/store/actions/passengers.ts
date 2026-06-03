import { uuid } from '@/lib/id';
import type { Passenger, Plan } from '@/lib/types';
import { usePlanStore } from '../usePlanStore';

function update(updater: (plan: Plan) => Plan): void {
  usePlanStore.getState().updateCurrentPlan(updater);
}

export function addPassenger(input: Omit<Passenger, 'id'>): string {
  const id = uuid();
  update((plan) => ({
    ...plan,
    passengers: [...plan.passengers, { id, ...input }],
  }));
  return id;
}

export function updatePassenger(id: string, patch: Partial<Omit<Passenger, 'id'>>): void {
  update((plan) => ({
    ...plan,
    passengers: plan.passengers.map((p) => (p.id === id ? { ...p, ...patch } : p)),
    // 若 canDrive 從 true 改 false，且該人正在駕駛座 → 自動下車回備戰區
    cars:
      patch.canDrive === false
        ? plan.cars.map((c) => (c.driverId === id ? { ...c, driverId: null } : c))
        : plan.cars,
  }));
}

export function removePassenger(id: string): void {
  update((plan) => ({
    ...plan,
    passengers: plan.passengers.filter((p) => p.id !== id),
    // 名下物品變無主
    items: plan.items.map((it) =>
      it.ownerId === id ? { ...it, ownerId: null } : it,
    ),
    cars: plan.cars.map((c) => ({
      ...c,
      driverId: c.driverId === id ? null : c.driverId,
      passengerIds: c.passengerIds.map((pid) => (pid === id ? null : pid)),
    })),
  }));
}
