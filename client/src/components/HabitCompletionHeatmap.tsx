import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { getCurrentUserId, getUserPreferences, updateUserPreference } from '@/lib/localStorage';

interface DayCompletion {
  date: string;
  completed_habits: number;
  total_habits: number;
  completion_ratio: number;
}

interface HabitCompletionHeatmapProps {
  habitId?: number;
}

type ViewMode = 'week' | 'month';

export function HabitCompletionHeatmap({ habitId }: HabitCompletionHeatmapProps) {
  const [completionData, setCompletionData] = useState<DayCompletion[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [userId, setUserId] = useState<number | null>(null);

  // Initialize user preferences on mount
  useEffect(() => {
    const currentUserId = getCurrentUserId();
    if (currentUserId) {
      setUserId(currentUserId);
      const preferences = getUserPreferences(currentUserId);
      setViewMode(preferences.analyticsTimeRange);
    }
  }, []);

  useEffect(() => {
    fetchCompletionData();
  }, [habitId, viewMode, currentDate]);

  useEffect(() => {
    const handleHabitCompletionChange = () => {
      fetchCompletionData();
    };

    window.addEventListener('habitCompletionChanged', handleHabitCompletionChange);
    return () => {
      window.removeEventListener('habitCompletionChanged', handleHabitCompletionChange);
    };
  }, []);

  const fetchCompletionData = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        setLoading(false);
        return;
      }

      const { startDate, endDate } = getDateRange(viewMode, currentDate);
      
      // Get all habits
      const habitsResponse = await fetch('/api/habits', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!habitsResponse.ok) {
        console.error('Failed to fetch habits:', habitsResponse.status);
        setLoading(false);
        return;
      }
      
      const habitsData = await habitsResponse.json();
      const habits = habitsData.habits || [];
      
      const completionMap = new Map<string, DayCompletion>();
      
      // Initialize all dates in range
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split('T')[0];
        completionMap.set(dateStr, {
          date: dateStr,
          completed_habits: 0,
          total_habits: 0,
          completion_ratio: 0
        });
      }

      // Process each habit and build completion data
      const habitStart = new Date(start);
      const today = new Date().toISOString().split('T')[0];
      
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split('T')[0];
        const dayData = completionMap.get(dateStr);
        
        if (dayData) {
          // Count habits due on this day
          for (const habit of habits) {
            const habitStartDate = new Date(habit.start_date);
            
            // Check if habit is due on this day
            if (d >= habitStartDate && isDueOnDate(habit.target_days, d)) {
              dayData.total_habits++;
              
              // For today, use the real-time completion status
              if (dateStr === today) {
                if (habit.is_completed_today) {
                  dayData.completed_habits++;
                }
              } else {
                // For other days, try to fetch from history
                try {
                  const historyResponse = await fetch(`/api/habits/${habit.id}/history?start_date=${dateStr}&end_date=${dateStr}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                  });

                  if (historyResponse.ok) {
                    const historyData = await historyResponse.json();
                    const completionHistory = historyData.history || [];
                    
                    const completionForDay = completionHistory.find((h: any) => h.date === dateStr);
                    if (completionForDay && completionForDay.status === 'completed') {
                      dayData.completed_habits++;
                    }
                  }
                } catch (error) {
                  console.error(`Failed to fetch history for habit ${habit.id} on ${dateStr}:`, error);
                }
              }
            }
          }
          
          dayData.completion_ratio = dayData.total_habits > 0 ? dayData.completed_habits / dayData.total_habits : 0;
          completionMap.set(dateStr, dayData);
        }
      }

      setCompletionData(Array.from(completionMap.values()));
    } catch (error) {
      console.error('Failed to fetch completion data:', error);
    } finally {
      setLoading(false);
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

  const getDateRange = (mode: ViewMode, date: Date) => {
    if (mode === 'week') {
      const startOfWeek = new Date(date);
      startOfWeek.setDate(date.getDate() - date.getDay());
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      
      return {
        startDate: startOfWeek.toISOString().split('T')[0],
        endDate: endOfWeek.toISOString().split('T')[0]
      };
    } else {
      const year = date.getFullYear();
      const month = date.getMonth();
      const startOfMonth = new Date(year, month, 1);
      const endOfMonth = new Date(year, month + 1, 0);
      
      return {
        startDate: startOfMonth.toISOString().split('T')[0],
        endDate: endOfMonth.toISOString().split('T')[0]
      };
    }
  };

  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    
    if (viewMode === 'week') {
      newDate.setDate(currentDate.getDate() + (direction === 'next' ? 7 : -7));
    } else {
      newDate.setMonth(currentDate.getMonth() + (direction === 'next' ? 1 : -1));
    }
    
    setCurrentDate(newDate);
  };

  const getColorForRatio = (ratio: number, totalHabits: number) => {
    if (totalHabits === 0) {
      return 'bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-500';
    }
    
    if (ratio === 0) {
      return 'bg-red-100 dark:bg-red-900/30 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300';
    }
    
    // Green shades based on completion ratio
    if (ratio === 1) {
      return 'bg-green-700 border-green-800 text-white';
    } else if (ratio >= 0.8) {
      return 'bg-green-600 border-green-700 text-white';
    } else if (ratio >= 0.6) {
      return 'bg-green-500 border-green-600 text-white';
    } else if (ratio >= 0.4) {
      return 'bg-green-400 border-green-500 text-gray-800';
    } else if (ratio >= 0.2) {
      return 'bg-green-300 border-green-400 text-gray-800';
    } else {
      return 'bg-green-200 border-green-300 text-gray-800';
    }
  };

  const renderCalendarGrid = () => {
    if (!completionData.length) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          No data available for this period
        </div>
      );
    }

    const dataMap = new Map(
      completionData.map(item => [item.date, item])
    );

    if (viewMode === 'week') {
      return renderWeekView(dataMap);
    } else {
      return renderMonthView(dataMap);
    }
  };

  const renderWeekView = (dataMap: Map<string, DayCompletion>) => {
    const { startDate } = getDateRange('week', currentDate);
    const startDay = new Date(startDate);
    const days = [];

    for (let i = 0; i < 7; i++) {
      const day = new Date(startDay);
      day.setDate(startDay.getDate() + i);
      days.push(day);
    }

    return (
      <div className="grid grid-cols-7 gap-3">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="text-center text-sm font-medium text-muted-foreground p-2">
            {day}
          </div>
        ))}
        {days.map(day => {
          const dateStr = day.toISOString().split('T')[0];
          const data = dataMap.get(dateStr);
          const ratio = data?.completion_ratio || 0;
          const totalHabits = data?.total_habits || 0;
          
          return (
            <div
              key={dateStr}
              className={`aspect-square flex items-center justify-center text-sm rounded-lg border-2 ${getColorForRatio(ratio, totalHabits)} transition-all hover:scale-105 cursor-pointer`}
              title={`${data?.completed_habits || 0}/${totalHabits} habits completed (${Math.round(ratio * 100)}%)`}
            >
              {day.getDate()}
            </div>
          );
        })}
      </div>
    );
  };

  const renderMonthView = (dataMap: Map<string, DayCompletion>) => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(firstDay.getDate() - firstDay.getDay());

    const days = [];
    const current = new Date(startDate);

    while (current <= lastDay || current.getDay() !== 0) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }

    return (
      <div className="grid grid-cols-7 gap-2">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="text-center text-sm font-medium text-muted-foreground p-2">
            {day}
          </div>
        ))}
        {days.map(day => {
          const dateStr = day.toISOString().split('T')[0];
          const data = dataMap.get(dateStr);
          const ratio = data?.completion_ratio || 0;
          const totalHabits = data?.total_habits || 0;
          const isCurrentMonth = day.getMonth() === month;
          
          return (
            <div
              key={dateStr}
              className={`aspect-square flex items-center justify-center text-xs rounded-md border ${getColorForRatio(ratio, totalHabits)} ${
                !isCurrentMonth ? 'opacity-40' : ''
              } transition-all hover:scale-105 cursor-pointer`}
              title={`${data?.completed_habits || 0}/${totalHabits} habits completed (${Math.round(ratio * 100)}%)`}
            >
              {day.getDate()}
            </div>
          );
        })}
      </div>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-8">
            <div className="w-6 h-6 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const perfectDays = completionData.filter(d => d.completion_ratio === 1 && d.total_habits > 0).length;
  const totalDaysWithHabits = completionData.filter(d => d.total_habits > 0).length;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Habit Completion Calendar</CardTitle>
            <CardDescription>
              Daily completion rates across all your habits
            </CardDescription>
          </div>
          <div className="flex items-center space-x-2">
            <Select 
              value={viewMode} 
              onValueChange={(value: ViewMode) => {
                setViewMode(value);
                if (userId) {
                  updateUserPreference(userId, 'analyticsTimeRange', value);
                }
              }}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">Weekly</SelectItem>
                <SelectItem value="month">Monthly</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center justify-center sm:justify-start space-x-2">
            <Button variant="outline" size="sm" onClick={() => navigateDate('prev')}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <h3 className="text-base sm:text-lg font-semibold text-center">
              {viewMode === 'week' 
                ? `Week of ${currentDate.toLocaleDateString()}`
                : currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
              }
            </h3>
            <Button variant="outline" size="sm" onClick={() => navigateDate('next')}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
          
          <div className="text-sm text-center sm:text-right">
            <span className="font-semibold text-green-600 dark:text-green-400">
              {perfectDays}/{totalDaysWithHabits}
            </span>
            <span className="text-muted-foreground ml-1">perfect days</span>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {renderCalendarGrid()}
        
        <div className="flex items-center justify-center space-x-4 mt-6 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-red-100 border border-red-200 rounded-sm" />
            <span>0%</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-green-200 border border-green-300 rounded-sm" />
            <span>20%</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-green-400 border border-green-500 rounded-sm" />
            <span>60%</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-green-600 border border-green-700 rounded-sm" />
            <span>80%</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-green-700 border border-green-800 rounded-sm" />
            <span>100%</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-sm" />
            <span>No habits</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}