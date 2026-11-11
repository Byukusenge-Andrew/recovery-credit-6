'use client';

import React, { useId } from 'react';

interface LogoProps {
  className?: string;
  size?: number; // width in px
  variant?: 'full' | 'icon';
}

/**
 * Recovery Credit emblem.
 * Navy badge + gold ring + green shield + bank card + rising recovery arrow.
 * Drawn on a square 512 grid so the icon never clips; small sizes drop the
 * fine card details so the mark stays legible in headers and favicons.
 */
export default function Logo({ className = '', size = 36, variant = 'icon' }: LogoProps) {
  const uid = useId().replace(/:/g, '');
  const id = (name: string) => `${name}-${uid}`;
  const isFull = variant === 'full';
  const detailed = size >= 40;

  const viewBox = isFull ? '0 0 512 600' : '0 0 512 512';
  const height = isFull ? Math.round(size * (600 / 512)) : size;

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
        <linearGradient id={id('navy')} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#1b334f" />
          <stop offset="55%" stopColor="#0f2038" />
          <stop offset="100%" stopColor="#081321" />
        </linearGradient>
        <linearGradient id={id('gold')} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#f5d77f" />
          <stop offset="45%" stopColor="#c99738" />
          <stop offset="70%" stopColor="#e8c15a" />
          <stop offset="100%" stopColor="#996a1e" />
        </linearGradient>
        <linearGradient id={id('shield')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#145044" />
          <stop offset="60%" stopColor="#0b302a" />
          <stop offset="100%" stopColor="#061c18" />
        </linearGradient>
        <linearGradient id={id('card')} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#1f7a68" />
          <stop offset="100%" stopColor="#0e3a32" />
        </linearGradient>
        <linearGradient id={id('chip')} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ffe89e" />
          <stop offset="100%" stopColor="#b88422" />
        </linearGradient>
        <linearGradient id={id('arrow')} gradientUnits="userSpaceOnUse" x1="140" y1="390" x2="386" y2="160">
          <stop offset="0%" stopColor="#058055" />
          <stop offset="40%" stopColor="#00a86b" />
          <stop offset="75%" stopColor="#25cf82" />
          <stop offset="100%" stopColor="#64f3a9" />
        </linearGradient>
      </defs>

      <g id="logo-emblem">
        {/* Badge */}
        <circle cx="256" cy="256" r="248" fill={`url(#${id('navy')})`} />
        <circle cx="256" cy="256" r="226" fill="none" stroke={`url(#${id('gold')})`} strokeWidth="18" />
        <circle cx="256" cy="256" r="214" fill="#091522" />
        {detailed && <circle cx="256" cy="256" r="198" fill="none" stroke="#254a6d" strokeWidth="3" opacity="0.6" />}

        {/* Shield */}
        <path
          d="M256 92 C302 116 346 126 386 130 L386 236 C386 328 330 390 256 424 C182 390 126 328 126 236 L126 130 C166 126 210 116 256 92 Z"
          fill={`url(#${id('shield')})`}
          stroke="#486985"
          strokeWidth="6"
          strokeLinejoin="round"
        />
        <path
          d="M256 104 C298 126 338 135 374 139 L374 236 C374 318 326 374 268 406 C300 320 290 190 256 104 Z"
          fill="#ffffff"
          opacity="0.05"
        />

        {/* Bank card */}
        <g transform="rotate(-8 248 258)">
          <rect x="148" y="194" width="200" height="128" rx="16" fill={`url(#${id('card')})`} stroke="#2ce59b" strokeOpacity="0.45" strokeWidth="3" />
          <rect x="149.5" y="218" width="197" height="18" fill="#092721" opacity="0.85" />
          <rect x="172" y="252" width="40" height="30" rx="6" fill={`url(#${id('chip')})`} stroke="#744f0b" strokeWidth="1.5" />
          {detailed && (
            <>
              <path d="M172 267 H212 M186 252 V282 M198 252 V282" stroke="#634204" strokeWidth="1.4" opacity="0.6" />
              <rect x="172" y="298" width="40" height="6" rx="3" fill="#a4ebd3" opacity="0.7" />
              <rect x="220" y="298" width="34" height="6" rx="3" fill="#a4ebd3" opacity="0.7" />
              <rect x="262" y="298" width="34" height="6" rx="3" fill="#a4ebd3" opacity="0.7" />
            </>
          )}
        </g>

        {/* Rising recovery arrow: crisp offset shadow, then the swoosh */}
        <g transform="translate(4 7)" opacity="0.55">
          <path d="M140 318 C170 394 288 404 360 216" fill="none" stroke="#031f17" strokeWidth="30" strokeLinecap="round" />
          <path d="M381 160 L391 231 L326 206 Z" fill="#031f17" strokeLinejoin="round" />
        </g>
        <path d="M140 318 C170 394 288 404 360 216" fill="none" stroke={`url(#${id('arrow')})`} strokeWidth="30" strokeLinecap="round" />
        <path d="M381 160 L391 231 L326 206 Z" fill="#64f3a9" stroke="#64f3a9" strokeWidth="6" strokeLinejoin="round" />
        <path d="M150 322 C182 380 276 384 338 236" fill="none" stroke="#ffffff" strokeWidth="5" strokeLinecap="round" opacity="0.22" />
      </g>

      {isFull && (
        <text
          x="256"
          y="572"
          textAnchor="middle"
          style={{
            fontFamily: 'Montserrat, "Arial Black", -apple-system, sans-serif',
            fontWeight: 800,
            fontSize: '44px',
            letterSpacing: '0.04em',
            fill: '#0c2340',
          }}
        >
          RECOVERY CREDIT
        </text>
      )}
    </svg>
  );
}
