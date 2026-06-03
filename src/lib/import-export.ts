import type { Car, CarColor, CarType, Item, Passenger, Plan } from './types';

const CAR_TYPES: readonly CarType[] = ['轎車', 'MPV', '貨車', '皮卡'];
const CAR_COLORS: readonly CarColor[] = ['黑', '白', '灰', '紅', '藍', '綠'];

export function exportPlanAsJson(plan: Plan): void {
  const blob = new Blob([JSON.stringify(plan, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${sanitizeFilename(plan.name)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function parsePlanJson(raw: string): Plan {
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    throw new Error('JSON 格式錯誤：無法解析');
  }
  return validatePlanShape(data);
}

function validatePlanShape(data: unknown): Plan {
  if (!isRecord(data)) throw new Error('JSON 格式錯誤：根層不是物件');

  const name = data.name;
  if (typeof name !== 'string' || name.length === 0) {
    throw new Error('JSON 格式錯誤：name 缺失或非字串');
  }

  const passengers = parsePassengers(data.passengers);
  const items = parseItems(data.items);
  const cars = parseCars(data.cars);

  return {
    id: typeof data.id === 'string' ? data.id : '',
    name,
    createdAt: typeof data.createdAt === 'number' ? data.createdAt : Date.now(),
    updatedAt: typeof data.updatedAt === 'number' ? data.updatedAt : Date.now(),
    passengers,
    items,
    cars,
  };
}

function parsePassengers(value: unknown): Passenger[] {
  if (!Array.isArray(value)) throw new Error('JSON 格式錯誤：passengers 必須為陣列');
  return value.map((p, i) => {
    if (!isRecord(p)) throw new Error(`JSON 格式錯誤：passengers[${i}] 非物件`);
    if (typeof p.id !== 'string') throw new Error(`passengers[${i}].id 非字串`);
    if (typeof p.name !== 'string') throw new Error(`passengers[${i}].name 非字串`);
    if (typeof p.canDrive !== 'boolean')
      throw new Error(`passengers[${i}].canDrive 非布林`);
    if (typeof p.avatarId !== 'string')
      throw new Error(`passengers[${i}].avatarId 非字串`);
    return {
      id: p.id,
      name: p.name,
      canDrive: p.canDrive,
      avatarId: p.avatarId,
    };
  });
}

function parseItems(value: unknown): Item[] {
  if (!Array.isArray(value)) throw new Error('JSON 格式錯誤：items 必須為陣列');
  return value.map((it, i) => {
    if (!isRecord(it)) throw new Error(`JSON 格式錯誤：items[${i}] 非物件`);
    if (typeof it.id !== 'string') throw new Error(`items[${i}].id 非字串`);
    if (typeof it.name !== 'string') throw new Error(`items[${i}].name 非字串`);
    const ownerId =
      typeof it.ownerId === 'string' ? it.ownerId : null;
    return { id: it.id, name: it.name, ownerId };
  });
}

function parseCars(value: unknown): Car[] {
  if (!Array.isArray(value)) throw new Error('JSON 格式錯誤：cars 必須為陣列');
  return value.map((c, i) => {
    if (!isRecord(c)) throw new Error(`cars[${i}] 非物件`);
    if (typeof c.id !== 'string') throw new Error(`cars[${i}].id 非字串`);

    if (typeof c.type !== 'string' || !CAR_TYPES.includes(c.type as CarType)) {
      throw new Error(`cars[${i}].type 非合法車型`);
    }
    if (typeof c.color !== 'string' || !CAR_COLORS.includes(c.color as CarColor)) {
      throw new Error(`cars[${i}].color 非合法顏色`);
    }
    if (c.driverId !== null && typeof c.driverId !== 'string') {
      throw new Error(`cars[${i}].driverId 必須為 string 或 null`);
    }
    if (!Array.isArray(c.passengerIds)) {
      throw new Error(`cars[${i}].passengerIds 必須為陣列`);
    }
    if (!Array.isArray(c.itemIds)) {
      throw new Error(`cars[${i}].itemIds 必須為陣列`);
    }

    return {
      id: c.id,
      type: c.type as CarType,
      color: c.color as CarColor,
      driverId: c.driverId,
      passengerIds: c.passengerIds.map((v) =>
        v === null || typeof v === 'string' ? v : null,
      ),
      itemIds: c.itemIds.filter((v): v is string => typeof v === 'string'),
    };
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function sanitizeFilename(name: string): string {
  return name.replace(/[\\/:*?"<>|]/g, '_').trim() || 'wander-fleet-plan';
}
