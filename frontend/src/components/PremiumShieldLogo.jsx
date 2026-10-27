import React from 'react';

export const PremiumShieldLogo = ({ className = "w-10 h-10", size = 40 }) => {
  return (
    <svg 
      className={className} 
      width={size} 
      height={size} 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      style={{ filter: 'drop-shadow(0 2px 4px rgba(11, 26, 51, 0.25))' }}
    >
      <defs>
        {/* Outer Rim Gradient (Metallic Gold / Saffron) */}
        <linearGradient id="shieldRimGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FCD34D"/>
          <stop offset="25%" stopColor="#F59E0B"/>
          <stop offset="65%" stopColor="#D97706"/>
          <stop offset="100%" stopColor="#E8890C"/>
        </linearGradient>

        {/* Main Shield Body Gradient (Deep Royal Navy) */}
        <linearGradient id="shieldBodyGrad" x1="30%" y1="0%" x2="70%" y2="100%">
          <stop offset="0%" stopColor="#1B3A6B"/>
          <stop offset="50%" stopColor="#142C52"/>
          <stop offset="100%" stopColor="#0B1A33"/>
        </linearGradient>

        {/* Inner Shield Inset Gradient */}
        <linearGradient id="innerShieldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#234A85"/>
          <stop offset="100%" stopColor="#0F203D"/>
        </linearGradient>

        {/* Tick Gradient (Pure Luminous White to Platinum) */}
        <linearGradient id="tickGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF"/>
          <stop offset="100%" stopColor="#E2E8F0"/>
        </linearGradient>

        {/* Tick Shadow */}
        <filter id="tickDropShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2.5" stdDeviation="2" floodColor="#000000" floodOpacity="0.45"/>
        </filter>

        {/* Glass Reflection Highlight */}
        <linearGradient id="glassReflectGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.32"/>
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.0"/>
        </linearGradient>
      </defs>

      {/* Outer Shield Shell with Gold Rim */}
      <path 
        d="M50 5 L88 18 C88 56 68 83 50 94 C32 83 12 56 12 18 L50 5 Z" 
        fill="url(#shieldRimGrad)" 
      />

      {/* Inner Body of the Shield */}
      <path 
        d="M50 8.5 L84.5 20.5 C84.5 54.5 66 79.5 50 89.5 C34 79.5 15.5 54.5 15.5 20.5 L50 8.5 Z" 
        fill="url(#shieldBodyGrad)" 
      />

      {/* Inset Bevel Contour */}
      <path 
        d="M50 13 L81 23.5 C81 52.5 64.5 75 50 84 C35.5 75 19 52.5 19 23.5 L50 13 Z" 
        fill="url(#innerShieldGrad)" 
        stroke="rgba(245, 158, 11, 0.35)" 
        strokeWidth="1.2"
      />

      {/* Glass Light Reflection Arc across Upper-Left Quadrant */}
      <path 
        d="M50 13 L81 23.5 C81 38 72 52 50 52 C28 52 19 38 19 23.5 L50 13 Z" 
        fill="url(#glassReflectGrad)" 
      />

      {/* Premium Sculpted Tick with Sharp Geometric Precision */}
      <path 
        d="M33 49 L43.5 59.5 L67.5 34 L72.5 39 L43.5 68.5 L28 53 Z" 
        fill="url(#tickGrad)" 
        filter="url(#tickDropShadow)" 
      />
    </svg>
  );
};
