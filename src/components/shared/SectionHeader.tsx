import type { JSX, ReactNode } from 'react';

import { clsx } from 'clsx';

type Props = {
  title: string;
  count?: number;
  action?: ReactNode;
};

export function SectionHeader({ title, count, action }: Props): JSX.Element {
  const titleText = count !== undefined ? `${title}（${count}）` : title;

  return (
    <header className={clsx('flex items-center justify-between mb-2 px-1')}>
      <h3 className="text-xs font-semibold text-slate-500">{titleText}</h3>
      {action}
    </header>
  );
}
