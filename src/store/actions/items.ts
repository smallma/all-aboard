import { uuid } from '@/lib/id';
import type { Item, Plan } from '@/lib/types';
import { usePlanStore } from '../usePlanStore';

function findOwnerCarId(plan: Plan, ownerId: string): string | null {
  for (const car of plan.cars) {
    if (car.driverId === ownerId) return car.id;
    if (car.passengerIds.includes(ownerId)) return car.id;
  }
  return null;
}

function update(updater: (plan: Plan) => Plan): void {
  usePlanStore.getState().updateCurrentPlan(updater);
}

export function addItem(input: { name: string; ownerId?: string | null }): string {
  const id = uuid();
  const ownerId = input.ownerId ?? null;
  update((plan) => {
    const newItem = { id, name: input.name.trim() || '未命名物品', ownerId };
    const ownerCarId = ownerId ? findOwnerCarId(plan, ownerId) : null;
    return {
      ...plan,
      items: [...plan.items, newItem],
      cars: ownerCarId
        ? plan.cars.map((c) =>
            c.id === ownerCarId ? { ...c, itemIds: [...c.itemIds, id] } : c,
          )
        : plan.cars,
    };
  });
  return id;
}

export function updateItem(id: string, patch: Partial<Omit<Item, 'id'>>): void {
  update((plan) => {
    const nextItems = plan.items.map((i) => (i.id === id ? { ...i, ...patch } : i));

    // ownerId 沒有變動，只更新其他欄位（例如 name），車廂不動
    if (!('ownerId' in patch)) {
      return { ...plan, items: nextItems };
    }

    // ownerId 有變動（含設為 null）：先從所有車廂移除，再依新主人位置放入
    const carsWithoutItem = plan.cars.map((c) => ({
      ...c,
      itemIds: c.itemIds.filter((iid) => iid !== id),
    }));

    const newOwnerId = patch.ownerId ?? null;
    const ownerCarId = newOwnerId ? findOwnerCarId(plan, newOwnerId) : null;

    return {
      ...plan,
      items: nextItems,
      cars: ownerCarId
        ? carsWithoutItem.map((c) =>
            c.id === ownerCarId ? { ...c, itemIds: [...c.itemIds, id] } : c,
          )
        : carsWithoutItem,
    };
  });
}

export function removeItem(id: string): void {
  update((plan) => ({
    ...plan,
    items: plan.items.filter((i) => i.id !== id),
    cars: plan.cars.map((c) => ({
      ...c,
      itemIds: c.itemIds.filter((iid) => iid !== id),
    })),
  }));
}
