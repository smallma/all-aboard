import type { JSX } from 'react';
import Image from 'next/image';
import { CAR_SPECS, COLOR_HEX } from '@/lib/constants';
import type { CarColor, CarType } from '@/lib/types';

type Props = {
  type: CarType;
  color: CarColor;
};

export function CarBody({ type, color }: Props): JSX.Element {
  const spec = CAR_SPECS[type];
  const tint = COLOR_HEX[color];

  return (
    <div className="relative w-full h-full pointer-events-none select-none">
      <Image
        src={spec.imageBase}
        alt={`${type} 車身`}
        fill
        priority
        sizes="(max-width: 768px) 80vw, (max-width: 1024px) 40vw, 320px"
        className="object-contain"
      />
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          backgroundColor: tint,
          WebkitMaskImage: `url(${spec.imageMask})`,
          maskImage: `url(${spec.imageMask})`,
          WebkitMaskSize: 'contain',
          maskSize: 'contain',
          WebkitMaskRepeat: 'no-repeat',
          maskRepeat: 'no-repeat',
          WebkitMaskPosition: 'center',
          maskPosition: 'center',
          mixBlendMode: 'multiply',
        }}
      />
    </div>
  );
}
