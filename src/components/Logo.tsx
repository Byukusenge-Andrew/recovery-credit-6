'use client';

import React from 'react';

interface LogoProps {
  className?: string;
  size?: number; // width in px
  variant?: 'full' | 'icon';
}

export default function Logo({ className = '', size = 36, variant = 'icon' }: LogoProps) {
  // If variant is 'icon', we view just the emblem badge (0 100 800 500)
  // If variant is 'full', we view the full 800x900 canvas with typography
  const viewBox = variant === 'icon' ? '140 100 520 460' : '0 0 800 780';
  const height = variant === 'icon' ? Math.round(size * (460 / 520)) : Math.round(size * (780 / 800));

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={viewBox}
      width={size}
      height={height}
      className={className}
    >
      <defs>
        <radialGradient id="bg-glow-c" cx="50%" cy="40%" r="50%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#f4f7fa" />
        </radialGradient>

        <linearGradient id="gold-grad-c" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f5d77f" />
          <stop offset="45%" stopColor="#c99738" />
          <stop offset="70%" stopColor="#e8c15a" />
          <stop offset="100%" stopColor="#996a1e" />
        </linearGradient>

        <linearGradient id="navy-grad-c" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1b334f" />
          <stop offset="50%" stopColor="#0f2038" />
          <stop offset="100%" stopColor="#081321" />
        </linearGradient>

        <linearGradient id="shield-grad-c" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#145044" />
          <stop offset="60%" stopColor="#0b302a" />
          <stop offset="100%" stopColor="#061c18" />
        </linearGradient>

        <linearGradient id="card-grad-c" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1f7a68" />
          <stop offset="100%" stopColor="#0e3a32" />
        </linearGradient>

        <linearGradient id="arrow-grad-c" x1="0%" y1="100%" x2="80%" y2="0%">
          <stop offset="0%" stopColor="#058055" />
          <stop offset="35%" stopColor="#00a86b" />
          <stop offset="70%" stopColor="#25cf82" />
          <stop offset="100%" stopColor="#64f3a9" />
        </linearGradient>

        <linearGradient id="chip-grad-c" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ffe89e" />
          <stop offset="100%" stopColor="#b88422" />
        </linearGradient>

        <filter id="badge-shadow-c" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="16" stdDeviation="20" floodColor="#0b1b2d" floodOpacity="0.22" />
          <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#0b1b2d" floodOpacity="0.12" />
        </filter>

        <filter id="arrow-shadow-c" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="2" dy="8" stdDeviation="7" floodColor="#031f17" floodOpacity="0.45" />
        </filter>
      </defs>

      <g id="logo-emblem" transform="translate(0, -10)">
        <circle cx="400" cy="355" r="235" fill="#0c1f33" opacity="0.08" filter="url(#badge-shadow-c)" />
        <circle cx="400" cy="355" r="230" fill="url(#navy-grad-c)" />
        <circle cx="400" cy="355" r="214" fill="none" stroke="url(#gold-grad-c)" strokeWidth="15" />
        <circle cx="400" cy="355" r="202" fill="#091522" />
        <circle cx="400" cy="355" r="184" fill="none" stroke="#254a6d" strokeWidth="4" opacity="0.6" />

        <path
          d="M400, 195 C470, 225 530, 235 530, 310 C530, 420 460, 495 400, 525 C340, 495 270, 420 270, 310 C270, 235 330, 225 400, 195 Z"
          fill="#1c3347"
          stroke="#486985"
          strokeWidth="6"
        />

        <path
          d="M400, 208 C462, 235 515, 245 515, 312 C515, 410 452, 480 400, 508 C348, 480 285, 410 285, 312 C285, 245 338, 235 400, 208 Z"
          fill="url(#shield-grad-c)"
        />

        <path
          d="M400, 214 C455, 238 503, 248 503, 312 C503, 370 478, 425 440, 465 C435, 340 410, 255 400, 214 Z"
          fill="#ffffff"
          opacity="0.06"
        />

        <g id="ebt-card" transform="rotate(-6 385 360)">
          <rect x="270" y="276" width="232" height="152" rx="14" fill="#051713" opacity="0.6" />
          <rect
            x="268"
            y="272"
            width="232"
            height="148"
            rx="14"
            fill="url(#card-grad-c)"
            stroke="#2ce59b"
            strokeWidth="2.5"
            strokeOpacity="0.4"
          />
          <path d="M269 304 L499 304" stroke="#092721" strokeWidth="12" opacity="0.8" />
          <rect x="296" y="332" width="46" height="36" rx="6" fill="url(#chip-grad-c)" stroke="#744f0b" strokeWidth="1.5" />
          <path d="M296 350 L342 350 M314 332 L314 368 M324 332 L324 368" stroke="#634204" strokeWidth="1.2" opacity="0.65" />
          <rect x="296" y="386" width="54" height="6.5" rx="3.25" fill="#a4ebd3" opacity="0.75" />
          <rect x="358" y="386" width="42" height="6.5" rx="3.25" fill="#a4ebd3" opacity="0.75" />
          <rect x="408" y="386" width="42" height="6.5" rx="3.25" fill="#a4ebd3" opacity="0.75" />
          <rect x="458" y="386" width="28" height="6.5" rx="3.25" fill="#a4ebd3" opacity="0.75" />
        </g>

        <g id="recovery-swoosh-arrow" filter="url(#arrow-shadow-c)">
          <path
            d="M260, 410 C245, 480 320, 520 375, 510 C435, 500 480, 440 515, 360 C525, 338 535, 310 545, 280 L565, 305 L590, 210 L498, 245 L525, 268 C495, 325 455, 400 410, 435 C370, 465 315, 460 295, 420 C282, 395 288, 360 300, 335 C275, 355 264, 385 260, 410 Z"
            fill="#091b29"
            opacity="0.8"
          />
          <path
            d="M268, 412 C255, 470 318, 506 368, 498 C422, 488 465, 432 502, 355 C516, 328 528, 298 540, 270 L515, 252 L580, 222 L556, 300 L535, 280 C505, 335 465, 410 418, 445 C375, 476 322, 472 300, 430 C286, 402 292, 366 306, 340 C280, 362 272, 388 268, 412 Z"
            fill="url(#arrow-grad-c)"
          />
          <path d="M580, 222 L540, 270 C530, 290 518, 315 505, 342 L525, 275 L515, 252 Z" fill="#a2ffd2" opacity="0.6" />
          <path
            d="M306, 340 C340, 300 410, 370 515, 252 L540, 270 C475, 350 365, 445 300, 430 C290, 400 295, 365 306, 340 Z"
            fill="#ffffff"
            opacity="0.18"
          />
        </g>
      </g>

      {variant === 'full' && (
        <g id="brand-name">
          <text
            x="400"
            y="695"
            style={{
              fontFamily: 'Montserrat, Arial Black, -apple-system, sans-serif',
              fontWeight: 900,
              fontSize: '53px',
              letterSpacing: '0.04em',
              fill: '#0c2340',
              textAnchor: 'middle',
            }}
          >
            RECOVERY CREDIT
          </text>
        </g>
      )}
    </svg>
  );
}
