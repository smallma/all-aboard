'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createPlanPersist } from '@/lib/persist';
import { subscribePlans } from '@/lib/cloud-db';
import { loadPlanMetas } from '@/store/actions/plans';
import { usePlanStore } from '@/store/usePlanStore';

/**
 * 編輯中安排的雙向同步：
 *  - 本機變更 → debounce 寫到 Supabase
 *  - Supabase realtime 廣播 → 更新本機 store（過濾自己的回音）
 *  - 卸載 / 切離分頁 → 立即 flush 寫入
 */
export function usePlanSync(): void {
  const persistRef = useRef<ReturnType<typeof createPlanPersist> | null>(null);
  const router = useRouter();

  useEffect(() => {
    const persist = createPlanPersist();
    persistRef.current = persist;

    const unsub = usePlanStore.subscribe(
      (state) => state.currentPlan,
      (plan) => {
        if (plan) persist.schedule(plan);
      },
    );

    // 即時同步：別人改了同一份 plan 就更新本機
    const unsubRealtime = subscribePlans({
      onUpdate: (incoming) => {
        const state = usePlanStore.getState();
        if (state.currentPlanId !== incoming.id) {
          void loadPlanMetas();
          return;
        }
        // echo 過濾：如果 incoming.updatedAt 跟我剛寫的相符（±200ms），略過
        const last = persist.lastSavedAt();
        if (Math.abs(incoming.updatedAt - last) < 200) return;
        state.setCurrentPlan(incoming);
        void loadPlanMetas();
      },
      onInsert: () => {
        void loadPlanMetas();
      },
      onDelete: (deletedId) => {
        const state = usePlanStore.getState();
        if (state.currentPlanId === deletedId) {
          state.pushToast('這份安排已被刪除');
          state.setCurrentPlan(null);
          router.replace('/');
        }
        void loadPlanMetas();
      },
    });

    // 切離分頁時立即寫入
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') {
        persist.flushSync();
      }
    };
    document.addEventListener('visibilitychange', onVisibility);

    const onBeforeUnload = () => {
      persist.flushSync();
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    window.addEventListener('pagehide', onBeforeUnload);

    return () => {
      unsub();
      unsubRealtime();
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('beforeunload', onBeforeUnload);
      window.removeEventListener('pagehide', onBeforeUnload);
      persist.flushSync();
    };
  }, [router]);
}
