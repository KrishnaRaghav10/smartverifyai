import React from 'react';
import { Stage, Pathway } from '../types';
import rulesConfig from '../config/rules.json';
import { Check, Clock, AlertCircle } from 'lucide-react';

interface StageStepperProps {
  pathway: Pathway;
  currentStage: Stage;
  status?: string;
  className?: string;
}

export const StageStepper: React.FC<StageStepperProps> = ({
  pathway,
  currentStage,
  status = 'ON_TRACK',
  className = ''
}) => {
  const stages = (rulesConfig.pathways[pathway] || [
    'SUBMITTED',
    'SCRUTINY',
    'DECISION',
    'CLOSED'
  ]) as Stage[];

  const currentIndex = stages.indexOf(currentStage);

  return (
    <div className={`w-full overflow-x-auto py-2 ${className}`}>
      <div className="flex items-center min-w-[550px]">
        {stages.map((stage, idx) => {
          const isDone = idx < currentIndex || currentStage === 'CLOSED';
          const isCurrent = idx === currentIndex && currentStage !== 'CLOSED';
          const isPending = idx > currentIndex && currentStage !== 'CLOSED';
          const isReturned = isCurrent && status === 'RETURNED';

          const stageCfg = rulesConfig.stages[stage as keyof typeof rulesConfig.stages];
          const name = stageCfg?.name || stage;

          return (
            <React.Fragment key={stage}>
              {/* Step Node */}
              <div className="flex flex-col items-center relative group">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-mono-num text-xs font-bold transition-all ${
                    isDone
                      ? 'bg-[#138808] text-white shadow-sm'
                      : isReturned
                      ? 'bg-[#F28C28] text-white ring-4 ring-[#F28C28]/20 animate-pulse'
                      : isCurrent
                      ? 'bg-[#0A5CD6] text-white ring-4 ring-[#0A5CD6]/20 shadow-md scale-105'
                      : 'bg-[#EEF1F8] text-[#5B6785] border border-[#E1E6F0]'
                  }`}
                >
                  {isDone ? (
                    <Check className="w-4 h-4 stroke-[2.5]" />
                  ) : isReturned ? (
                    <AlertCircle className="w-4 h-4" />
                  ) : (
                    idx + 1
                  )}
                </div>

                {/* Step Label */}
                <span
                  className={`text-[11px] mt-1.5 text-center font-medium max-w-[85px] leading-tight ${
                    isCurrent
                      ? 'text-[#0A5CD6] font-bold'
                      : isDone
                      ? 'text-[#0F1B3D]'
                      : 'text-[#5B6785]'
                  }`}
                >
                  {name}
                </span>
              </div>

              {/* Connector Line */}
              {idx < stages.length - 1 && (
                <div className="flex-1 h-1 mx-2 rounded-full relative overflow-hidden bg-[#EEF1F8]">
                  <div
                    className={`h-full transition-all duration-500 ${
                      idx < currentIndex
                        ? 'bg-[#138808] w-full'
                        : isCurrent
                        ? 'bg-gradient-to-r from-[#0A5CD6] to-[#EEF1F8] w-full animate-pulse'
                        : 'w-0'
                    }`}
                  />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};
