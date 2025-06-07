interface ProgressCircleProps {
  completed: number;
  total: number;
  isPerfectDay: boolean;
}

export function ProgressCircle({ completed, total, isPerfectDay }: ProgressCircleProps) {
  const progressPercentage = total > 0 ? (completed / total) * 100 : 0;
  const circumference = 2 * Math.PI * 42;
  const strokeDashoffset = circumference - (progressPercentage / 100) * circumference;

  return (
    <div className="relative w-24 h-24">
      <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
        <circle
          cx="50"
          cy="50"
          r="42"
          stroke="currentColor"
          strokeWidth="6"
          fill="none"
          className="text-muted-foreground/20"
        />
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

      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <div className="text-lg font-bold">{completed}/{total}</div>
        {isPerfectDay && total > 0 ? (
          <div className="text-xs">
            <div className="text-green-600 font-medium">Perfect</div>
            <div className="text-green-600 font-medium">Day</div>
          </div>
        ) : (
          <div className="text-xs text-muted-foreground">tasks</div>
        )}
      </div>
    </div>
  );
}