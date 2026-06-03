'use client';

import type { JSX } from 'react';

import { AnimatePresence, motion } from 'framer-motion';
import { clsx } from 'clsx';

type Props = {
  title: string;
  onClick?: () => void;
};

export function OwnerBadge({ title, onClick }: Props): JSX.Element {
  const isPlaceholder = title === '請指派司機';
  return (
    <AnimatePresence mode="wait">
      <motion.span
        key={title}
        initial={{ y: -8, opacity: 0, scale: 0.9 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 4, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 22 }}
        className={clsx(
          'inline-flex rounded-full px-3 py-1.5 text-base font-semibold shadow-sm border',
          isPlaceholder
            ? 'bg-amber-50 border-amber-200 text-amber-700'
            : 'bg-white border-slate-300 text-slate-900',
          onClick && 'cursor-pointer hover:shadow-md',
        )}
        onClick={onClick}
      >
        {title}
      </motion.span>
    </AnimatePresence>
  );
}
