import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Star, Trophy } from 'lucide-react';

interface MilestoneData {
  next_milestone: number;
  current_count: number;
  progress_percentage: number;
  days_remaining: number;
}

interface MilestoneProgressProps {
  milestone: MilestoneData;
  tempAdjustment?: number;
}

export function MilestoneProgress({ milestone, tempAdjustment = 0 }: MilestoneProgressProps) {
  const adjustedCount = Math.max(0, milestone.current_count + tempAdjustment);
  
  // Calculate which milestone level we're on and the emoji
  const getMilestoneInfo = (count: number) => {
    if (count < 50) {
      return { level: 1, emoji: '🥉', name: 'Bronze', target: 50, color: 'amber' };
    } else if (count < 100) {
      return { level: 2, emoji: '🥈', name: 'Silver', target: 100, color: 'gray' };
    } else if (count < 150) {
      return { level: 3, emoji: '🥇', name: 'Gold', target: 150, color: 'yellow' };
    } else {
      // Diamond levels (150+)
      const diamondLevel = Math.floor(count / 50);
      const target = diamondLevel * 50 + 50;
      return { level: diamondLevel, emoji: '💎', name: 'Diamond', target, color: 'purple' };
    }
  };

  const currentMilestone = getMilestoneInfo(adjustedCount);
  const adjustedProgress = Math.min((adjustedCount / currentMilestone.target) * 100, 100);
  const adjustedRemaining = Math.max(currentMilestone.target - adjustedCount, 0);

  // Check if milestone is completed
  const isCompleted = adjustedCount >= currentMilestone.target;

  // Color classes based on milestone level
  const colorClasses = {
    amber: {
      bg: 'from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20',
      border: 'border-amber-200 dark:border-amber-800',
      text: 'text-amber-600 dark:text-amber-400',
      progress: 'bg-amber-200 dark:bg-amber-800/30'
    },
    gray: {
      bg: 'from-gray-50 to-slate-50 dark:from-gray-900/20 dark:to-slate-900/20',
      border: 'border-gray-200 dark:border-gray-800',
      text: 'text-gray-600 dark:text-gray-400',
      progress: 'bg-gray-200 dark:bg-gray-800/30'
    },
    yellow: {
      bg: 'from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20',
      border: 'border-yellow-200 dark:border-yellow-800',
      text: 'text-yellow-600 dark:text-yellow-400',
      progress: 'bg-yellow-200 dark:bg-yellow-800/30'
    },
    purple: {
      bg: 'from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20',
      border: 'border-purple-200 dark:border-purple-800',
      text: 'text-purple-600 dark:text-purple-400',
      progress: 'bg-purple-200 dark:bg-purple-800/30'
    }
  };

  const colors = colorClasses[currentMilestone.color as keyof typeof colorClasses];

  return (
    <div className={`bg-gradient-to-r ${colors.bg} p-4 rounded-lg border ${colors.border}`}>
      <div className="relative">
        <div className="text-center mb-2">
          <div className={`text-sm ${colors.text} flex items-center justify-center gap-2`}>
            <span className="text-lg">{currentMilestone.emoji}</span>
            <span>
              Milestone {currentMilestone.level}: {currentMilestone.name} 
              {currentMilestone.level > 3 && ` Level ${currentMilestone.level}`}
            </span>
          </div>
          {isCompleted && (
            <div className="text-xs text-green-600 dark:text-green-400 mt-1">
              🎉 Milestone completed! Keep going for the next level!
            </div>
          )}
        </div>
        
        <Progress 
          value={adjustedProgress} 
          className={`h-3 ${colors.progress}`}
        />
        
        <div className="flex justify-between mt-2 text-sm">
          <div className="flex items-center space-x-1">
            <Star className={`w-4 h-4 ${colors.text}`} fill="currentColor" />
            <span className={colors.text}>Perfect Days</span>
          </div>
          <span className={colors.text}>
            {adjustedCount}/{currentMilestone.target}
          </span>
        </div>
        
        {!isCompleted && (
          <div className={`text-xs ${colors.text} text-center mt-1`}>
            {adjustedRemaining} days to {currentMilestone.name}
          </div>
        )}
      </div>
    </div>
  );
}