import type { Item, Passenger, Plan } from './types';

export function buildLineReport(plan: Plan): string {
  const lines: string[] = [];
  const passengerById = new Map(plan.passengers.map((p) => [p.id, p]));
  const itemById = new Map(plan.items.map((it) => [it.id, it]));
  const usedPassengers = new Set<string>();
  const usedItems = new Set<string>();

  plan.cars.forEach((car, index) => {
    const driver = car.driverId ? passengerById.get(car.driverId) ?? null : null;
    if (driver) usedPassengers.add(driver.id);

    const passengers = car.passengerIds
      .map((id) => (id ? passengerById.get(id) ?? null : null))
      .filter((p): p is Passenger => Boolean(p));
    passengers.forEach((p) => usedPassengers.add(p.id));

    const items = car.itemIds
      .map((id) => itemById.get(id) ?? null)
      .filter((it): it is Item => Boolean(it));
    items.forEach((it) => usedItems.add(it.id));

    lines.push(`🚗 【${index + 1}號車】(${driver ? `${driver.name} 的車` : '未指派司機'})`);
    if (car.waypoints.length > 0) {
      lines.push(
        `- 停靠：${car.waypoints
          .map((waypoint, waypointIndex) => `${['A', 'B', 'C'][waypointIndex]} ${waypoint.location}`)
          .join(' → ')}`,
      );
    }
    lines.push(`- 司機：${driver?.name ?? '未指派'}`);
    lines.push(`- 乘客：${passengers.length > 0 ? passengers.map((p) => p.name).join('、') : '無'}`);
    lines.push(`- 裝備：${items.length > 0 ? items.map((it) => it.name).join('、') : '無'}`);
    if (index < plan.cars.length - 1) lines.push('---');
  });

  const waitingPassengers = plan.passengers.filter((p) => !usedPassengers.has(p.id));
  const waitingItems = plan.items.filter((it) => !usedItems.has(it.id));

  if (waitingPassengers.length > 0 || waitingItems.length > 0) {
    if (lines.length > 0) lines.push('---');
    lines.push('🧺 【待分配】');
    lines.push(
      `- 人員：${waitingPassengers.length > 0 ? waitingPassengers.map((p) => p.name).join('、') : '無'}`,
    );
    lines.push(
      `- 裝備：${waitingItems.length > 0 ? waitingItems.map((it) => it.name).join('、') : '無'}`,
    );
  }

  return lines.length > 0 ? lines.join('\n') : '目前還沒有任何車輛安排。';
}

export function autoFillPlan(plan: Plan): { plan: Plan; assignedPassengers: number; assignedItems: number } {
  const usedPassengerIds = getUsedPassengerIds(plan);
  const usedItemIds = getUsedItemIds(plan);
  const passengerCar = getPassengerCarMap(plan);

  const remainingDrivers = shuffle(
    plan.passengers.filter((p) => !usedPassengerIds.has(p.id) && p.canDrive),
  );
  const remainingPassengers = shuffle(
    plan.passengers.filter((p) => !usedPassengerIds.has(p.id) && !p.canDrive),
  );

  let assignedPassengers = 0;
  let cars = plan.cars.map((car) => ({ ...car, passengerIds: [...car.passengerIds], itemIds: [...car.itemIds] }));

  cars = cars.map((car) => {
    if (car.driverId) return car;
    const driver = remainingDrivers.shift();
    if (!driver) return car;
    usedPassengerIds.add(driver.id);
    passengerCar.set(driver.id, car.id);
    assignedPassengers += 1;
    return { ...car, driverId: driver.id };
  });

  const seatCandidates = shuffle([...remainingDrivers, ...remainingPassengers]);
  cars = cars.map((car) => {
    const passengerIds = [...car.passengerIds];
    for (let i = 0; i < passengerIds.length; i += 1) {
      if (passengerIds[i]) continue;
      const passenger = seatCandidates.shift();
      if (!passenger) break;
      usedPassengerIds.add(passenger.id);
      passengerCar.set(passenger.id, car.id);
      passengerIds[i] = passenger.id;
      assignedPassengers += 1;
    }
    return { ...car, passengerIds };
  });

  const availableCarIds = cars.map((car) => car.id);
  let assignedItems = 0;
  const unassignedItems = shuffle(plan.items.filter((it) => !usedItemIds.has(it.id)));

  for (const item of unassignedItems) {
    const targetCarId =
      (item.ownerId ? passengerCar.get(item.ownerId) : undefined) ??
      randomFrom(availableCarIds);
    if (!targetCarId) continue;
    cars = cars.map((car) =>
      car.id === targetCarId && !car.itemIds.includes(item.id)
        ? { ...car, itemIds: [...car.itemIds, item.id] }
        : car,
    );
    usedItemIds.add(item.id);
    assignedItems += 1;
  }

  return { plan: { ...plan, cars }, assignedPassengers, assignedItems };
}

function getUsedPassengerIds(plan: Plan): Set<string> {
  const used = new Set<string>();
  for (const car of plan.cars) {
    if (car.driverId) used.add(car.driverId);
    for (const passengerId of car.passengerIds) {
      if (passengerId) used.add(passengerId);
    }
  }
  return used;
}

function getUsedItemIds(plan: Plan): Set<string> {
  return new Set(plan.cars.flatMap((car) => car.itemIds));
}

function getPassengerCarMap(plan: Plan): Map<string, string> {
  const locations = new Map<string, string>();
  for (const car of plan.cars) {
    if (car.driverId) locations.set(car.driverId, car.id);
    for (const passengerId of car.passengerIds) {
      if (passengerId) locations.set(passengerId, car.id);
    }
  }
  return locations;
}

function shuffle<T>(items: T[]): T[] {
  const next = [...items];
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
}

function randomFrom<T>(items: T[]): T | undefined {
  if (items.length === 0) return undefined;
  return items[Math.floor(Math.random() * items.length)];
}
