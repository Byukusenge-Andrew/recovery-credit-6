'use client';

import { ColorFlag } from '@/lib/types';
import { getFlagInfo } from '@/lib/constants';

export default function FlagDot({ flag }: { flag: ColorFlag }) {
  const info = getFlagInfo(flag);
  
  const bgColor = flag === 'none' ? '#9ca3af' : info.color;
  
  return (
    <span 
      className="inline-block rounded-full w-[14px] h-[14px] shadow-sm border border-gray-200"
      style={{ backgroundColor: bgColor }}
      title={info.label}
    />
  );
}
