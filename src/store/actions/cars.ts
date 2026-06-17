import { CAR_SPECS } from '@/lib/constants';
import { uuid } from '@/lib/id';
import type { Car, CarColor, CarType, Plan, Waypoint } from '@/lib/types';
import { waypointLabel } from '@/lib/plan-normalize';
import { usePlanStore } from '../usePlanStore';

function update(updater: (plan: Plan) => Plan): void {
  usePlanStore.getState().updateCurrentPlan(updater);
}

export function addCar(type: CarType, color: CarColor): string {
  const id = uuid();
  const spec = CAR_SPECS[type];
  const car: Car = {
    id,
    type,
    color,
    driverId: null,
    passengerIds: new Array<string | null>(spec.seatCount).fill(null),
    itemIds: [],
    waypoints: [],
  };
  update((plan) => ({ ...plan, cars: [...plan.cars, car] }));
  return id;
}

export function changeCarColor(carId: string, color: CarColor): void {
  update((plan) => ({
    ...plan,
    cars: plan.cars.map((c) => (c.id === carId ? { ...c, color } : c)),
  }));
}

export function deleteCar(carId: string): void {
  // 刪除整台車，人/物自動回備戰區（即從 car 的引用中移除即可，
  // 因為 Plan.passengers/items 是「全部」清單，而非「未上車清單」）
  update((plan) => ({
    ...plan,
    cars: plan.cars.filter((c) => c.id !== carId),
  }));
}

export function updateCarWaypoints(carId: string, locations: string[]): void {
  const waypoints: Waypoint[] = locations
    .map((location, index) => ({ id: uuid(), label: waypointLabel(index), location: location.trim() }))
    .filter((waypoint) => waypoint.location)
    .slice(0, 3);

  update((plan) => ({
    ...plan,
    cars: plan.cars.map((c) => (c.id === carId ? { ...c, waypoints } : c)),
  }));
}
