import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Plan } from './types';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !key) {
  throw new Error(
    'Missing Supabase environment variables. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local',
  );
}

export type PlanRow = {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
  passengers: Plan['passengers'];
  items: Plan['items'];
  cars: Plan['cars'];
};

export type Database = {
  public: {
    Tables: {
      plans: {
        Row: PlanRow;
        Insert: Omit<PlanRow, 'created_at' | 'updated_at'> & {
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<PlanRow>;
      };
    };
  };
};

let _client: SupabaseClient<Database> | null = null;
export function getSupabase(): SupabaseClient<Database> {
  if (!_client) {
    _client = createClient<Database>(url!, key!, {
      realtime: { params: { eventsPerSecond: 10 } },
    });
  }
  return _client;
}

export function planRowToPlan(row: PlanRow): Plan {
  return {
    id: row.id,
    name: row.name,
    createdAt: new Date(row.created_at).getTime(),
    updatedAt: new Date(row.updated_at).getTime(),
    passengers: row.passengers ?? [],
    items: row.items ?? [],
    cars: row.cars ?? [],
  };
}

export function planToRowInsert(plan: Plan): Database['public']['Tables']['plans']['Insert'] {
  return {
    id: plan.id,
    name: plan.name,
    created_at: new Date(plan.createdAt).toISOString(),
    updated_at: new Date(plan.updatedAt).toISOString(),
    passengers: plan.passengers,
    items: plan.items,
    cars: plan.cars,
  };
}
