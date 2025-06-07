import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Edit, Trash2, Plus, Calendar, Target, Flame, Trophy, CheckCircle2 } from 'lucide-react';
import { HabitForm } from '@/components/HabitForm';

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

interface HabitListProps {
  onLogout: () => void;
}

/**
 * HabitList Component
 * 
 * Displays a list of user's habits with interactive features for tracking and management.
 * Provides real-time updates and interactions for habit completion and streak tracking.
 * 
 * Features:
 * - Interactive habit completion toggles
 * - Streak tracking and display
 * - Progress indicators
 * - Sorting and filtering options
 * - Responsive design for various screen sizes
 */

/**
 * Interface for the HabitList component props
 * @interface HabitListProps
 * @property {boolean} [compact] - Whether to show the compact version of the list
 * @property {() => void} [onHabitUpdate] - Callback when a habit is updated
 * @property {(habit: Habit) => void} [onEditHabit] - Callback to edit a habit
 * @property {(habitId: number) => void} [onDeleteHabit] - Callback to delete a habit
 */

export function HabitList({ onLogout }: HabitListProps) {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [userName, setUserName] = useState('');
  const { toast } = useToast();

  // Calculate progress
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
      // Fetch user profile to get name
      const userResponse = await fetch('/api/protected', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      const userData = await userResponse.json();
      if (userResponse.ok && userData.user) {
        const email = userData.user.email;
        setUserName(email.split('@')[0]); // Use email prefix as name
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

    // Listen for habit completion changes from other components
    const handleHabitCompletionChanged = (event: CustomEvent) => {
      const { habits: updatedHabits } = event.detail;
      if (updatedHabits) {
        setHabits(updatedHabits);
      }
    };

    window.addEventListener('habitCompletionChanged', handleHabitCompletionChanged as EventListener);

    return () => {
      window.removeEventListener('habitCompletionChanged', handleHabitCompletionChanged as EventListener);
    };
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
        // Update habit in local state
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

  const handleDelete = async (habitId: number) => {
    const token = localStorage.getItem('authToken');
    
    try {
      const response = await fetch(`/api/habits/${habitId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        setHabits(habits.filter(habit => habit.id !== habitId));
        toast({
          title: 'Success',
          description: 'Habit deleted successfully',
        });
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to delete habit',
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

  const handleEdit = (habit: Habit) => {
    setEditingHabit(habit);
    setShowForm(true);
  };

  const handleFormSuccess = (habit: Habit) => {
    if (editingHabit) {
      // Update existing habit
      setHabits(habits.map(h => h.id === habit.id ? habit : h));
    } else {
      // Add new habit
      setHabits([...habits, habit]);
    }
    setShowForm(false);
    setEditingHabit(null);
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setEditingHabit(null);
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
      <div className="w-full max-w-4xl mx-auto space-y-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">Loading habits...</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (showForm) {
    return (
      <div className="w-full max-w-4xl mx-auto space-y-6">
        <HabitForm
          habit={editingHabit}
          onSuccess={handleFormSuccess}
          onCancel={handleFormCancel}
        />
      </div>
    );
  }

  // Separate habits into today's and other
  const otherHabits = habits.filter(habit => !habit.is_due_today);

  const renderHabitCard = (habit: Habit) => {
    const isCompleted = habit.is_completed_today;
    const isDue = habit.is_due_today;
    
    return (
      <Card 
        key={habit.id} 
        className={`relative transition-all duration-200 ${
          isDue 
            ? isCompleted 
              ? 'border-green-500 bg-green-50 dark:bg-green-900/20' 
              : 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20'
            : 'border-border'
        }`}
      >
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center space-x-2">
              {isDue && (
                <Checkbox
                  checked={isCompleted}
                  onCheckedChange={() => handleToggleCompletion(habit.id, isCompleted)}
                  className="mr-2"
                />
              )}
              <span>{habit.name}</span>
              {isCompleted && <CheckCircle2 className="w-4 h-4 text-green-600" />}
            </CardTitle>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant={getTargetDaysVariant(habit.target_days)}>
              {getTargetDaysDisplay(habit.target_days)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-2 text-muted-foreground">
              <Calendar className="w-4 h-4" />
              <span>Started: {new Date(habit.start_date).toLocaleDateString()}</span>
            </div>
          </div>
          
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
        <CardFooter className="flex justify-between pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleEdit(habit)}
            className="flex items-center space-x-1"
          >
            <Edit className="w-3 h-3" />
            <span>Edit</span>
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => handleDelete(habit.id)}
            className="flex items-center space-x-1"
          >
            <Trash2 className="w-3 h-3" />
            <span>Delete</span>
          </Button>
        </CardFooter>
      </Card>
    );
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* Header with Welcome and Progress */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Welcome back, {userName || 'User'}!</h1>
          <p className="text-muted-foreground">Track your daily habits and build better routines</p>
        </div>
        
        {/* Progress Circle */}
        <div className="relative">
          <div className="w-24 h-24 rounded-full border-4 border-muted flex items-center justify-center relative">
            <Progress 
              value={progressPercentage} 
              className="absolute inset-2 rounded-full"
              style={{
                background: `conic-gradient(hsl(142.1 76.2% 36.3%) ${progressPercentage * 3.6}deg, hsl(210 40% 98%) 0deg)`
              }}
            />
            <div className="text-center z-10 bg-background rounded-full w-16 h-16 flex flex-col items-center justify-center">
              <div className="text-lg font-bold">
                {isPerfectDay ? '🎉' : `${completedTasks}/${totalTasks}`}
              </div>
              <div className="text-xs text-muted-foreground">
                {isPerfectDay ? 'Perfect!' : 'tasks'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Today's Habits Section */}
      {todaysHabits.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl">Today's Habits</CardTitle>
                <CardDescription>
                  {isPerfectDay 
                    ? "🎉 Perfect Day! All habits completed!" 
                    : `${completedTasks} of ${totalTasks} habits completed`
                  }
                </CardDescription>
              </div>
              <Button onClick={() => setShowForm(true)} className="flex items-center space-x-2">
                <Plus className="w-4 h-4" />
                <span>Add Habit</span>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {todaysHabits.map(renderHabitCard)}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Other Habits Section */}
      {otherHabits.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Other Habits</CardTitle>
            <CardDescription>
              Habits not scheduled for today
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {otherHabits.map(renderHabitCard)}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {habits.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Target className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <h3 className="text-xl font-semibold mb-2">No habits yet</h3>
            <p className="text-muted-foreground mb-6">Start building better habits by adding your first one!</p>
            <Button onClick={() => setShowForm(true)} className="flex items-center space-x-2">
              <Plus className="w-4 h-4" />
              <span>Add Your First Habit</span>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}