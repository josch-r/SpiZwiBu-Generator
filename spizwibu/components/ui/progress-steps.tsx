// components/ui/progress-steps.tsx
import React from 'react';
import { CheckCircle, Circle } from 'lucide-react';

interface Step {
  id: string;
  label: string;
  completed: boolean;
  current: boolean;
}

interface ProgressStepsProps {
  steps: Step[];
}

export function ProgressSteps({ steps }: ProgressStepsProps) {
  return (
    <div className="flex items-center justify-center space-x-4 py-4">
      {steps.map((step, index) => (
        <React.Fragment key={step.id}>
          <div className="flex items-center space-x-2">
            {step.completed ? (
              <CheckCircle className="w-5 h-5 text-green-600" />
            ) : step.current ? (
              <Circle className="w-5 h-5 text-gray-900 fill-current" />
            ) : (
              <Circle className="w-5 h-5 text-gray-300" />
            )}
            <span
              className={`text-sm font-medium ${
                step.completed
                  ? 'text-green-600'
                  : step.current
                  ? 'text-gray-900'
                  : 'text-gray-300'
              }`}
            >
              {step.label}
            </span>
          </div>
          {index < steps.length - 1 && (
            <div className="w-8 h-px bg-gray-300"></div>
          )}
        </React.Fragment>
      ))}
    </div>
  );
}
