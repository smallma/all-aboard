'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, Plus, UserPlus, PackagePlus } from 'lucide-react';
import { clsx } from 'clsx';
import { usePlanStore } from '@/store/usePlanStore';
import { NewCarDialog } from './NewCarDialog';

type Props = {
  onAddPassenger: () => void;
  onAddItem: () => void;
};

export function ControlConsole({ onAddPassenger, onAddItem }: Props) {
  const collapsed = usePlanStore((s) => s.ui.consoleCollapsed);
  const setCollapsed = usePlanStore((s) => s.setConsoleCollapsed);
  const [carDialogOpen, setCarDialogOpen] = useState(false);

  return (
    <aside
      className={clsx(
        'flex-shrink-0 bg-white border-r border-slate-200 flex flex-col transition-all',
        collapsed ? 'w-12' : 'w-60',
      )}
    >
      <header className="px-2 py-2 flex items-center justify-between border-b border-slate-100">
        {!collapsed && <span className="text-sm font-semibold text-slate-700 pl-2">控制台</span>}
        <button
          type="button"
          onClick={() => setCollapsed(!collapsed)}
          aria-label={collapsed ? '展開控制台' : '收合控制台'}
          className="p-1.5 rounded-lg hover:bg-slate-100"
        >
          <ChevronLeft
            className={clsx(
              'w-4 h-4 transition-transform text-slate-500',
              collapsed && 'rotate-180',
            )}
          />
        </button>
      </header>

      {!collapsed && (
        <div className="p-4 space-y-3">
          <motion.button
            type="button"
            onClick={() => setCarDialogOpen(true)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full flex items-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white font-medium shadow-lg shadow-blue-500/30"
          >
            <Plus className="w-5 h-5" /> 新增車輛
          </motion.button>

          <button
            type="button"
            onClick={onAddPassenger}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 text-sm"
          >
            <UserPlus className="w-4 h-4" /> 新增乘客
          </button>

          <button
            type="button"
            onClick={onAddItem}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 text-sm"
          >
            <PackagePlus className="w-4 h-4" /> 新增物品
          </button>
        </div>
      )}

      <NewCarDialog open={carDialogOpen} onClose={() => setCarDialogOpen(false)} />
    </aside>
  );
}
