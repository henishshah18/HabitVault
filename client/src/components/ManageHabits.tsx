import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Edit, Trash2, Plus, Calendar, Target, Flame, Trophy } from 'lucide-react';
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
}

interface ManageHabitsProps {
  onLogout: () => void;
}

export function ManageHabits({ onLogout }: ManageHabitsProps) {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const { toast } = useToast();

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
    fetchHabits();
  }, [onLogout]);

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
      setHabits(habits.map(h => h.id === habit.id ? habit : h));
    } else {
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
      default:
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
            <div className="text-center">Loading habits...</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (showForm) {
    return (
      <div className="space-y-6">
        <HabitForm
          habit={editingHabit}
          onSuccess={handleFormSuccess}
          onCancel={handleFormCancel}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>All Habits</CardTitle>
              <CardDescription>
                Manage all your habits - add new ones, edit existing ones, or delete old ones
              </CardDescription>
            </div>
            <Button onClick={() => setShowForm(true)} className="flex items-center space-x-2">
              <Plus className="w-4 h-4" />
              <span>Add New Habit</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {habits.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Target className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-semibold mb-2">No habits yet</h3>
              <p>Start building better habits by adding your first one!</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {habits.map((habit) => (
                <Card key={habit.id} className="relative">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">{habit.name}</CardTitle>
                    <div className="flex items-center space-x-2">
                      <Badge variant={getTargetDaysVariant(habit.target_days)}>
                        {getTargetDaysDisplay(habit.target_days)}
                      </Badge>
                      {habit.is_due_today && (
                        <Badge variant="outline" className="text-blue-600">
                          Due Today
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                      <Calendar className="w-4 h-4" />
                      <span>Started: {new Date(habit.start_date).toLocaleDateString()}</span>
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
                  <CardFooter className="flex justify-end space-x-2 pt-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(habit)}
                      className="p-2 h-8 w-8"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(habit.id)}
                      className="p-2 h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}