import React from 'react';

export const StatusTag = ({ status }) => {
  if (!status) return null;

  const normalized = status.trim();

  // Color mapping adhering to AICTE government guidelines
  let styleClasses = "gov-tag-pending";
  let dotColor = "bg-blue-600";

  switch (normalized) {
    case "Clean":
    case "Verified":
    case "Present":
    case "Sufficient":
      styleClasses = "bg-emerald-50 text-emerald-800 border-emerald-300";
      dotColor = "bg-emerald-600";
      break;

    case "Needs Review":
    case "Needs More Evidence":
    case "Manual Review Required":
      styleClasses = "bg-amber-50 text-amber-800 border-amber-300";
      dotColor = "bg-amber-600";
      break;

    case "Deficient":
    case "Mismatch Detected":
    case "Missing":
    case "Suggest Inspection":
      styleClasses = "bg-rose-50 text-rose-800 border-rose-300";
      dotColor = "bg-rose-600";
      break;

    case "Expired":
      styleClasses = "bg-purple-50 text-purple-800 border-purple-300";
      dotColor = "bg-purple-600";
      break;

    case "Source Unavailable":
      styleClasses = "bg-slate-100 text-slate-700 border-slate-300";
      dotColor = "bg-slate-500";
      break;

    case "Verification Pending":
    default:
      styleClasses = "bg-blue-50 text-blue-900 border-blue-200";
      dotColor = "bg-blue-600";
      break;
  }

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border ${styleClasses}`}>
      <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${dotColor}`}></span>
      {normalized}
    </span>
  );
};
