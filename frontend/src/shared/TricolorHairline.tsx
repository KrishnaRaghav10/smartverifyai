import React from 'react';

export const TricolorHairline: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div
      className={`h-[4px] w-full flex shrink-0 ${className}`}
      role="presentation"
      aria-hidden="true"
    >
      <div className="w-1/3 bg-[#F28C28]" />
      <div className="w-1/3 bg-white" />
      <div className="w-1/3 bg-[#138808]" />
    </div>
  );
};
