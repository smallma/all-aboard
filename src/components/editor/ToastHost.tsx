'use client';

import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { usePlanStore } from '@/store/usePlanStore';

const TOAST_DURATION_MS = 2800;

export function ToastHost() {
  const toasts = usePlanStore((s) => s.ui.toasts);
  const dismiss = usePlanStore((s) => s.dismissToast);

  useEffect(() => {
    if (toasts.length === 0) return;
    const newest = toasts[toasts.length - 1];
    const timer = setTimeout(() => dismiss(newest.id), TOAST_DURATION_MS);
    return () => clearTimeout(timer);
  }, [toasts, dismiss]);

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            initial={{ x: 40, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 40, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 24 }}
            className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg shadow"
          >
            {t.message}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
