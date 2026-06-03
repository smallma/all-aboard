import type { Plan, PlanMeta } from './types';
import { getSupabase, planRowToPlan, planToRowInsert, type PlanRow } from './supabase';
import { planRepo } from './db';

const TABLE = 'plans';
const TABLE_NOT_FOUND_CODE = 'PGRST205';

type MetaSelect = Pick<PlanRow, 'id' | 'name' | 'created_at' | 'updated_at' | 'passengers' | 'cars'>;

let useLocalFallback = false;
let fallbackWarned = false;

function isTableMissingError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const code = Reflect.get(error, 'code');
  if (code === TABLE_NOT_FOUND_CODE) return true;
  const message = Reflect.get(error, 'message');
  return typeof message === 'string' && message.includes("Could not find the table 'public.plans'");
}

function enableLocalFallback(reason: unknown): void {
  useLocalFallback = true;
  if (fallbackWarned) return;
  fallbackWarned = true;
  console.warn('[cloud] public.plans 不存在，已切換為本機儲存模式', reason);
}

export const cloudPlanRepo = {
  async listMeta(): Promise<PlanMeta[]> {
    if (useLocalFallback) {
      return planRepo.listMeta();
    }

    const { data, error } = await getSupabase()
      .from(TABLE)
      .select('id, name, created_at, updated_at, passengers, cars')
      .order('updated_at', { ascending: false });

    if (error) {
      if (isTableMissingError(error)) {
        enableLocalFallback(error);
        return planRepo.listMeta();
      }
      console.error('[cloud] listMeta failed', JSON.stringify(error, null, 2), error);
      return [];
    }

    const rows = (data ?? []) as unknown as MetaSelect[];
    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      createdAt: new Date(row.created_at).getTime(),
      updatedAt: new Date(row.updated_at).getTime(),
      passengerCount: Array.isArray(row.passengers) ? row.passengers.length : 0,
      carCount: Array.isArray(row.cars) ? row.cars.length : 0,
    }));
  },

  async get(id: string): Promise<Plan | undefined> {
    if (useLocalFallback) {
      return planRepo.get(id);
    }

    const { data, error } = await getSupabase()
      .from(TABLE)
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      if (isTableMissingError(error)) {
        enableLocalFallback(error);
        return planRepo.get(id);
      }
      console.error('[cloud] get failed', error);
      return undefined;
    }
    if (!data) return undefined;
    return planRowToPlan(data as unknown as PlanRow);
  },

  async put(plan: Plan): Promise<void> {
    if (useLocalFallback) {
      await planRepo.put(plan);
      return;
    }

    const row = planToRowInsert(plan);
    // 用 any-style cast 因為 supabase-js v2 對 jsonb 欄位的 typed insert 推不出來
    const { error } = await getSupabase()
      .from(TABLE)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .upsert(row as any, { onConflict: 'id' });
    if (error) {
      if (isTableMissingError(error)) {
        enableLocalFallback(error);
        await planRepo.put(plan);
        return;
      }
      console.error('[cloud] put failed', JSON.stringify(error, null, 2), error);
      throw error;
    }
  },

  async delete(id: string): Promise<void> {
    if (useLocalFallback) {
      await planRepo.delete(id);
      return;
    }

    const { error } = await getSupabase().from(TABLE).delete().eq('id', id);
    if (error) {
      if (isTableMissingError(error)) {
        enableLocalFallback(error);
        await planRepo.delete(id);
        return;
      }
      console.error('[cloud] delete failed', error);
      throw error;
    }
  },
};

/**
 * 訂閱 plans 表的即時變動。
 * - INSERT / UPDATE：可能要更新清單頁，或更新 currentPlan（若 id 相符）
 * - DELETE：可能要把使用者踢出（若 currentPlanId 被別人刪）
 *
 * 回傳 unsubscribe 函式。
 */
export function subscribePlans(handlers: {
  onInsert?: (plan: Plan) => void;
  onUpdate?: (plan: Plan) => void;
  onDelete?: (id: string) => void;
}): () => void {
  if (useLocalFallback) {
    return () => undefined;
  }

  const channel = getSupabase()
    .channel('plans-realtime')
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: TABLE },
      (payload) => {
        handlers.onInsert?.(planRowToPlan(payload.new as PlanRow));
      },
    )
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: TABLE },
      (payload) => {
        handlers.onUpdate?.(planRowToPlan(payload.new as PlanRow));
      },
    )
    .on(
      'postgres_changes',
      { event: 'DELETE', schema: 'public', table: TABLE },
      (payload) => {
        const id = (payload.old as { id?: string }).id;
        if (id) handlers.onDelete?.(id);
      },
    )
    .subscribe((status, err) => {
      if (status === 'CHANNEL_ERROR' && err && isTableMissingError(err)) {
        enableLocalFallback(err);
      }
    });

  return () => {
    void getSupabase().removeChannel(channel);
  };
}
