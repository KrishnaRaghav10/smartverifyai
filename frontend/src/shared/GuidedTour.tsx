import React, { useState } from 'react';
import { useAegisStore } from '../store';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ArrowRight, ArrowLeft, X, CheckCircle, ShieldAlert, FastForward, Eye } from 'lucide-react';

interface GuidedTourProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GuidedTour: React.FC<GuidedTourProps> = ({ isOpen, onClose }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const { switchRole, advanceDays, applications, openAuditDrawer } = useAegisStore();
  const navigate = useNavigate();

  if (!isOpen) return null;

  const steps = [
    {
      title: 'Step 1: Institution Perspective (Aarohan Institute)',
      role: 'INSTITUTION',
      description:
        'Aarohan Institute of Technology views their Action Centre. Notice the "Document & Lease Vault" where the campus lease is expiring in 21 days with an active alert and countdown indicator.',
      actionLabel: 'Switch to Institution & View Alert',
      onRun: () => {
        switchRole('INSTITUTION');
        navigate('/institution');
      }
    },
    {
      title: 'Step 2: Advance Time Machine (+60 Days)',
      role: 'INSTITUTION',
      description:
        'Watch the automated SLA engine fire! Fast-forwarding the simulated clock by 60 days crosses the lease expiry threshold, automatically turning the lease status to EXPIRED and queueing statutory alerts.',
      actionLabel: 'Advance Clock +60 Days',
      onRun: () => {
        advanceDays(60);
      }
    },
    {
      title: 'Step 3: Compliance Officer Verification & Radar',
      role: 'COMPLIANCE_OFFICER',
      description:
        'Switch to the Compliance Tracker. See the concentric Expiry Radar and Kanban board where expired documents and overdue undertakings appear in the Overdue column without manual follow-up.',
      actionLabel: 'Go to Compliance Tracker',
      onRun: () => {
        switchRole('COMPLIANCE_OFFICER');
        navigate('/compliance');
      }
    },
    {
      title: 'Step 4: Statutory Escalation to Senior Authority',
      role: 'SENIOR_AUTHORITY',
      description:
        'Because the lease remained unresolved past the statutory grace period, the escalation ladder triggered, putting the institution directly into the Senior Authority Executive Briefing inbox.',
      actionLabel: 'View Executive Briefing',
      onRun: () => {
        switchRole('SENIOR_AUTHORITY');
        navigate('/authority');
      }
    },
    {
      title: 'Step 5: Auditor Forensics & Case Reconstruction',
      role: 'AUDITOR',
      description:
        'Switch to the Statutory Auditor lens. Reconstruct the full lifecycle with the animated case scrubber, verify cryptographic SHA-256 hash chains, and observe the exact audit timeline.',
      actionLabel: 'Open Auditor Replay',
      onRun: () => {
        switchRole('AUDITOR');
        navigate('/auditor');
      }
    },
    {
      title: 'Step 6: Regulatory Safeguard Summary',
      role: 'AUDITOR',
      description:
        'AEGIS demonstrates complete automated tracking and escalation while preserving statutory sovereignty: All alerts are tagged "System-generated", and all final decisions strictly require human authorization with mandatory reasons.',
      actionLabel: 'Finish Guided Tour',
      onRun: () => {
        onClose();
      }
    }
  ];

  const step = steps[currentStep];

  const handleNext = () => {
    step.onRun();
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200 no-print font-sans">
      <div className="bg-white max-w-xl w-full rounded-3xl shadow-2xl border border-[#1F3A8A]/30 overflow-hidden">
        {/* Banner */}
        <div className="bg-gradient-to-r from-[#1F3A8A] to-[#0A5CD6] p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="p-2 bg-white/20 rounded-xl">
              <Sparkles className="w-5 h-5 text-[#F28C28]" />
            </span>
            <div>
              <h3 className="font-bold text-base">AEGIS Interactive Guided Tour</h3>
              <p className="text-xs text-white/80">
                Step {currentStep + 1} of {steps.length}: Hero Workflow Walkthrough
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-white/20 transition-colors text-white/80 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-[#E6ECFF] text-[#1F3A8A]">
              Role: {step.role.replace(/_/g, ' ')}
            </span>
          </div>

          <h4 className="text-lg font-bold text-[#0F1B3D] leading-snug">
            {step.title}
          </h4>

          <p className="text-sm text-[#5B6785] leading-relaxed">
            {step.description}
          </p>

          {/* Progress dots */}
          <div className="flex items-center justify-center gap-2 pt-2">
            {steps.map((_, i) => (
              <span
                key={i}
                className={`h-2 rounded-full transition-all ${
                  i === currentStep
                    ? 'w-8 bg-[#1F3A8A]'
                    : i < currentStep
                    ? 'w-2 bg-[#138808]'
                    : 'w-2 bg-[#E1E6F0]'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Footer CTAs */}
        <div className="p-4 bg-[#F7F8FC] border-t border-[#E1E6F0] flex items-center justify-between">
          <button
            onClick={handlePrev}
            disabled={currentStep === 0}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              currentStep === 0
                ? 'opacity-40 cursor-not-allowed text-[#5B6785]'
                : 'hover:bg-slate-200 text-[#0F1B3D]'
            }`}
          >
            <ArrowLeft className="w-4 h-4" /> Previous
          </button>

          <button
            onClick={handleNext}
            className="px-5 py-2.5 rounded-xl text-xs font-bold bg-[#1F3A8A] hover:bg-[#0F1B3D] text-white flex items-center gap-2 shadow-md transition-all active:scale-95"
          >
            <span>{step.actionLabel}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
