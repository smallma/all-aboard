import type { Car, Plan, Waypoint } from './types';

export function normalizePlan(plan: Plan): Plan {
  return {
    ...plan,
    cars: plan.cars.map(normalizeCar),
  };
}

export function normalizeCar(car: Car): Car {
  return {
    ...car,
    passengerIds: [...car.passengerIds],
    itemIds: [...car.itemIds],
    waypoints: normalizeWaypoints((car as Car & { waypoints?: unknown }).waypoints),
  };
}

function normalizeWaypoints(value: unknown): Waypoint[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((waypoint, index) => {
      if (!isRecord(waypoint)) return null;
      const location = typeof waypoint.location === 'string' ? waypoint.location.trim() : '';
      if (!location) return null;
      return {
        id: typeof waypoint.id === 'string' && waypoint.id ? waypoint.id : `wp-${index + 1}`,
        label: typeof waypoint.label === 'string' && waypoint.label ? waypoint.label : waypointLabel(index),
        location,
      };
    })
    .filter((waypoint): waypoint is Waypoint => Boolean(waypoint))
    .slice(0, 3);
}

export function waypointLabel(index: number): string {
  return ['A點', 'B點', 'C點'][index] ?? `${index + 1}點`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
