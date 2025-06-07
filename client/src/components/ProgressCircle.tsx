import { useEffect, useState } from 'react';

interface ProgressCircleProps {
  completed: number;
  total: number;
  isPerfectDay: boolean;
}

export function ProgressCircle({ completed, total, isPerfectDay }: ProgressCircleProps) {
  const [showConfetti, setShowConfetti] = useState(false);
  const progressPercentage = total > 0 ? (completed / total) * 100 : 0;
  const circumference = 2 * Math.PI * 42; // radius of 42
  const strokeDashoffset = circumference - (progressPercentage / 100) * circumference;

  useEffect(() => {
    if (isPerfectDay && completed > 0) {
      setShowConfetti(true);
      const timer = setTimeout(() => setShowConfetti(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isPerfectDay, completed]);

  const generateConfetti = () => {
    const pieces = [];
    for (let i = 0; i < 20; i++) {
      pieces.push(
        <div
          key={i}
          className="absolute w-2 h-2 animate-bounce"
          style={{
            backgroundColor: ['#fbbf24', '#f59e0b', '#d97706', '#92400e'][Math.floor(Math.random() * 4)],
            left: `${20 + Math.random() * 60}%`,
            top: `${20 + Math.random() * 60}%`,
            animationDelay: `${Math.random() * 2}s`,
            animationDuration: `${1 + Math.random() * 2}s`,
          }}
        />
      );
    }
    return pieces;
  };

  return (
    <div className="relative w-24 h-24">
      {/* SVG Progress Circle */}
      <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
        {/* Background Circle */}
        <circle
          cx="50"
          cy="50"
          r="42"
          stroke="currentColor"
          strokeWidth="6"
          fill="none"
          className="text-muted-foreground/20"
        />
        {/* Progress Circle */}
        <circle
          cx="50"
          cy="50"
          r="42"
          stroke="currentColor"
          strokeWidth="6"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className={`transition-all duration-500 ${
            isPerfectDay ? 'text-green-500' : 'text-blue-500'
          }`}
          strokeLinecap="round"
        />
      </svg>

      {/* Center Content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <div className="text-lg font-bold">
          {isPerfectDay ? '🎉' : `${completed}/${total}`}
        </div>
        <div className="text-xs text-muted-foreground">
          {isPerfectDay ? 'Perfect Day!' : 'tasks'}
        </div>
      </div>

      {/* Confetti Animation */}
      {showConfetti && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-full">
          {generateConfetti()}
        </div>
      )}
    </div>
  );
}