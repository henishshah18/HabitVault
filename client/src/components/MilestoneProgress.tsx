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
}

export function MilestoneProgress({ milestone }: MilestoneProgressProps) {
  return (
    <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 p-4 rounded-lg border border-amber-200 dark:border-amber-800">
      <div className="relative">
        <div className="text-center mb-2">
          <div className="text-sm text-amber-600 dark:text-amber-400">
            🥉 Milestone 1: {milestone.next_milestone} Days!
          </div>
        </div>
        
        <Progress 
          value={milestone.progress_percentage} 
          className="h-3 bg-amber-200 dark:bg-amber-800/30"
        />
        
        <div className="flex justify-between mt-2 text-sm">
          <div className="flex items-center space-x-1">
            <Star className="w-4 h-4 text-amber-500" fill="currentColor" />
            <span className="text-amber-600 dark:text-amber-400">Perfect Days</span>
          </div>
          <span className="text-amber-600 dark:text-amber-400">
            {milestone.current_count}/{milestone.next_milestone}
          </span>
        </div>
      </div>
    </div>
  );
}