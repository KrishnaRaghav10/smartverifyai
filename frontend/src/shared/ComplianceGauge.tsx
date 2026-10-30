import React from 'react';

interface ComplianceGaugeProps {
  score: number; // 0 to 100
  size?: number;
  strokeWidth?: number;
}

export const ComplianceGauge: React.FC<ComplianceGaugeProps> = ({
  score = 88,
  size = 120,
  strokeWidth = 10
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  let color = '#138808'; // green
  let statusText = 'Excellent Standing';
  if (score < 60) {
    color = '#D92D20'; // red
    statusText = 'Critical Deficiencies';
  } else if (score < 80) {
    color = '#F28C28'; // saffron
    statusText = 'Action Needed';
  }

  return (
    <div className="flex flex-col items-center justify-center font-sans">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          {/* Background Track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#EEF1F8"
            strokeWidth={strokeWidth}
            fill="none"
          />
          {/* Animated Progress Arc */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />
        </svg>

        {/* Center Score */}
        <div className="absolute inset-0 flex flex-col items-center justify-center leading-none">
          <span className="font-mono-num font-extrabold text-2xl text-[#0F1B3D]">
            {score}
          </span>
          <span className="text-[10px] font-semibold text-[#5B6785] mt-1">
            / 100
          </span>
        </div>
      </div>
      <span
        className="text-xs font-bold mt-2 px-2.5 py-0.5 rounded-full"
        style={{ color, backgroundColor: `${color}15` }}
      >
        {statusText}
      </span>
    </div>
  );
};
