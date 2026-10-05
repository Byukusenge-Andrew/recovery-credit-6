'use client';

import { Category } from '@/lib/types';
import { getCategoryInfo } from '@/lib/constants';

interface CategoryBadgeProps {
  category?: Category;
  categoryId?: Category;
}

export default function CategoryBadge({ category, categoryId }: CategoryBadgeProps) {
  const cat = category || categoryId || 'paying';
  const info = getCategoryInfo(cat);

  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium"
      style={{ backgroundColor: info.bgLight, color: info.color }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: info.color }}></span>
      <span>{info.label}</span>
    </span>
  );
}

export { CategoryBadge };
