'use client';

import { useEffect, useState } from 'react';
import { Dialog } from '../shared/Dialog';
import { FALLBACK_AVATAR_ID } from '@/lib/constants';
import { AvatarPicker } from './AvatarPicker';
import { addPassenger, removePassenger, updatePassenger } from '@/store/actions/passengers';
import type { Passenger } from '@/lib/types';

type Props = {
  open: boolean;
  onClose: () => void;
  editing?: Passenger | null;
};

export function AddPassengerDialog({ open, onClose, editing }: Props) {
  const [name, setName] = useState('');
  const [canDrive, setCanDrive] = useState(false);
  const [avatarId, setAvatarId] = useState(FALLBACK_AVATAR_ID);

  useEffect(() => {
    if (editing) {
      setName(editing.name);
      setCanDrive(editing.canDrive);
      setAvatarId(editing.avatarId);
    } else {
      setName('');
      setCanDrive(false);
      setAvatarId(FALLBACK_AVATAR_ID);
    }
  }, [editing, open]);

  const onSubmit = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    if (editing) {
      updatePassenger(editing.id, { name: trimmed, canDrive, avatarId });
    } else {
      addPassenger({ name: trimmed, canDrive, avatarId });
    }
    onClose();
  };

  const onDelete = () => {
    if (!editing) return;
    if (window.confirm(`刪除「${editing.name}」？`)) {
      removePassenger(editing.id);
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={onClose} title={editing ? '編輯乘客' : '新增乘客'} maxWidth="lg">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">名字</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
            autoFocus
          />
        </div>

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={canDrive}
            onChange={(e) => setCanDrive(e.target.checked)}
            className="w-4 h-4"
          />
          <span className="text-sm text-slate-700">會開車 💳</span>
        </label>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">選擇頭像</label>
          <div className="border border-slate-200 rounded-lg">
            <AvatarPicker value={avatarId} onChange={setAvatarId} />
          </div>
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
