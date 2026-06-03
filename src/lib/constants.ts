import type { CarColor, CarSpec, CarType, Plan } from './types';

export const COLOR_HEX: Record<CarColor, string> = {
  黑: '#1f2937',
  白: '#f9fafb',
  灰: '#9ca3af',
  紅: '#ef4444',
  藍: '#3b82f6',
  綠: '#22c55e',
};

export const CAR_COLOR_LIST: CarColor[] = ['黑', '白', '灰', '紅', '藍', '綠'];
export const CAR_TYPE_LIST: CarType[] = ['轎車', 'MPV', '貨車', '皮卡'];

// 座標來自 docs/agents/seat-coordinates.json (codex 量測，已 review APPROVED)
export const CAR_SPECS: Record<CarType, CarSpec> = {
  轎車: {
    seatCount: 4,
    driverPos: { xPct: 37, yPct: 48 },
    layout: [
      { index: 0, label: '副駕', xPct: 62, yPct: 48 },
      { index: 1, label: '後排-左', xPct: 37, yPct: 64 },
      { index: 2, label: '後排-中', xPct: 50, yPct: 67 },
      { index: 3, label: '後排-右', xPct: 63, yPct: 64 },
    ],
    trunkLayout: { xPct: 50, yPct: 80, wPct: 50, hPct: 17 },
    imageBase: '/vehicles/sedan-base.png',
    imageMask: '/vehicles/sedan-mask.png',
  },
  MPV: {
    seatCount: 6,
    driverPos: { xPct: 37, yPct: 43 },
    layout: [
      { index: 0, label: '副駕', xPct: 62, yPct: 43 },
      { index: 1, label: '中排-左', xPct: 37, yPct: 57 },
      { index: 2, label: '中排-右', xPct: 62, yPct: 57 },
      { index: 3, label: '後排-左', xPct: 37, yPct: 74 },
      { index: 4, label: '後排-中', xPct: 50, yPct: 76 },
      { index: 5, label: '後排-右', xPct: 63, yPct: 74 },
    ],
    trunkLayout: { xPct: 50, yPct: 91, wPct: 48, hPct: 8 },
    imageBase: '/vehicles/mpv-base.png',
    imageMask: '/vehicles/mpv-mask.png',
  },
  貨車: {
    seatCount: 1,
    driverPos: { xPct: 37, yPct: 39 },
    layout: [{ index: 0, label: '副駕', xPct: 62, yPct: 39 }],
    trunkLayout: { xPct: 50, yPct: 67, wPct: 57, hPct: 45 },
    imageBase: '/vehicles/cargo-van-base.png',
    imageMask: '/vehicles/cargo-van-mask.png',
  },
  皮卡: {
    seatCount: 1,
    driverPos: { xPct: 37, yPct: 44 },
    layout: [{ index: 0, label: '副駕', xPct: 62, yPct: 44 }],
    trunkLayout: { xPct: 50, yPct: 77, wPct: 58, hPct: 34 },
    imageBase: '/vehicles/pickup-truck-base.png',
    imageMask: '/vehicles/pickup-truck-mask.png',
  },
};

// avatar 池：從 public/avatars/manifest.json 來源彙整
// animal-01 ~ animal-12, asian-01 ~ asian-12, avatar-01 ~ avatar-64，共 88 張
function buildAvatarList(): string[] {
  const ids: string[] = [];
  for (let i = 1; i <= 12; i += 1) {
    ids.push(`animal-${String(i).padStart(2, '0')}`);
  }
  for (let i = 1; i <= 12; i += 1) {
    ids.push(`asian-${String(i).padStart(2, '0')}`);
  }
  for (let i = 1; i <= 64; i += 1) {
    ids.push(`avatar-${String(i).padStart(2, '0')}`);
  }
  return ids;
}

export const AVATAR_LIST: string[] = buildAvatarList();
export const FALLBACK_AVATAR_ID = 'avatar-01';

export function avatarSrc(avatarId: string): string {
  return `/avatars/${avatarId}.png`;
}

export const TEMPLATE_PLAN_DATA: Omit<Plan, 'id' | 'createdAt' | 'updatedAt'> = {
  name: '範本安排',
  passengers: [
    { id: 'p-rain', name: 'Rain', canDrive: true, avatarId: 'avatar-01' },
    { id: 'p-s', name: 'S', canDrive: false, avatarId: 'animal-02' },
    { id: 'p-n', name: 'N', canDrive: true, avatarId: 'asian-03' },
    { id: 'p-l', name: 'L', canDrive: false, avatarId: 'avatar-04' },
    { id: 'p-ming', name: 'Ming', canDrive: false, avatarId: 'animal-05' },
  ],
  items: [
    { id: 'i-luggage', name: '28吋大行李', ownerId: 'p-rain' },
    { id: 'i-grill', name: '烤肉架', ownerId: null },
  ],
  cars: [],
};
