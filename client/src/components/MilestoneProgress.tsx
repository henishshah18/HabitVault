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
    <Card className="border-none bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20">
      <CardHeader className="pb-3">
        <div className="flex items-center space-x-2">
          <Trophy className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          <CardTitle className="text-lg">Perfect Days Journey</CardTitle>
        </div>
        <CardDescription>
          {milestone.days_remaining > 0 
            ? `${milestone.days_remaining} perfect days until ${milestone.next_milestone} day milestone`
            : `You've reached the ${milestone.current_count} day milestone! Keep going!`
          }
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="flex items-center space-x-1">
            <Star className="w-4 h-4 text-amber-500" />
            <span>{milestone.current_count} perfect days</span>
          </span>
          <span className="text-muted-foreground">
            Goal: {milestone.next_milestone} days
          </span>
        </div>
        
        <Progress 
          value={milestone.progress_percentage} 
          className="h-3 bg-amber-100 dark:bg-amber-900/30"
        />
        
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{milestone.current_count}</span>
          <span>{Math.round(milestone.progress_percentage)}% complete</span>
          <span>{milestone.next_milestone}</span>
        </div>
      </CardContent>
    </Card>
  );
}