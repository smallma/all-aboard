import { autoFillPlan } from '@/lib/plan-tools';
import { usePlanStore } from '../usePlanStore';

export function autoFillCurrentPlan(): void {
  const store = usePlanStore.getState();
  const plan = store.currentPlan;
  if (!plan) return;

  if (plan.cars.length === 0) {
    store.pushToast('請先新增車輛');
    return;
  }

  let assignedPassengers = 0;
  let assignedItems = 0;

  store.updateCurrentPlan((current) => {
    const result = autoFillPlan(current);
    assignedPassengers = result.assignedPassengers;
    assignedItems = result.assignedItems;
    return result.plan;
  });

  if (assignedPassengers === 0 && assignedItems === 0) {
    store.pushToast('沒有可自動分配的項目');
    return;
  }

  store.pushToast(`已分配 ${assignedPassengers} 人、${assignedItems} 件裝備`);
}
