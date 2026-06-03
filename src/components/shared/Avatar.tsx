import type { JSX } from 'react';
import Image from 'next/image';

import { clsx } from 'clsx';

import { AVATAR_LIST, FALLBACK_AVATAR_ID, avatarSrc } from '@/lib/constants';

type Props = {
  avatarId: string;
  size?: number;
  className?: string;
};

function resolveAvatarId(avatarId: string): string {
  if (AVATAR_LIST.includes(avatarId)) {
    return avatarId;
  }

  return FALLBACK_AVATAR_ID;
}

export function Avatar({ avatarId, size = 40, className }: Props): JSX.Element {
  const resolvedAvatarId = resolveAvatarId(avatarId);

  return (
    <Image
      src={avatarSrc(resolvedAvatarId)}
      alt="avatar"
      width={size}
      height={size}
      className={clsx('rounded-full object-cover overflow-hidden', className)}
    />
  );
}
