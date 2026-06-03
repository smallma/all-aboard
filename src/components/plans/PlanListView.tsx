'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import { usePlanStore } from '@/store/usePlanStore';
import { loadPlanMetas } from '@/store/actions/plans';
import { subscribePlans } from '@/lib/cloud-db';
import { PlanCard } from './PlanCard';
import { NewPlanDialog } from './NewPlanDialog';

export function PlanListView() {
  const metas = usePlanStore((s) => s.planMetas);
  const metasLoaded = usePlanStore((s) => s.metasLoaded);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    void loadPlanMetas();
    const unsub = subscribePlans({
      onInsert: () => void loadPlanMetas(),
      onUpdate: () => void loadPlanMetas(),
      onDelete: () => void loadPlanMetas(),
    });
    return unsub;
  }, []);

  return (
    <main className="min-h-screen px-6 py-10 max-w-5xl mx-auto">
      <header className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Wander-Fleet</h1>
          <p className="mt-1 text-sm text-slate-500">出遊車位動態分配 — 微縮汽車打包模擬器</p>
        </div>
        <button
          onClick={() => setDialogOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white font-medium shadow hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" /> 新增安排
        </button>
      </header>

      {!metasLoaded ? (
        <p className="text-slate-400">載入中…</p>
      ) : metas.length === 0 ? (
        <EmptyState onCreate={() => setDialogOpen(true)} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {metas.map((meta) => (
            <motion.div
              key={meta.id}
              layout
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ type: 'spring', stiffness: 240, damping: 22 }}
            >
              <PlanCard meta={meta} />
            </motion.div>
          ))}
        </div>
      )}

      <NewPlanDialog open={dialogOpen} onClose={() => setDialogOpen(false)} />
    </main>
  );
}

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="border-2 border-dashed border-slate-200 rounded-2xl p-12 text-center">
      <p className="text-lg text-slate-700">還沒有任何安排</p>
      <p className="mt-1 text-sm text-slate-500">建立你的第一個安排來開始打包</p>
      <button
        onClick={onCreate}
        className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white font-medium shadow hover:bg-blue-700"
      >
        <Plus className="w-4 h-4" /> 立刻建立
      </button>
    </div>
  );
}
