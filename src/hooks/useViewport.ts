'use client';

import { useEffect, useState } from 'react';

export type Viewport = 'mobile' | 'tablet' | 'desktop';

function detect(): Viewport {
  if (typeof window === 'undefined') return 'desktop';
  const w = window.innerWidth;
  if (w < 768) return 'mobile';
  if (w < 1024) return 'tablet';
  return 'desktop';
}

export function useViewport(): Viewport {
  const [vp, setVp] = useState<Viewport>('desktop');

  useEffect(() => {
    const update = () => setVp(detect());
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  return vp;
}
