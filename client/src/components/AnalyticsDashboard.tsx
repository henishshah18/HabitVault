import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart3, TrendingUp, Calendar, Target } from 'lucide-react';
import { HabitCalendar } from './HabitCalendar';
import { getCurrentUserId, getUserPreferences, updateUserPreference } from '@/lib/localStorage';

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

export function AnalyticsDashboard() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'week' | 'month'>('month');
  const [userId, setUserId] = useState<number | null>(null);

  useEffect(() => {
    // Initialize user preferences
    const currentUserId = getCurrentUserId();
    if (currentUserId) {
      setUserId(currentUserId);
      const userPrefs = getUserPreferences(currentUserId);
      setTimeRange(userPrefs.analyticsTimeRange);
    }

    fetchHabits();
    
    // Auto-refresh every 30 seconds to show real-time updates
    const interval = setInterval(fetchHabits, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleHabitCompletionChange = () => {
      fetchHabits();
    };

    window.addEventListener('habitCompletionChanged', handleHabitCompletionChange);
    return () => {
      window.removeEventListener('habitCompletionChanged', handleHabitCompletionChange);
    };
  }, []);

  // Handle time range changes and save to localStorage
  const handleTimeRangeChange = (newTimeRange: 'week' | 'month') => {
    setTimeRange(newTimeRange);
    if (userId) {
      updateUserPreference(userId, 'analyticsTimeRange', newTimeRange);
    }
  };

  const fetchHabits = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) return;

      const response = await fetch('/api/habits', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setHabits(data.habits || []);
      }
    } catch (error) {
      console.error('Failed to fetch habits:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalHabits = habits.length;
  const averageStreak = habits.length > 0 
    ? Math.round(habits.reduce((sum, habit) => sum + habit.current_streak, 0) / habits.length)
    : 0;
  const longestStreak = habits.reduce((max, habit) => Math.max(max, habit.longest_streak), 0);
  
  // Find habit(s) with longest streak
  const getLongestStreakHabit = () => {
    if (habits.length === 0 || longestStreak === 0) return 'No habits';
    
    const habitsWithLongestStreak = habits.filter(h => h.longest_streak === longestStreak);
    
    if (habitsWithLongestStreak.length === 1) {
      return `Habit: ${habitsWithLongestStreak[0].name}`;
    } else if (habitsWithLongestStreak.length > 1) {
      return 'Habit: Multiple';
    }
    return 'No habits';
  };

  const dueTodayHabits = habits.filter(h => h.is_due_today);
  const completionRate = dueTodayHabits.length > 0
    ? Math.round((dueTodayHabits.filter(h => h.is_completed_today).length / dueTodayHabits.length) * 100)
    : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
        <p className="text-muted-foreground">
          Track your progress and analyze your habit patterns
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Habits
            </CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalHabits}</div>
            <p className="text-xs text-muted-foreground">
              active habits
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Average Streak
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{averageStreak}</div>
            <p className="text-xs text-muted-foreground">
              days average
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Today's Rate
            </CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completionRate}%</div>
            <p className="text-xs text-muted-foreground">
              completion rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Longest Streak
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{longestStreak}</div>
            <p className="text-xs text-muted-foreground">
              {getLongestStreakHabit()}
            </p>
          </CardContent>
        </Card>
      </div>

      {loading ? (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin" />
            </div>
          </CardContent>
        </Card>
      ) : habits.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <BarChart3 className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <h3 className="text-xl font-semibold mb-2">No Habits Found</h3>
            <p className="text-muted-foreground">
              Create some habits to see your analytics and history
            </p>
          </CardContent>
        </Card>
      ) : (
        <HabitCalendar habits={habits} onDataUpdate={() => fetchHabits()} />
      )}
    </div>
  );
}