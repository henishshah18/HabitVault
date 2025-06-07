import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { ProgressCircle } from './ProgressCircle';

import { HabitForm } from './HabitForm';
import { Flame, Trophy, CheckCircle2, Target, Plus, Clock } from 'lucide-react';
import { formatCompletionTime, getTodayLocalDate, formatTimestampWithContext } from '@/lib/timeUtils';

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
  completion_timestamp?: string;
}

interface DailyCheckinProps {
  onLogout: () => void;
  onNewHabit?: () => void;
}

interface User {
  id: number;
  email: string;
  perfect_days_count: number;
}

export function DailyCheckin({ onLogout, onNewHabit }: DailyCheckinProps) {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [loadingHabits, setLoadingHabits] = useState<Set<number>>(new Set());
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
      const localDate = getTodayLocalDate();
      const response = await fetch(`/api/habits?local_date=${localDate}`, {
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
    
    // Add loading state for this habit
    setLoadingHabits(prev => new Set(prev).add(habitId));
    
    // Optimistic update - update UI immediately
    const optimisticHabits = habits.map(habit => 
      habit.id === habitId 
        ? { ...habit, is_completed_today: !isCompleted, completion_timestamp: !isCompleted ? new Date().toISOString() : habit.completion_timestamp }
        : habit
    );
    setHabits(optimisticHabits);
    
    // Dispatch events immediately for responsive UI
    const event = !isCompleted ? 'habitCompleted' : 'habitUncompleted';
    window.dispatchEvent(new CustomEvent(event, { detail: { habitId } }));
    window.dispatchEvent(new CustomEvent('habitCompletionChanged', {
      detail: { habitId, isCompleted: !isCompleted, habits: optimisticHabits }
    }));
    
    try {
      const endpoint = isCompleted ? 'uncomplete' : 'complete';
      const response = await fetch(`/api/habits/${habitId}/${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          local_date: getTodayLocalDate(),
          local_timestamp: new Date().toISOString()
        })
      });

      const data = await response.json();

      if (response.ok) {
        // Small delay to show loading effect
        setTimeout(() => {
          // Update with server response but preserve is_due_today status
          setHabits(currentHabits => 
            currentHabits.map(habit => 
              habit.id === habitId 
                ? { 
                    ...data.habit, 
                    is_due_today: habit.is_due_today // Preserve due status to prevent disappearing
                  }
                : habit
            )
          );
          
          // Remove loading state
          setLoadingHabits(prev => {
            const newSet = new Set(prev);
            newSet.delete(habitId);
            return newSet;
          });
          
          // Final event dispatch with server data
          window.dispatchEvent(new CustomEvent('habitCompletionChanged', {
            detail: { habitId, isCompleted: !isCompleted, habits: optimisticHabits }
          }));
        }, 800);
        

      } else {
        // Revert optimistic update on error - get fresh state
        setHabits(currentHabits => 
          currentHabits.map(habit => 
            habit.id === habitId 
              ? { ...habit, is_completed_today: isCompleted, completion_timestamp: habit.completion_timestamp }
              : habit
          )
        );
        
        // Remove loading state
        setLoadingHabits(prev => {
          const newSet = new Set(prev);
          newSet.delete(habitId);
          return newSet;
        });
        
        window.dispatchEvent(new CustomEvent('habitCompletionChanged', {
          detail: { habitId, isCompleted, habits: optimisticHabits }
        }));
        
        toast({
          title: 'Error',
          description: data.error || 'Failed to update habit',
          variant: 'destructive',
        });
      }
    } catch (err) {
      // Revert optimistic update on network error
      setHabits(currentHabits => 
        currentHabits.map(habit => 
          habit.id === habitId 
            ? { ...habit, is_completed_today: isCompleted, completion_timestamp: habit.completion_timestamp }
            : habit
        )
      );
      
      // Remove loading state
      setLoadingHabits(prev => {
        const newSet = new Set(prev);
        newSet.delete(habitId);
        return newSet;
      });
      
      window.dispatchEvent(new CustomEvent('habitCompletionChanged', {
        detail: { habitId, isCompleted, habits: optimisticHabits }
      }));
      
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
        // Handle comma-separated custom days
        if (targetDays.includes(',')) {
          const dayMap: { [key: string]: string } = {
            'monday': 'Mon',
            'tuesday': 'Tue', 
            'wednesday': 'Wed',
            'thursday': 'Thu',
            'friday': 'Fri',
            'saturday': 'Sat',
            'sunday': 'Sun'
          };
          const days = targetDays.split(',').map(day => 
            dayMap[day.trim().toLowerCase()] || day.trim()
          );
          return days.join(', ');
        }
        return targetDays;
    }
  };

  const getTargetDaysVariant = (targetDays: string): "default" | "destructive" | "outline" | "secondary" => {
    return 'outline'; // Consistent plain white and black styling for all chips
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
                
                const isLoading = loadingHabits.has(habit.id);
                
                return (
                  <Card 
                    key={habit.id} 
                    className={`relative transition-all duration-500 ${
                      isCompleted 
                        ? 'border-t-4 border-t-green-500' 
                        : 'border-t-4 border-t-yellow-500'
                    } ${
                      isLoading 
                        ? 'opacity-60 scale-[0.98] shadow-lg' 
                        : 'opacity-100 scale-100'
                    }`}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-center space-x-3">
                        <Checkbox
                          checked={isCompleted}
                          onCheckedChange={() => handleToggleCompletion(habit.id, isCompleted)}
                          className="data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600"
                          disabled={isLoading}
                        />
                        <div className="flex-1">
                          <CardTitle className="text-lg">
                            <span>{habit.name}</span>
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
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Flame className="w-4 h-4 text-orange-500" />
                          <span className="text-sm font-medium">Current: {habit.current_streak} days</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Trophy className="w-4 h-4 text-yellow-500" />
                          <span className="text-sm text-muted-foreground">Best: {habit.longest_streak}</span>
                        </div>
                        {isCompleted && habit.completion_timestamp && (
                          <div className="flex items-center space-x-2 pt-1 border-t border-gray-200 dark:border-gray-700">
                            <Clock className="w-3 h-3 text-green-600" />
                            <span className="text-xs text-green-600">
                              Completed at {formatCompletionTime(habit.completion_timestamp)}
                            </span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
            <div className="mt-6 flex justify-end">
              <Button onClick={() => setShowHabitForm(true)} className="flex items-center space-x-2">
                <Plus className="w-4 h-4" />
                <span>Add New Habit</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="text-center py-12">
            <Target className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <h3 className="text-xl font-semibold mb-2">No targets scheduled for today</h3>
            <p className="text-muted-foreground mb-6">
              Start building better habits by adding your first one!
            </p>
            <Button onClick={() => setShowHabitForm(true)} className="flex items-center space-x-2">
              <Plus className="w-4 h-4" />
              <span>Add Your First Habit</span>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Inline Habit Creation Form */}
      {showHabitForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <HabitForm
              onSuccess={(newHabit) => {
                setShowHabitForm(false);
                fetchHabits(); // Refresh to get updated data
                fetchUserData(); // Refresh user data for milestone updates
                
                // New habit added successfully
              }}
              onCancel={() => setShowHabitForm(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}