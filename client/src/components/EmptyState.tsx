import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Target, Calendar, BarChart3 } from 'lucide-react';

interface EmptyStateProps {
  type: 'habits' | 'analytics' | 'checkin';
  onCreateHabit?: () => void;
}

export function EmptyState({ type, onCreateHabit }: EmptyStateProps) {
  if (type === 'habits') {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16 px-6 text-center">
          <div className="w-24 h-24 bg-muted/50 rounded-full flex items-center justify-center mb-6">
            <Target className="w-12 h-12 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold mb-2">No Habits Yet</h3>
          <p className="text-muted-foreground mb-6 max-w-md">
            Start building better habits today. Create your first habit to begin tracking your progress.
          </p>
          <Button onClick={onCreateHabit} className="gap-2">
            <Plus className="w-4 h-4" />
            Create Your First Habit
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (type === 'analytics') {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16 px-6 text-center">
          <div className="w-24 h-24 bg-muted/50 rounded-full flex items-center justify-center mb-6">
            <BarChart3 className="w-12 h-12 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold mb-2">No Analytics Data</h3>
          <p className="text-muted-foreground mb-6 max-w-md">
            Create some habits and start tracking them to see your progress analytics and completion patterns.
          </p>
          <Button onClick={onCreateHabit} variant="outline" className="gap-2">
            <Plus className="w-4 h-4" />
            Create a Habit
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (type === 'checkin') {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16 px-6 text-center">
          <div className="w-24 h-24 bg-muted/50 rounded-full flex items-center justify-center mb-6">
            <Calendar className="w-12 h-12 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold mb-2">Ready to Start?</h3>
          <p className="text-muted-foreground mb-6 max-w-md">
            Welcome to HabitVault! Create your first habit to begin your journey towards better daily routines.
          </p>
          <Button onClick={onCreateHabit} className="gap-2">
            <Plus className="w-4 h-4" />
            Create Your First Habit
          </Button>
        </CardContent>
      </Card>
    );
  }

  return null;
}