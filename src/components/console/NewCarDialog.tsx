'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { clsx } from 'clsx';
import { CAR_COLOR_LIST, CAR_TYPE_LIST, COLOR_HEX } from '@/lib/constants';
import type { CarColor, CarType } from '@/lib/types';
import { addCar } from '@/store/actions/cars';
import { CarBody } from '../canvas/CarBody';
import { Dialog } from '../shared/Dialog';

type Props = {
  open: boolean;
  onClose: () => void;
};

export function NewCarDialog({ open, onClose }: Props) {
  const [type, setType] = useState<CarType>('轎車');
  const [color, setColor] = useState<CarColor>('藍');

  const onConfirm = () => {
    addCar(type, color);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} title="新增車輛" maxWidth="lg">
      <div className="space-y-5">
        {/* 即時預覽 */}
        <div className="flex justify-center">
          <div
            className="relative bg-slate-50 rounded-xl border border-slate-200 p-2"
            style={{ width: 140, height: 240 }}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={`${type}-${color}`}
                className="absolute inset-2"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.18 }}
              >
                <CarBody type={type} color={color} />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">車型</label>
          <div className="grid grid-cols-4 gap-2">
            {CAR_TYPE_LIST.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                className={clsx(
                  'px-3 py-2 rounded-lg border text-sm font-medium transition',
                  type === t
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-slate-200 text-slate-700 hover:bg-slate-50',
                )}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">顏色</label>
          <div className="flex gap-3">
            {CAR_COLOR_LIST.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                aria-label={`${c}色`}
                className={clsx(
                  'w-10 h-10 rounded-full border-2 transition',
                  color === c
                    ? 'ring-2 ring-blue-500 ring-offset-2 border-white'
                    : 'border-slate-200',
                )}
                style={{ backgroundColor: COLOR_HEX[c] }}
              />
            ))}
          </div>
        </div>

        <div className="flex gap-2 justify-end pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-slate-700 hover:bg-slate-100"
          >
            取消
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700"
          >
            建立
          </button>
        </div>
      </div>
    </Dialog>
  );
}
