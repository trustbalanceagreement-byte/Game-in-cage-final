import React from 'react';

interface LogoProps {
  className?: string;
  style?: React.CSSProperties;
}

export default function Logo({ className = '', style }: LogoProps) {
  return (
    <svg
      viewBox="0 0 1060 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ display: 'inline-block', ...style }}
    >
      <defs>
        {/* Subtle Drop Shadow for depth */}
        <filter id="newLogoShadow" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#000000" floodOpacity="0.8"/>
        </filter>
      </defs>

      {/* Main Logo Text Group */}
      <g filter="url(#newLogoShadow)">
        
        {/* 1. Letter G (White) */}
        <path
          d="M 30,20 H 100 C 112,20 120,28 120,40 V 50 H 96 V 44 H 38 C 36,44 34,46 34,52 V 108 C 34,114 36,116 38,116 H 96 V 94 H 65 V 72 H 120 V 120 C 120,132 112,140 100,140 H 30 C 18,140 10,132 10,120 V 40 C 10,28 18,20 30,20 Z"
          fill="#FFFFFF"
        />

        {/* 2. Letter A (Red PlayStation Triangle) */}
        <polygon
          points="185,40 233,131 137,131"
          stroke="#E01E26"
          strokeWidth="18"
          strokeLinejoin="round"
          fill="none"
        />

        {/* 3. Letter M (White Gamepad Controller) */}
        <g transform="translate(252, 20)">
          {/* Main White Controller M Shape */}
          <path
            d="M 18,120 L 2,52 C -1,30 12,0 36,0 C 51,0 62,12 72,25 C 82,12 93,0 108,0 C 132,0 145,30 142,52 L 126,120 C 123,135 106,135 96,120 L 86,96 C 79,82 65,82 58,96 L 48,120 C 38,135 21,135 18,120 Z"
            fill="#FFFFFF"
          />
          {/* Black Controls inside Controller */}
          {/* Left D-Pad */}
          <path d="M 28,36 H 42 M 35,29 V 43" stroke="#000000" strokeWidth="4.5" strokeLinecap="square" />
          {/* Right Action Buttons */}
          <circle cx="104" cy="28" r="3" fill="#000000" />
          <circle cx="104" cy="44" r="3" fill="#000000" />
          <circle cx="96" cy="36" r="3" fill="#000000" />
          <circle cx="112" cy="36" r="3" fill="#000000" />
          {/* Analog Joysticks */}
          <circle cx="48" cy="62" r="7" fill="#000000" />
          <circle cx="94" cy="62" r="7" fill="#000000" />
          {/* Select/Start Buttons */}
          <rect x="62" y="32" width="4" height="2" fill="#000000" rx="1" />
          <rect x="78" y="32" width="4" height="2" fill="#000000" rx="1" />
        </g>

        {/* 4. Letter E (White) */}
        <path
          d="M 410,20 H 495 V 45 H 442 V 68 H 488 V 92 H 442 V 115 H 495 V 140 H 410 Z"
          fill="#FFFFFF"
        />

        {/* 5. "IN" (Yellow text without background box) */}
        <g transform="translate(550, 20)">
          <text
            x="0"
            y="104"
            fill="#FFB800"
            fontSize="88"
            fontWeight="900"
            fontFamily="Arial, -apple-system, sans-serif"
            textAnchor="middle"
          >
            IN
          </text>
        </g>

        {/* 6. Letter C (White C with Yellow Fork completing E letterform) */}
        <g transform="translate(605, 20)">
          {/* C Outer Path */}
          <path
            d="M 20,0 H 95 V 26 H 32 C 26,26 24,28 24,34 V 86 C 24,92 26,94 32,94 H 95 V 120 H 20 C 8,120 0,112 0,100 V 20 C 0,8 8,0 20,0 Z"
            fill="#FFFFFF"
          />
          {/* Enhanced Bold Yellow Fork filling the entire inner cavity */}
          <g id="logo-fork-icon">
            {/* Fork Solid Curved Base filling right space to x=94 */}
            <path
              d="M 50,27 C 78,27 94,40 94,59 C 94,78 78,91 50,91 Z"
              fill="#FFB800"
            />
            
            {/* 4 Bold Tines (Prongs) spanning from top to bottom and filling left space */}
            <rect x="24" y="27" width="32" height="10" rx="3" fill="#FFB800" />
            <rect x="24" y="45" width="32" height="10" rx="3" fill="#FFB800" />
            <rect x="24" y="63" width="32" height="10" rx="3" fill="#FFB800" />
            <rect x="24" y="81" width="32" height="10" rx="3" fill="#FFB800" />
          </g>
        </g>

        {/* 7. Letter A (Cyan PlayStation Triangle) */}
        <polygon
          points="770,40 818,131 722,131"
          stroke="#00C2CB"
          strokeWidth="18"
          strokeLinejoin="round"
          fill="none"
        />

        {/* 8. Letter G (White) */}
        <path
          d="M 855,20 H 925 C 937,20 945,28 945,40 V 50 H 921 V 44 H 863 C 861,44 859,46 859,52 V 108 C 859,114 861,116 863,116 H 921 V 94 H 890 V 72 H 945 V 120 C 945,132 937,140 925,140 H 855 C 843,140 835,132 835,120 V 40 C 835,28 843,20 855,20 Z"
          fill="#FFFFFF"
        />

        {/* 9. Letter E (White) */}
        <path
          d="M 960,20 H 1045 V 45 H 992 V 68 H 1038 V 92 H 992 V 115 H 1045 V 140 H 960 Z"
          fill="#FFFFFF"
        />
      </g>

      {/* Subtitle / Services Bar */}
      <g fontFamily="Arial, -apple-system, sans-serif" fontWeight="900" fontSize="23" letterSpacing="2">
        <text x="10" y="185" fill="#FFB800">ESPORTS CAFE</text>
        <text x="280" y="185" fill="#FFFFFF">8 BALL POOL</text>
        <text x="545" y="185" fill="#FFB800">WIFI</text>
        <text x="690" y="185" fill="#FFFFFF">SNACKS</text>
        <text x="860" y="185" fill="#FFB800">BEVERAGE</text>
      </g>
    </svg>
  );
}

