import { cloudPlanRepo } from '@/lib/cloud-db';
import { TEMPLATE_PLAN_DATA } from '@/lib/constants';
import { uuid } from '@/lib/id';
import { parsePlanJson } from '@/lib/import-export';
import type { Plan } from '@/lib/types';
import { usePlanStore } from '../usePlanStore';

async function refreshMetas(): Promise<void> {
  const metas = await cloudPlanRepo.listMeta();
  usePlanStore.getState().setPlanMetas(metas);
}

export async function loadPlanMetas(): Promise<void> {
  await refreshMetas();
}

export async function createBlankPlan(name: string): Promise<Plan> {
  const now = Date.now();
  const plan: Plan = {
    id: uuid(),
    name: name.trim() || '未命名安排',
    createdAt: now,
    updatedAt: now,
    passengers: [],
    items: [],
    cars: [],
  };
  await cloudPlanRepo.put(plan);
  await refreshMetas();
  return plan;
}

export async function createTemplatePlan(name: string): Promise<Plan> {
  const now = Date.now();
  const plan: Plan = {
    id: uuid(),
    name: name.trim() || '範本安排',
    createdAt: now,
    updatedAt: now,
    passengers: TEMPLATE_PLAN_DATA.passengers.map((p) => ({ ...p })),
    items: TEMPLATE_PLAN_DATA.items.map((i) => ({ ...i })),
    cars: TEMPLATE_PLAN_DATA.cars.map((c) => ({
      ...c,
      passengerIds: [...c.passengerIds],
      itemIds: [...c.itemIds],
    })),
  };
  await cloudPlanRepo.put(plan);
  await refreshMetas();
  return plan;
}

export async function duplicatePlan(sourceId: string): Promise<Plan> {
  const src = await cloudPlanRepo.get(sourceId);
  if (!src) throw new Error(`找不到要複製的安排：${sourceId}`);
  const now = Date.now();
  const clone: Plan = {
    ...structuredClone(src),
    id: uuid(),
    name: `${src.name} (副本)`,
    createdAt: now,
    updatedAt: now,
  };
  await cloudPlanRepo.put(clone);
  await refreshMetas();
  return clone;
}

export async function renamePlan(id: string, newName: string): Promise<void> {
  const plan = await cloudPlanRepo.get(id);
  if (!plan) return;
  await cloudPlanRepo.put({ ...plan, name: newName.trim() || plan.name, updatedAt: Date.now() });
  await refreshMetas();
}

export async function deletePlan(id: string): Promise<void> {
  await cloudPlanRepo.delete(id);
  const state = usePlanStore.getState();
  if (state.currentPlanId === id) {
    state.setCurrentPlan(null);
  }
  await refreshMetas();
}

export async function importPlanFromText(text: string): Promise<Plan> {
  const parsed = parsePlanJson(text);
  const now = Date.now();
  const plan: Plan = {
    ...parsed,
    id: uuid(),
    name: `${parsed.name} (匯入)`,
    createdAt: now,
    updatedAt: now,
  };
  await cloudPlanRepo.put(plan);
  await refreshMetas();
  return plan;
}

export async function loadPlanForEdit(id: string): Promise<Plan | null> {
  const plan = await cloudPlanRepo.get(id);
  if (!plan) return null;
  usePlanStore.getState().setCurrentPlan(plan);
  return plan;
}
