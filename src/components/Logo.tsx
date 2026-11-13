'use client';

import React from 'react';

interface LogoProps {
  className?: string;
  size?: number; // width in px
  variant?: 'full' | 'icon';
}

// Bureau of Debt Collection Agency Ltd mark, traced from the company logo.
// Paths are in the original artwork's pixel space; public/logo.svg and the app
// icons are generated from the same paths.
const BLUE = '#0078FF';
const INK = '#0B0B0C';
const PATHS = {
  blue: 'M145.5 22 L145.5 99 L78 173.5 L126 111 L126 47.5 Z',
  stroke: 'M195.5 66 L146.5 127.5 L133.5 143.5 L119.5 165.5 L115.5 176.5 L95 176.5 Z',
  leg: 'M148 121 L162 107.5 L199 176.5 L178.5 176.5 Z',
  bar: 'M131 145.5 L164 145.5 L173.5 162.5 L118 162.5 Z',
};

/**
 * Company mark. `icon` is the square mark (headers, sidebar); `full` adds the
 * two-line company name underneath, like the original logo.
 */
export default function Logo({ className = '', size = 36, variant = 'icon' }: LogoProps) {
  const isFull = variant === 'full';
  // Square box centred on the mark; the full lockup extends down for the name.
  const viewBox = isFull ? '20 14 237 214' : '57 17.75 163 163';
  const height = isFull ? Math.round(size * (214 / 237)) : size;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={viewBox}
      width={size}
      height={height}
      className={className}
      role="img"
      aria-label="Bureau of Debt Collection Agency Ltd"
    >
      <path d={PATHS.blue} fill={BLUE} />
      <path d={PATHS.stroke} fill={INK} />
      <path d={PATHS.leg} fill={INK} />
      <path d={PATHS.bar} fill={INK} />
      {isFull && (
        <g
          fontFamily="Montserrat, 'Arial Black', 'Segoe UI', Arial, sans-serif"
          fontWeight={800}
          fill={INK}
          textAnchor="middle"
        >
          <text x="138.5" y="199" fontSize="16">BUREAU OF DEBT</text>
          <text x="138.5" y="219" fontSize="14.5">COLLECTION AGENCY LTD</text>
        </g>
      )}
    </svg>
  );
}

/**
 * App name (CRM6) with the company name underneath.
 * `size="md"` for page headers, `size="sm"` for compact headers.
 */
export function BrandWordmark({ className = 'flex', size = 'sm' }: { className?: string; size?: 'sm' | 'md' }) {
  const top = size === 'md' ? 'text-[17px]' : 'text-[15px]';
  const bottom = size === 'md' ? 'text-[10px]' : 'text-[8.5px]';
  // className carries the display utility (default `flex`, e.g. `hidden sm:flex`).
  return (
    <span className={`flex-col min-w-0 leading-[1.1] whitespace-nowrap ${className}`}>
      <span className={`${top} font-extrabold tracking-tight text-slate-900`}>CRM6</span>
      <span className={`${bottom} font-semibold uppercase tracking-tight text-slate-500 truncate`}>Bureau of Debt Collection Agency</span>
    </span>
  );
}
