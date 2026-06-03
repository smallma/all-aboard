'use client';

import type { JSX } from 'react';

import { clsx } from 'clsx';

import { Avatar } from '@/components/shared/Avatar';
import { AVATAR_LIST } from '@/lib/constants';

type Props = {
  value: string;
  onChange: (avatarId: string) => void;
};

export function AvatarPicker({ value, onChange }: Props): JSX.Element {
  return (
    <div className="max-h-80 overflow-y-auto p-2 grid grid-cols-6 sm:grid-cols-8 gap-2">
      {AVATAR_LIST.map((avatarId) => (
        <button
          key={avatarId}
          type="button"
          title={avatarId}
          onClick={() => onChange(avatarId)}
          className={clsx(
            'rounded-full p-0.5 focus:outline-none focus:ring-2 focus:ring-blue-400',
            value === avatarId && 'ring-2 ring-blue-500',
          )}
        >
          <Avatar avatarId={avatarId} size={48} />
        </button>
      ))}
    </div>
  );
}
