import { parseDndId, type DndDescriptor } from '@/lib/dnd-id';
import type { Car, Passenger, Plan } from '@/lib/types';
import { usePlanStore } from '../usePlanStore';

type PassengerLocation =
  | { kind: 'staging' }
  | { kind: 'driver'; carId: string }
  | { kind: 'seat'; carId: string; seatIndex: number };

type ItemLocation = { kind: 'staging' } | { kind: 'trunk'; carId: string };

// ===================== Public API =====================

export function handleDragEnd(activeId: string, overId: string | null): void {
  if (!overId) return;
  const source = parseDndId(activeId);
  const target = parseDndId(overId);
  if (!source || !target) return;

  if (source.kind === 'passenger') {
    handlePassengerDrop(source.passengerId, target);
  } else if (source.kind === 'item') {
    handleItemDrop(source.itemId, target);
  }
}

/** 點 ✕ 快速移除：把人從車上拿回備戰區（規則 3：物品全部回備戰區）。 */
export function unseatPassenger(passengerId: string): void {
  usePlanStore.getState().updateCurrentPlan((plan) => {
    const cleaned = removePassengerFromAllCars(plan, passengerId);
    // 規則 3：該人名下所有物品全部回備戰區（從所有車的 trunk 移除）
    return {
      ...cleaned,
      cars: cleaned.cars.map((c) => ({
        ...c,
        itemIds: c.itemIds.filter((iid) => {
          const item = cleaned.items.find((it) => it.id === iid);
          return !(item && item.ownerId === passengerId);
        }),
      })),
    };
  });
}

export function unstowItem(itemId: string): void {
  usePlanStore.getState().updateCurrentPlan((plan) => removeItemFromAllCars(plan, itemId));
}

// ===================== Passenger drop =====================

function handlePassengerDrop(passengerId: string, target: DndDescriptor): void {
  const store = usePlanStore.getState();
  const plan = store.currentPlan;
  if (!plan) return;

  const passenger = plan.passengers.find((p) => p.id === passengerId);
  if (!passenger) return;

  if (
    target.kind === 'staging-items' ||
    target.kind === 'trunk' ||
    target.kind === 'item'
  ) {
    return;
  }

  // 乘客拖到「乘客本人」時，轉成該乘客所在座位/駕駛座，才能觸發對調。
  let resolvedTarget = target;
  if (target.kind === 'passenger' || target.kind === 'passenger-target') {
    const targetPassengerId = target.passengerId;
    if (targetPassengerId === passengerId) return;
    const loc = locatePassenger(plan, targetPassengerId);
    if (loc.kind === 'staging') {
      resolvedTarget = { kind: 'staging-passengers' };
    } else if (loc.kind === 'driver') {
      resolvedTarget = { kind: 'driver', carId: loc.carId };
    } else {
      resolvedTarget = { kind: 'seat', carId: loc.carId, seatIndex: loc.seatIndex };
    }
  }

  if (resolvedTarget.kind === 'staging-passengers') {
    // 規則 3：人回備戰區 → 所有名下物品全部回備戰區
    store.updateCurrentPlan((p) => {
      const cleaned = removePassengerFromAllCars(p, passengerId);
      return {
        ...cleaned,
        cars: cleaned.cars.map((c) => ({
          ...c,
          itemIds: c.itemIds.filter((iid) => {
            const item = cleaned.items.find((it) => it.id === iid);
            return !(item && item.ownerId === passengerId);
          }),
        })),
      };
    });
    return;
  }

  if (resolvedTarget.kind === 'driver') {
    handleDropOnDriver(passenger, resolvedTarget.carId);
    return;
  }

  if (resolvedTarget.kind === 'seat') {
    handleDropOnSeat(passenger, resolvedTarget.carId, resolvedTarget.seatIndex);
    return;
  }
}

function handleDropOnDriver(passenger: Passenger, carId: string): void {
  const store = usePlanStore.getState();
  const plan = store.currentPlan;
  if (!plan) return;
  const car = plan.cars.find((c) => c.id === carId);
  if (!car) return;

  if (!passenger.canDrive) {
    store.flashReject({ carId, reason: 'driver-cannot-drive', passengerName: passenger.name });
    store.pushToast(`${passenger.name} 不會開車`);
    setTimeout(() => {
      const s = usePlanStore.getState();
      if (s.ui.rejectFlash?.carId === carId) s.flashReject(null);
    }, 500);
    return;
  }

  store.updateCurrentPlan((p) => {
    const sourceLoc = locatePassenger(p, passenger.id);
    const targetCar = p.cars.find((c) => c.id === carId);
    if (!targetCar) return p;
    const currentDriverId = targetCar.driverId;

    let nextPlan: Plan;
    if (currentDriverId === null) {
      nextPlan = movePassengerTo(p, passenger.id, sourceLoc, { kind: 'driver', carId });
    } else {
      nextPlan = swapPassengers(
        p,
        passenger.id,
        sourceLoc,
        currentDriverId,
        { kind: 'driver', carId },
      );
    }

    // 規則 2：人移動，搬「同位置 + 備戰區的」名下物品到目標車後車廂
    return carryOwnedItems(nextPlan, passenger.id, sourceLoc, carId);
  });
}

function handleDropOnSeat(passenger: Passenger, carId: string, seatIndex: number): void {
  const store = usePlanStore.getState();
  store.updateCurrentPlan((plan) => {
    const car = plan.cars.find((c) => c.id === carId);
    if (!car) return plan;
    if (seatIndex < 0 || seatIndex >= car.passengerIds.length) return plan;

    const sourceLoc = locatePassenger(plan, passenger.id);

    let nextPlan: Plan;
    if (car.passengerIds[seatIndex] === null) {
      nextPlan = movePassengerTo(plan, passenger.id, sourceLoc, {
        kind: 'seat',
        carId,
        seatIndex,
      });
    } else {
      const occupantId = car.passengerIds[seatIndex];
      if (!occupantId) return plan;
      nextPlan = swapPassengers(plan, passenger.id, sourceLoc, occupantId, {
        kind: 'seat',
        carId,
        seatIndex,
      });
    }

    return carryOwnedItems(nextPlan, passenger.id, sourceLoc, carId);
  });
}

// ===================== Item drop =====================

function handleItemDrop(itemId: string, target: DndDescriptor): void {
  const store = usePlanStore.getState();
  if (!store.currentPlan) return;

  // 物品拖到「乘客 chip 本體」時，轉為 passenger-target，才能套用改主人規則。
  let resolvedTarget = target;
  if (target.kind === 'passenger') {
    resolvedTarget = { kind: 'passenger-target', passengerId: target.passengerId };
  }

  if (
    resolvedTarget.kind === 'staging-passengers' ||
    resolvedTarget.kind === 'item'
  ) {
    return;
  }

  // 拖物品到「人」身上（kind: 'passenger-target'）→ 規則 1：跟著主人走
  if (resolvedTarget.kind === 'passenger-target') {
    store.updateCurrentPlan((p) => {
      const newOwner = p.passengers.find((pp) => pp.id === resolvedTarget.passengerId);
      if (!newOwner) return p;
      const ownerLoc = locatePassenger(p, newOwner.id);

      // 1) 從所有 trunk 移除這個物品
      const cleared: Plan = {
        ...p,
        cars: p.cars.map((c) => ({
          ...c,
          itemIds: c.itemIds.filter((iid) => iid !== itemId),
        })),
        // 2) 更新該物品的 ownerId
        items: p.items.map((it) =>
          it.id === itemId ? { ...it, ownerId: newOwner.id } : it,
        ),
      };

      // 3) 物品位置 = 主人位置
      if (ownerLoc.kind === 'staging') {
        return cleared;
      }
      // 主人在車上 → 物品進那台車後車廂
      return {
        ...cleared,
        cars: cleared.cars.map((c) =>
          c.id === ownerLoc.carId
            ? { ...c, itemIds: [...c.itemIds, itemId] }
            : c,
        ),
      };
    });
    return;
  }

  if (target.kind === 'staging-items') {
    store.updateCurrentPlan((p) => removeItemFromAllCars(p, itemId));
    return;
  }

  if (resolvedTarget.kind === 'driver' || resolvedTarget.kind === 'seat') {
    // 視同：拖物品到該車駕駛/座位的人身上 → 改主人為該人並進該車後車廂
    store.updateCurrentPlan((p) => {
      const car = p.cars.find((c) => c.id === resolvedTarget.carId);
      if (!car) return p;
      const occupantId =
        resolvedTarget.kind === 'driver'
          ? car.driverId
          : car.passengerIds[resolvedTarget.seatIndex] ?? null;
      // 不管座位有沒有人，物品都丟進這台車後車廂
      const cleared: Plan = {
        ...p,
        cars: p.cars.map((c) => ({
          ...c,
          itemIds: c.itemIds.filter((iid) => iid !== itemId),
        })),
      };
      const withOwner: Plan = occupantId
        ? {
            ...cleared,
            items: cleared.items.map((it) =>
              it.id === itemId ? { ...it, ownerId: occupantId } : it,
            ),
          }
        : cleared;
      return {
        ...withOwner,
        cars: withOwner.cars.map((c) =>
          c.id === resolvedTarget.carId
            ? { ...c, itemIds: [...c.itemIds, itemId] }
            : c,
        ),
      };
    });
    return;
  }

  if (resolvedTarget.kind === 'trunk') {
    store.updateCurrentPlan((p) => {
      const targetCar = p.cars.find((c) => c.id === resolvedTarget.carId);
      if (!targetCar) return p;

      const cleaned = removeItemFromAllCars(p, itemId);
      return {
        ...cleaned,
        cars: cleaned.cars.map((c) =>
          c.id === resolvedTarget.carId
            ? { ...c, itemIds: [...c.itemIds, itemId] }
            : c,
        ),
      };
    });
    return;
  }
}

// ===================== Helpers =====================

function locatePassenger(plan: Plan, passengerId: string): PassengerLocation {
  for (const car of plan.cars) {
    if (car.driverId === passengerId) {
      return { kind: 'driver', carId: car.id };
    }
    const idx = car.passengerIds.findIndex((id) => id === passengerId);
    if (idx >= 0) {
      return { kind: 'seat', carId: car.id, seatIndex: idx };
    }
  }
  return { kind: 'staging' };
}

function movePassengerTo(
  plan: Plan,
  passengerId: string,
  source: PassengerLocation,
  target: PassengerLocation,
): Plan {
  let cars = plan.cars;
  cars = clearPassengerAt(cars, source, passengerId);
  cars = setPassengerAt(cars, target, passengerId);
  return { ...plan, cars };
}

function swapPassengers(
  plan: Plan,
  passengerAId: string,
  locA: PassengerLocation,
  passengerBId: string,
  locB: PassengerLocation,
): Plan {
  let cars = plan.cars;
  cars = clearPassengerAt(cars, locA, passengerAId);
  cars = clearPassengerAt(cars, locB, passengerBId);
  cars = setPassengerAt(cars, locB, passengerAId);
  if (locA.kind !== 'staging') {
    cars = setPassengerAt(cars, locA, passengerBId);
  }
  return { ...plan, cars };
}

function clearPassengerAt(
  cars: Car[],
  loc: PassengerLocation,
  passengerId: string,
): Car[] {
  if (loc.kind === 'staging') return cars;
  return cars.map((c) => {
    if (c.id !== loc.carId) return c;
    if (loc.kind === 'driver') {
      return c.driverId === passengerId ? { ...c, driverId: null } : c;
    }
    return {
      ...c,
      passengerIds: c.passengerIds.map((id, i) =>
        i === loc.seatIndex && id === passengerId ? null : id,
      ),
    };
  });
}

function setPassengerAt(
  cars: Car[],
  loc: PassengerLocation,
  passengerId: string,
): Car[] {
  if (loc.kind === 'staging') return cars;
  return cars.map((c) => {
    if (c.id !== loc.carId) return c;
    if (loc.kind === 'driver') {
      return { ...c, driverId: passengerId };
    }
    return {
      ...c,
      passengerIds: c.passengerIds.map((id, i) =>
        i === loc.seatIndex ? passengerId : id,
      ),
    };
  });
}

function removePassengerFromAllCars(plan: Plan, passengerId: string): Plan {
  return {
    ...plan,
    cars: plan.cars.map((c) => ({
      ...c,
      driverId: c.driverId === passengerId ? null : c.driverId,
      passengerIds: c.passengerIds.map((id) => (id === passengerId ? null : id)),
    })),
  };
}

function removeItemFromAllCars(plan: Plan, itemId: string): Plan {
  return {
    ...plan,
    cars: plan.cars.map((c) => ({
      ...c,
      itemIds: c.itemIds.filter((id) => id !== itemId),
    })),
  };
}

/**
 * 規則 2 實作：把人 P 名下物品搬到目標車 X 後車廂
 * 搬的物品條件：
 *   - ownerId === P.id
 *   - 且物品「目前在 sourceLoc 同位置」(同車或備戰區) — 你的回答：備戰區的也跟著走
 *
 * 換句話說：「不動的物品」= 物品目前在「另一台車」(不是 sourceLoc 那台、也不是要去的 X)。
 */
function carryOwnedItems(
  plan: Plan,
  passengerId: string,
  sourceLoc: PassengerLocation,
  targetCarId: string,
): Plan {
  const sourceCarId = sourceLoc.kind === 'staging' ? null : sourceLoc.carId;

  const ownedItemIds = plan.items
    .filter((it) => it.ownerId === passengerId)
    .map((it) => it.id);
  if (ownedItemIds.length === 0) return plan;

  // 計算每個 owned 物品「目前在哪」
  const itemLocation = new Map<string, ItemLocation>();
  for (const iid of ownedItemIds) {
    let found: ItemLocation = { kind: 'staging' };
    for (const c of plan.cars) {
      if (c.itemIds.includes(iid)) {
        found = { kind: 'trunk', carId: c.id };
        break;
      }
    }
    itemLocation.set(iid, found);
  }

  // 要搬的物品：在 staging 或 在 sourceCar 的（不要動已在「其他車」的）
  const carryIds = ownedItemIds.filter((iid) => {
    const loc = itemLocation.get(iid)!;
    if (loc.kind === 'staging') return true;
    return loc.carId === sourceCarId;
  });
  if (carryIds.length === 0) return plan;

  const carrySet = new Set(carryIds);

  return {
    ...plan,
    cars: plan.cars.map((c) => {
      // 從每台車的 trunk 移除要搬的物品
      const cleaned = c.itemIds.filter((iid) => !carrySet.has(iid));
      if (c.id === targetCarId) {
        // 加到目標車
        return { ...c, itemIds: [...cleaned, ...carryIds] };
      }
      return { ...c, itemIds: cleaned };
    }),
  };
}

// 給單元測試/其他模組用
export const __internals = {
  locatePassenger,
  movePassengerTo,
  swapPassengers,
  carryOwnedItems,
};

export type _ItemLocation = ItemLocation;
