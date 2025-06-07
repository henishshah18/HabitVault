import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart3, TrendingUp, Calendar, Target } from 'lucide-react';
import { HabitCalendar } from './HabitCalendar';
import { getCurrentUserId, getUserPreferences, updateUserPreference } from '@/lib/localStorage';
import { getTodayLocalDate } from '@/lib/timeUtils';

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
  const [perfectDayRate, setPerfectDayRate] = useState<number>(0);
  const [loadingPerfectRate, setLoadingPerfectRate] = useState(true);

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
    const handleHabitCompletionChange = (event: CustomEvent) => {
      const { habits: updatedHabits } = event.detail;
      if (updatedHabits) {
        setHabits(updatedHabits);
        // Recalculate perfect day rate with updated habits
        const token = localStorage.getItem('authToken');
        if (token) {
          calculatePerfectDayRate(updatedHabits, token);
        }
      } else {
        fetchHabits();
      }
    };

    window.addEventListener('habitCompletionChanged', handleHabitCompletionChange as EventListener);
    return () => {
      window.removeEventListener('habitCompletionChanged', handleHabitCompletionChange as EventListener);
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

      const localDate = getTodayLocalDate();
      const response = await fetch(`/api/habits?local_date=${localDate}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setHabits(data.habits || []);
        
        // Calculate perfect day completion rate
        await calculatePerfectDayRate(data.habits || [], token);
      }
    } catch (error) {
      console.error('Failed to fetch habits:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculatePerfectDayRate = async (habitsData: Habit[], token: string) => {
    setLoadingPerfectRate(true);
    
    if (habitsData.length === 0) {
      setPerfectDayRate(0);
      setLoadingPerfectRate(false);
      return;
    }

    try {
      // Get historical data from the earliest habit start date
      const endDate = new Date();
      const earliestStartDate = habitsData.reduce((earliest, habit) => {
        const habitStartDate = new Date(habit.start_date);
        return habitStartDate < earliest ? habitStartDate : earliest;
      }, new Date());
      
      const startDate = earliestStartDate;

      // Get completion history for all habits
      const historyPromises = habitsData.map(async (habit) => {
        const response = await fetch(
          `/api/habits/${habit.id}/history?start_date=${startDate.toISOString().split('T')[0]}&end_date=${endDate.toISOString().split('T')[0]}`,
          {
            headers: { 'Authorization': `Bearer ${token}` },
          }
        );
        
        if (response.ok) {
          const historyData = await response.json();
          return { habit, history: historyData.history };
        }
        return null;
      });

      const allHistories = (await Promise.all(historyPromises)).filter(h => h !== null);
      
      if (allHistories.length === 0) {
        setPerfectDayRate(0);
        return;
      }

      // Calculate perfect days
      const dateMap = new Map<string, { completed: number; total: number }>();
      
      // Initialize all dates in range
      for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split('T')[0];
        dateMap.set(dateStr, { completed: 0, total: 0 });
      }

      // Process each habit's history
      allHistories.forEach(({ habit, history }) => {
        history.forEach((day: any) => {
          const dayData = dateMap.get(day.date);
          if (dayData) {
            // Check if habit was due on this date
            const date = new Date(day.date);
            const habitStartDate = new Date(habit.start_date);
            
            if (date >= habitStartDate && isDueOnDate(habit.target_days, date)) {
              dayData.total++;
              if (day.status === 'completed') {
                dayData.completed++;
              }
            }
          }
        });
      });

      // Calculate perfect day rate
      const daysWithHabits = Array.from(dateMap.values()).filter(day => day.total > 0);
      const perfectDays = daysWithHabits.filter(day => day.completed === day.total).length;
      
      const rate = daysWithHabits.length > 0 ? Math.round((perfectDays / daysWithHabits.length) * 100) : 0;
      setPerfectDayRate(rate);
      
    } catch (error) {
      console.error('Failed to calculate perfect day rate:', error);
      setPerfectDayRate(0);
    } finally {
      setLoadingPerfectRate(false);
    }
  };

  const isDueOnDate = (targetDays: string, date: Date) => {
    const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, etc.
    
    switch (targetDays) {
      case 'every_day':
        return true;
      case 'weekdays':
        return dayOfWeek >= 1 && dayOfWeek <= 5;
      default:
        if (targetDays.includes(',')) {
          const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
          const requiredDays = targetDays.split(',').map(d => d.trim().toLowerCase());
          return requiredDays.includes(dayNames[dayOfWeek]);
        }
        return true;
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

  // Use the calculated perfect day rate instead of today's completion rate

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
          <p className="text-muted-foreground">
            Track your progress and analyze your habit patterns
          </p>
        </div>
        <Select value={timeRange} onValueChange={handleTimeRangeChange}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="week">Week</SelectItem>
            <SelectItem value="month">Month</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className={`transition-opacity duration-500 ${loading ? 'opacity-60' : 'opacity-100'}`}>
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

        <Card className={`transition-opacity duration-500 ${loading ? 'opacity-60' : 'opacity-100'}`}>
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

        <Card className={`transition-opacity duration-500 ${loadingPerfectRate ? 'opacity-60' : 'opacity-100'}`}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Completion Rate
            </CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{perfectDayRate}%</div>
            <p className="text-xs text-muted-foreground">
              perfect days (all time)
            </p>
          </CardContent>
        </Card>

        <Card className={`transition-opacity duration-500 ${loading ? 'opacity-60' : 'opacity-100'}`}>
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

      {habits.length === 0 && !loading ? (
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
        <div className={`transition-opacity duration-500 ${loading ? 'opacity-60' : 'opacity-100'}`}>
          <HabitCalendar habits={habits} onDataUpdate={() => fetchHabits()} />
        </div>
      )}
    </div>
  );
}