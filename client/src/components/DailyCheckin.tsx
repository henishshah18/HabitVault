import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { ProgressCircle } from './ProgressCircle';
import { MilestoneProgress } from './MilestoneProgress';
import { HabitForm } from './HabitForm';
import { Flame, Trophy, CheckCircle2, Target, Plus } from 'lucide-react';

interface Habit {
  id: number;
  unique_id: string;
  name: string;
  target_days: string;
  start_date: string;
  user_id: number;
  current_streak: number;
  longest_streak: number;
  is_due_today: boolean;
  is_completed_today: boolean;
}

interface DailyCheckinProps {
  onLogout: () => void;
  onNewHabit?: () => void;
}

interface User {
  id: number;
  email: string;
  perfect_days_count: number;
  milestone: {
    next_milestone: number;
    current_count: number;
    progress_percentage: number;
    days_remaining: number;
  };
}

export function DailyCheckin({ onLogout, onNewHabit }: DailyCheckinProps) {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showHabitForm, setShowHabitForm] = useState(false);
  const { toast } = useToast();

  // Calculate progress for today's habits only
  const todaysHabits = habits.filter(habit => habit.is_due_today);
  const completedToday = todaysHabits.filter(habit => habit.is_completed_today);
  const totalTasks = todaysHabits.length;
  const completedTasks = completedToday.length;
  const progressPercentage = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
  const isPerfectDay = totalTasks > 0 && completedTasks === totalTasks;

  const fetchUserData = async () => {
    const token = localStorage.getItem('authToken');
    
    if (!token) {
      onLogout();
      return;
    }

    try {
      const response = await fetch('/api/protected', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        setUser(data.user);
      } else if (response.status === 401) {
        localStorage.removeItem('authToken');
        localStorage.removeItem('userId');
        onLogout();
      }
    } catch (err) {
      console.log('Failed to fetch user data:', err);
    }
  };

  const fetchHabits = async () => {
    const token = localStorage.getItem('authToken');
    
    if (!token) {
      onLogout();
      return;
    }

    try {
      const response = await fetch('/api/habits', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        setHabits(data.habits || []);
        setError('');
      } else {
        setError(data.error || 'Failed to fetch habits');
        if (response.status === 401) {
          localStorage.removeItem('authToken');
          localStorage.removeItem('userId');
          onLogout();
        }
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUserData();
    fetchHabits();
  }, [onLogout]);

  const handleToggleCompletion = async (habitId: number, isCompleted: boolean) => {
    const token = localStorage.getItem('authToken');
    
    try {
      const endpoint = isCompleted ? 'uncomplete' : 'complete';
      const response = await fetch(`/api/habits/${habitId}/${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        setHabits(habits.map(habit => 
          habit.id === habitId ? data.habit : habit
        ));
        
        toast({
          title: 'Success',
          description: `Habit ${isCompleted ? 'uncompleted' : 'completed'} successfully`,
        });
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to update habit',
          variant: 'destructive',
        });
      }
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Network error. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const getTargetDaysDisplay = (targetDays: string) => {
    switch (targetDays) {
      case 'every_day':
        return 'Every Day';
      case 'weekdays':
        return 'Weekdays';
      case 'custom':
        return 'Custom';
      default:
        return targetDays;
    }
  };

  const getTargetDaysVariant = (targetDays: string) => {
    switch (targetDays) {
      case 'every_day':
        return 'default';
      case 'weekdays':
        return 'secondary';
      case 'custom':
        return 'outline';
      default:
        return 'outline';
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">Loading today's habits...</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Milestone Progress */}
      {user?.milestone && (
        <MilestoneProgress milestone={user.milestone} />
      )}

      {/* Today's Targets */}
      {todaysHabits.length > 0 ? (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Today's Targets</CardTitle>
                <CardDescription>Check off your habits as you complete them</CardDescription>
              </div>
              
              <div className="flex items-center space-x-4">
                {/* Progress Circle */}
                <ProgressCircle 
                  completed={completedTasks} 
                  total={totalTasks} 
                  isPerfectDay={isPerfectDay} 
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {todaysHabits.map((habit) => {
                const isCompleted = habit.is_completed_today;
                
                return (
                  <Card 
                    key={habit.id} 
                    className={`relative transition-all duration-200 ${
                      isCompleted 
                        ? 'border-green-500 bg-green-50 dark:bg-green-900/20' 
                        : 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20'
                    }`}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-center space-x-3">
                        <Checkbox
                          checked={isCompleted}
                          onCheckedChange={() => handleToggleCompletion(habit.id, isCompleted)}
                        />
                        <div className="flex-1">
                          <CardTitle className="text-lg flex items-center space-x-2">
                            <span>{habit.name}</span>
                            {isCompleted && <CheckCircle2 className="w-4 h-4 text-green-600" />}
                          </CardTitle>
                          <div className="flex items-center space-x-2 mt-1">
                            <Badge variant={getTargetDaysVariant(habit.target_days)}>
                              {getTargetDaysDisplay(habit.target_days)}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Flame className="w-4 h-4 text-orange-500" />
                          <span className="text-sm font-medium">{habit.current_streak} days</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Trophy className="w-4 h-4 text-yellow-500" />
                          <span className="text-sm text-muted-foreground">Best: {habit.longest_streak}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
            <div className="mt-6 flex justify-end">
              <Button onClick={onNewHabit} className="flex items-center space-x-2">
                <Plus className="w-4 h-4" />
                <span>New Habit</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="text-center py-12">
            <Target className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <h3 className="text-xl font-semibold mb-2">No habits scheduled for today</h3>
            <p className="text-muted-foreground mb-6">
              Start building better habits by adding your first one!
            </p>
            <Button onClick={onNewHabit} className="flex items-center space-x-2">
              <Plus className="w-4 h-4" />
              <span>Add Your First Habit</span>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}