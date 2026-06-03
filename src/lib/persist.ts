import { cloudPlanRepo } from './cloud-db';
import type { Plan } from './types';

const DEBOUNCE_MS = 250;

type PersistController = {
  schedule: (plan: Plan) => void;
  flush: () => Promise<void>;
  flushSync: () => void;
  /** 最近一次本機寫出的 plan.updatedAt（給 realtime 過濾自己廣播用） */
  lastSavedAt: () => number;
};

export function createPlanPersist(): PersistController {
  let timer: ReturnType<typeof setTimeout> | null = null;
  let pending: Plan | null = null;
  let saving: Promise<void> = Promise.resolve();
  let lastSaved = 0;

  async function write(plan: Plan): Promise<void> {
    const stamped: Plan = { ...plan, updatedAt: Date.now() };
    lastSaved = stamped.updatedAt;
    await cloudPlanRepo.put(stamped);
  }

  function consumePendingToWrite(): void {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
    if (pending) {
      const target = pending;
      pending = null;
      saving = saving.then(() => write(target)).catch((err) => {
        console.error('[persist] put plan failed', err);
      });
    }
  }

  return {
    schedule(plan: Plan) {
      pending = plan;
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        timer = null;
        const target = pending;
        pending = null;
        if (target) {
          saving = saving.then(() => write(target)).catch((err) => {
            console.error('[persist] put plan failed', err);
          });
        }
      }, DEBOUNCE_MS);
    },

    async flush() {
      consumePendingToWrite();
      await saving;
    },

    flushSync() {
      consumePendingToWrite();
    },

    lastSavedAt: () => lastSaved,
  };
}
