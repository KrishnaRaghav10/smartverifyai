import React from 'react';
import { Status } from '../types';
import { CheckCircle2, Clock, AlertTriangle, ArrowUpCircle, CornerUpLeft, Hourglass, Lock } from 'lucide-react';

interface StatusChipProps {
  status: Status | string;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  className?: string;
}

export const StatusChip: React.FC<StatusChipProps> = ({
  status,
  size = 'md',
  showIcon = true,
  className = ''
}) => {
  let label = status;
  let bg = 'bg-emerald-50 text-emerald-800 border-emerald-200';
  let Icon = CheckCircle2;
  let animationClass = '';

  switch (status) {
    case 'ON_TRACK':
      label = 'On Track';
      bg = 'bg-emerald-50 text-emerald-800 border-emerald-200';
      Icon = CheckCircle2;
      break;
    case 'DUE_SOON':
      label = 'Due Soon';
      bg = 'bg-amber-50 text-amber-900 border-amber-300';
      Icon = Clock;
      animationClass = 'animate-pulse-due-soon';
      break;
    case 'OVERDUE':
      label = 'Overdue';
      bg = 'bg-rose-50 text-rose-800 border-rose-300';
      Icon = AlertTriangle;
      animationClass = 'animate-shake-overdue';
      break;
    case 'ESCALATED':
      label = 'Escalated';
      bg = 'bg-rose-100 text-rose-900 border-rose-400 font-bold';
      Icon = ArrowUpCircle;
      break;
    case 'RETURNED':
      label = 'Returned / Deficient';
      bg = 'bg-orange-50 text-orange-900 border-orange-300';
      Icon = CornerUpLeft;
      break;
    case 'AWAITING_INSTITUTION':
    case 'SUBMITTED':
      label = status === 'SUBMITTED' ? 'Submitted' : 'Awaiting Institution';
      bg = 'bg-blue-50 text-blue-800 border-blue-200';
      Icon = Hourglass;
      break;
    case 'CLOSED':
      label = 'Closed';
      bg = 'bg-slate-100 text-slate-700 border-slate-300';
      Icon = Lock;
      break;
    case 'VALID':
      label = 'Valid';
      bg = 'bg-emerald-50 text-emerald-800 border-emerald-200';
      Icon = CheckCircle2;
      break;
    case 'EXPIRING':
      label = 'Expiring Soon';
      bg = 'bg-amber-50 text-amber-900 border-amber-300';
      Icon = Clock;
      animationClass = 'animate-pulse-due-soon';
      break;
    case 'EXPIRED':
      label = 'Expired';
      bg = 'bg-rose-50 text-rose-800 border-rose-300';
      Icon = AlertTriangle;
      break;
    case 'RENEWAL_SUBMITTED':
      label = 'Renewal Submitted';
      bg = 'bg-sky-50 text-sky-800 border-sky-300';
      Icon = Hourglass;
      break;
    case 'RENEWAL_VERIFIED':
      label = 'Renewal Verified';
      bg = 'bg-emerald-50 text-emerald-800 border-emerald-200';
      Icon = CheckCircle2;
      break;
    default:
      label = status.replace(/_/g, ' ');
  }

  const sizeClasses = {
    sm: 'text-[11px] px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5',
    lg: 'text-sm px-3.5 py-1.5 gap-2 font-medium'
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border ${bg} ${sizeClasses[size]} ${animationClass} ${className}`}
    >
      {showIcon && <Icon className={size === 'sm' ? 'w-3 h-3' : size === 'lg' ? 'w-4 h-4' : 'w-3.5 h-3.5'} />}
      <span>{label}</span>
    </span>
  );
};
