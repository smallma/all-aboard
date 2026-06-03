'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { Sparkles, FileText, Upload, X } from 'lucide-react';
import { createBlankPlan, createTemplatePlan, importPlanFromText } from '@/store/actions/plans';

type Props = {
  open: boolean;
  onClose: () => void;
};

export function NewPlanDialog({ open, onClose }: Props) {
  const router = useRouter();
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setName('');
    setError(null);
    setBusy(false);
  };

  const close = () => {
    reset();
    onClose();
  };

  const enter = (id: string) => {
    close();
    router.push(`/plan/${id}`);
  };

  const onCreateBlank = async () => {
    setBusy(true);
    setError(null);
    try {
      const plan = await createBlankPlan(name);
      enter(plan.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : '建立失敗');
    } finally {
      setBusy(false);
    }
  };

  const onCreateTemplate = async () => {
    setBusy(true);
    setError(null);
    try {
      const plan = await createTemplatePlan(name);
      enter(plan.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : '建立失敗');
    } finally {
      setBusy(false);
    }
  };

  const onImportFile = async (file: File) => {
    setBusy(true);
    setError(null);
    try {
      const text = await file.text();
      const plan = await importPlanFromText(text);
      enter(plan.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : '匯入失敗');
    } finally {
      setBusy(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={close}
        >
          <motion.div
            className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 relative"
            initial={{ scale: 0.92, y: 10 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.92, y: 10 }}
            transition={{ type: 'spring', stiffness: 260, damping: 22 }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              aria-label="關閉"
              onClick={close}
              className="absolute top-3 right-3 p-1 rounded-lg hover:bg-slate-100"
            >
              <X className="w-4 h-4" />
            </button>
            <h2 className="text-xl font-semibold">建立新安排</h2>
            <input
              type="text"
              placeholder="安排名稱（可選）"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-4 w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
              autoFocus
            />
            <div className="mt-4 grid grid-cols-1 gap-3">
              <ActionRow
                icon={<FileText className="w-5 h-5" />}
                title="+ 空白安排"
                desc="完全空白，自己加人/物品/車"
                onClick={onCreateBlank}
                disabled={busy}
              />
              <ActionRow
                icon={<Sparkles className="w-5 h-5" />}
                title="+ 從範本"
                desc="預設 5 人 + 2 物品，立刻可開始"
                onClick={onCreateTemplate}
                disabled={busy}
              />
              <label
                className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer"
              >
                <Upload className="w-5 h-5" />
                <div className="flex-1">
                  <div className="font-medium">匯入 JSON</div>
                  <div className="text-xs text-slate-500">從先前匯出的 .json 檔載入</div>
                </div>
                <input
                  type="file"
                  accept="application/json,.json"
                  className="hidden"
                  disabled={busy}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) void onImportFile(file);
                  }}
                />
              </label>
            </div>
            {error && (
              <p className="mt-3 text-sm text-red-600 bg-red-50 rounded-lg p-2">{error}</p>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function ActionRow({
  icon,
  title,
  desc,
  onClick,
  disabled,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-left disabled:opacity-50"
    >
      <span className="text-slate-600">{icon}</span>
      <span className="flex-1">
        <span className="block font-medium">{title}</span>
        <span className="block text-xs text-slate-500">{desc}</span>
      </span>
    </button>
  );
}
