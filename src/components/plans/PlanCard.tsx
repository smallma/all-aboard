'use client';

import { useRouter } from 'next/navigation';
import { Copy, Download, Pencil, Trash2, Users, Car as CarIcon } from 'lucide-react';
import { clsx } from 'clsx';
import type { PlanMeta } from '@/lib/types';
import { duplicatePlan, deletePlan, loadPlanForEdit, renamePlan } from '@/store/actions/plans';
import { exportPlanAsJson } from '@/lib/import-export';
import { cloudPlanRepo } from '@/lib/cloud-db';

type Props = {
  meta: PlanMeta;
};

export function PlanCard({ meta }: Props) {
  const router = useRouter();

  const onEnter = async () => {
    await loadPlanForEdit(meta.id);
    router.push(`/plan/${meta.id}`);
  };

  const stop = (e: React.MouseEvent) => e.stopPropagation();

  const onDuplicate = async (e: React.MouseEvent) => {
    stop(e);
    await duplicatePlan(meta.id);
  };

  const onDelete = async (e: React.MouseEvent) => {
    stop(e);
    const ok = confirm(`確定要刪除「${meta.name}」？`);
    if (ok) await deletePlan(meta.id);
  };

  const onRename = async (e: React.MouseEvent) => {
    stop(e);
    const name = prompt('新名稱', meta.name);
    if (name !== null) await renamePlan(meta.id, name);
  };

  const onExport = async (e: React.MouseEvent) => {
    stop(e);
    const plan = await cloudPlanRepo.get(meta.id);
    if (plan) exportPlanAsJson(plan);
  };

  return (
    <div
      onClick={onEnter}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') void onEnter();
      }}
      className={clsx(
        'group w-full rounded-2xl bg-white border border-slate-200',
        'p-5 cursor-pointer transition',
        'hover:shadow-lg hover:border-slate-300',
        'focus-within:ring-2 focus-within:ring-blue-400',
      )}
    >
      <h3 className="font-semibold text-lg text-slate-900 break-words leading-tight">
        {meta.name}
      </h3>

      <div className="mt-3 flex gap-4 text-sm text-slate-500">
        <span className="inline-flex items-center gap-1">
          <Users className="w-4 h-4" /> {meta.passengerCount} 人
        </span>
        <span className="inline-flex items-center gap-1">
          <CarIcon className="w-4 h-4" /> {meta.carCount} 車
        </span>
      </div>

      <p className="mt-2 text-xs text-slate-400">
        最後修改：{new Date(meta.updatedAt).toLocaleString('zh-Hant')}
      </p>

      <div className="mt-4 pt-3 border-t border-slate-100 flex gap-1 justify-end">
        <IconBtn onClick={onRename} label="重新命名">
          <Pencil className="w-4 h-4" />
        </IconBtn>
        <IconBtn onClick={onDuplicate} label="複製">
          <Copy className="w-4 h-4" />
        </IconBtn>
        <IconBtn onClick={onExport} label="匯出">
          <Download className="w-4 h-4" />
        </IconBtn>
        <IconBtn onClick={onDelete} label="刪除" danger>
          <Trash2 className="w-4 h-4" />
        </IconBtn>
      </div>
    </div>
  );
}

function IconBtn({
  onClick,
  label,
  danger,
  children,
}: {
  onClick: (e: React.MouseEvent) => void;
  label: string;
  danger?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className={clsx(
        'p-1.5 rounded-lg text-slate-500',
        'hover:bg-slate-100',
        danger && 'hover:bg-red-50 hover:text-red-600',
      )}
    >
      {children}
    </button>
  );
}
