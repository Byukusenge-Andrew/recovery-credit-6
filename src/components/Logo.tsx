'use client';

import React, { useId } from 'react';

interface LogoProps {
  className?: string;
  size?: number; // width in px
  variant?: 'full' | 'icon';
}

/**
 * Recovery Credit mark: navy tile, gold recovery arrow circling three rising
 * credit bars. Drawn on a square 512 grid (public/logo.svg is the same art);
 * small sizes drop the sheen and inner keyline so the mark stays crisp.
 */
export default function Logo({ className = '', size = 36, variant = 'icon' }: LogoProps) {
  const uid = useId().replace(/:/g, '');
  const id = (name: string) => `${name}-${uid}`;
  const isFull = variant === 'full';
  const detailed = size >= 40;

  const viewBox = isFull ? '0 0 512 600' : '0 0 512 512';
  const height = isFull ? Math.round(size * (600 / 512)) : size;
  const gold = `url(#${id('gold')})`;
  const silver = `url(#${id('silver')})`;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={viewBox}
      width={size}
      height={height}
      className={className}
      role="img"
      aria-label="Recovery Credit"
    >
      <defs>
        <linearGradient id={id('tile')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#17345a" />
          <stop offset="1" stopColor="#0a1a30" />
        </linearGradient>
        <linearGradient id={id('gold')} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f3d68a" />
          <stop offset="0.45" stopColor="#d4a446" />
          <stop offset="0.7" stopColor="#e9c46c" />
          <stop offset="1" stopColor="#a8761f" />
        </linearGradient>
        <linearGradient id={id('silver')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor="#c9d3e0" />
        </linearGradient>
        <linearGradient id={id('sheen')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.10" />
          <stop offset="0.5" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
      </defs>

      <rect x="8" y="8" width="496" height="496" rx="112" fill={`url(#${id('tile')})`} />
      {detailed && (
        <>
          <rect x="8" y="8" width="496" height="496" rx="112" fill={`url(#${id('sheen')})`} />
          <rect x="30" y="30" width="452" height="452" rx="92" fill="none" stroke="#d4a446" strokeOpacity="0.35" strokeWidth="3" />
        </>
      )}

      {/* Recovery arrow */}
      <path d="M313.9 132.1 A132 132 0 1 0 373.1 271.4" fill="none" stroke={gold} strokeWidth="38" />
      <path d="M422 281.8 L387.7 203 L324.2 261 Z" fill={gold} stroke={gold} strokeWidth="4" strokeLinejoin="round" />

      {/* Rising credit bars */}
      <rect x="178" y="266" width="34" height="54" rx="5" fill={silver} />
      <rect x="227" y="232" width="34" height="88" rx="5" fill={silver} />
      <rect x="276" y="196" width="34" height="124" rx="5" fill={gold} />

      {isFull && (
        <text
          x="256"
          y="574"
          textAnchor="middle"
          fontFamily="Inter, 'Segoe UI', Arial, sans-serif"
          fontWeight="700"
          fontSize="42"
          letterSpacing="3"
          fill="#0c2340"
        >
          RECOVERY CREDIT
        </text>
      )}
    </svg>
  );
}
