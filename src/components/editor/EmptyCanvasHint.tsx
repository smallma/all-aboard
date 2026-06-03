'use client';

import type { JSX } from 'react';

import { motion } from 'framer-motion';
import { Car } from 'lucide-react';

type Props = {
  onAddCarHint?: () => void;
};

export function EmptyCanvasHint({ onAddCarHint }: Props): JSX.Element {
  return (
    <div className="flex flex-col items-center justify-center text-center text-slate-400 gap-2 py-12">
      <motion.div
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
      >
        <Car className="w-16 h-16 text-slate-300" />
      </motion.div>
      <p className="text-lg">畫布是空的</p>
      <p className="text-sm">從右上角「+ 新增車輛」開始打包</p>
      {onAddCarHint && (
        <button
          type="button"
          onClick={onAddCarHint}
          className="mt-4 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm"
        >
          立即新增車輛
        </button>
      )}
    </div>
  );
}
