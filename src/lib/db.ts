// ⚠️ DEPRECATED: 本機 Dexie 已被 Supabase (lib/cloud-db.ts) 取代。
// 此檔案保留供未來「離線模式」或「本機快取」用，目前不被任何元件 import。
// 若確認永不回退到本機，可刪除此檔與 dexie 套件。

import Dexie, { type Table } from 'dexie';
import type { Plan, PlanMeta } from './types';

class WanderFleetDB extends Dexie {
  plans!: Table<Plan, string>;

  constructor() {
    super('wander-fleet');
    this.version(1).stores({
      plans: 'id, updatedAt, name',
    });
  }
}

let _db: WanderFleetDB | null = null;
function getDb(): WanderFleetDB {
  if (!_db) _db = new WanderFleetDB();
  return _db;
}

export const planRepo = {
  async listMeta(): Promise<PlanMeta[]> {
    const plans = await getDb().plans.orderBy('updatedAt').reverse().toArray();
    return plans.map((p) => ({
      id: p.id,
      name: p.name,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
      passengerCount: p.passengers.length,
      carCount: p.cars.length,
    }));
  },

  async get(id: string): Promise<Plan | undefined> {
    return getDb().plans.get(id);
  },

  async put(plan: Plan): Promise<void> {
    await getDb().plans.put(plan);
  },

  async delete(id: string): Promise<void> {
    await getDb().plans.delete(id);
  },
};
