// Onboarding step indicator — port of the dot row in OnboardingScreen.DrawHeader: completed steps are
// filled accent-light, the current step is a filled white dot, steps ahead are hollow.

import { cn } from '../cn';

export function ProgressDots({ total, current }: { total: number; current: number }) {
  return (
    <div className="flex items-center justify-center gap-2" aria-hidden>
      {Array.from({ length: total }, (_, i) => (
        <span
          key={i}
          className={cn(
            'h-1.5 w-1.5 rounded-full transition-colors',
            i < current && 'bg-accent-light',
            i === current && 'bg-strong',
            i > current && 'border border-line/50'
          )}
        />
      ))}
    </div>
  );
}
