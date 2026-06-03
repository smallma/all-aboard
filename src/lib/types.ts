export type Passenger = {
  id: string;
  name: string;
  canDrive: boolean;
  avatarId: string;
};

export type Item = {
  id: string;
  name: string;
  ownerId: string | null;
};

export type CarType = '轎車' | 'MPV' | '貨車' | '皮卡';

export type CarColor = '黑' | '白' | '灰' | '紅' | '藍' | '綠';

export type Car = {
  id: string;
  type: CarType;
  color: CarColor;
  driverId: string | null;
  passengerIds: (string | null)[];
  itemIds: string[];
};

export type Plan = {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  passengers: Passenger[];
  items: Item[];
  cars: Car[];
};

export type SeatLabel =
  | '副駕'
  | '中排-左'
  | '中排-右'
  | '後排-左'
  | '後排-中'
  | '後排-右';

export type SeatPosition = {
  index: number;
  label: SeatLabel;
  xPct: number;
  yPct: number;
};

export type CarSpec = {
  seatCount: number;
  layout: SeatPosition[];
  driverPos: { xPct: number; yPct: number };
  imageBase: string;
  imageMask: string;
  trunkLayout: { xPct: number; yPct: number; wPct: number; hPct: number };
};

export type PlanMeta = Pick<Plan, 'id' | 'name' | 'createdAt' | 'updatedAt'> & {
  passengerCount: number;
  carCount: number;
};
