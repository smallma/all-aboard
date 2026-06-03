'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, LayoutGrid, List } from 'lucide-react';
import { clsx } from 'clsx';
import { usePlanStore } from '@/store/usePlanStore';
import { loadPlanForEdit } from '@/store/actions/plans';
import { usePlanSync } from '@/hooks/usePlanSync';
import { EditorScreen } from './EditorScreen';

type Props = {
  planId: string;
};

export function EditorPage({ planId }: Props) {
  const router = useRouter();
  const plan = usePlanStore((s) => s.currentPlan);
  const viewMode = usePlanStore((s) => s.ui.viewMode);
  const setViewMode = usePlanStore((s) => s.setViewMode);

  usePlanSync();

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const loaded = await loadPlanForEdit(planId);
      if (!cancelled && !loaded) {
        router.replace('/');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [planId, router]);

  if (!plan) {
    return (
      <main className="min-h-screen flex items-center justify-center text-slate-400">
        載入中…
      </main>
    );
  }

  return (
    <main className="min-h-screen flex flex-col">
      <header className="px-6 py-3 flex items-center gap-3 border-b border-slate-200 bg-white flex-shrink-0">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-slate-500 hover:text-slate-700 text-sm"
        >
          <ChevronLeft className="w-4 h-4" /> 安排清單
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="font-semibold text-slate-900 truncate">{plan.name}</h1>
        </div>
        <div className="hidden sm:block text-xs text-slate-400">
          {plan.passengers.length} 人 · {plan.items.length} 物品 · {plan.cars.length} 車
        </div>
        <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-0.5">
          <button
            type="button"
            onClick={() => setViewMode('visual')}
            aria-pressed={viewMode === 'visual'}
            title="視覺模式"
            className={clsx(
              'inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition',
              viewMode === 'visual'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-700',
            )}
          >
            <LayoutGrid className="w-3.5 h-3.5" /> 視覺
          </button>
          <button
            type="button"
            onClick={() => setViewMode('text')}
            aria-pressed={viewMode === 'text'}
            title="文字模式"
            className={clsx(
              'inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition',
              viewMode === 'text'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-700',
            )}
          >
            <List className="w-3.5 h-3.5" /> 文字
          </button>
        </div>
      </header>
      <EditorScreen plan={plan} />
    </main>
  );
}
