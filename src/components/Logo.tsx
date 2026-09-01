import React from 'react';

interface LogoProps {
  className?: string;
  style?: React.CSSProperties;
  width?: number | string;
  height?: number | string;
}

export default function Logo({ className = '', style, width, height }: LogoProps) {
  return (
    <img
      src="/SAVE_20260801_212447-removebg-preview.png"
      alt="Game In Cage"
      className={`object-contain ${className}`}
      style={style}
      width={width}
      height={height}
    />
  );
}


