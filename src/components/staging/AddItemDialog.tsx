'use client';

import { useEffect, useState } from 'react';
import { Dialog } from '../shared/Dialog';
import { addItem, removeItem, updateItem } from '@/store/actions/items';
import { usePlanStore } from '@/store/usePlanStore';
import type { Item } from '@/lib/types';

type Props = {
  open: boolean;
  onClose: () => void;
  editing?: Item | null;
};

export function AddItemDialog({ open, onClose, editing }: Props) {
  const [name, setName] = useState('');
  const [ownerId, setOwnerId] = useState<string | null>(null);
  const passengers = usePlanStore((s) => s.currentPlan?.passengers ?? []);

  useEffect(() => {
    setName(editing?.name ?? '');
    setOwnerId(editing?.ownerId ?? null);
  }, [editing, open]);

  const onSubmit = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    if (editing) {
      updateItem(editing.id, { name: trimmed, ownerId });
    } else {
      addItem({ name: trimmed, ownerId });
    }
    onClose();
  };

  const onDelete = () => {
    if (!editing) return;
    if (window.confirm(`刪除「${editing.name}」？`)) {
      removeItem(editing.id);
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={onClose} title={editing ? '編輯物品' : '新增物品'}>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">物品名稱</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="例如：雞腿、棉被、烤肉架..."
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
            autoFocus
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            主人（誰帶的，可選）
          </label>
          <select
            value={ownerId ?? ''}
            onChange={(e) => setOwnerId(e.target.value || null)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
          >
            <option value="">無主</option>
            {passengers.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-slate-400">
            設定主人後，主人移動時物品會跟著走
          </p>
        </div>

        <div className="flex gap-2 justify-end pt-2">
          {editing && (
            <button
              type="button"
              onClick={onDelete}
              className="px-4 py-2 rounded-lg text-red-600 hover:bg-red-50 mr-auto"
            >
              刪除
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-slate-700 hover:bg-slate-100"
          >
            取消
          </button>
          <button
            type="button"
            onClick={onSubmit}
            disabled={!name.trim()}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {editing ? '儲存' : '新增'}
          </button>
        </div>
      </div>
    </Dialog>
  );
}
