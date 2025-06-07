import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
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

interface CalendarDay {
  date: string;
  dayNumber: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  completedHabits: number;
  totalHabits: number;
  completionRatio: number;
}

type ViewMode = 'week' | 'month';

interface HabitCalendarProps {
  habits?: Habit[];
  onDataUpdate?: () => void;
}

export function HabitCalendar({ habits: externalHabits, onDataUpdate }: HabitCalendarProps) {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [calendarData, setCalendarData] = useState<CalendarDay[]>([]);

  // Load view mode preference
  useEffect(() => {
    const userId = getCurrentUserId();
    if (userId) {
      const prefs = getUserPreferences(userId);
      setViewMode(prefs.analyticsTimeRange === 'week' ? 'week' : 'month');
    }
  }, []);

  // Save view mode preference
  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
    const userId = getCurrentUserId();
    if (userId) {
      updateUserPreference(userId, 'analyticsTimeRange', mode === 'week' ? 'week' : 'month');
    }
  };

  // Fetch habits data
  const fetchHabits = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) return;

      const response = await fetch('/api/habits', {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Cache-Control': 'no-cache, no-store, must-revalidate'
        }
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

  // Use external habits if provided, otherwise fetch
  useEffect(() => {
    if (externalHabits) {
      setHabits(externalHabits);
      setLoading(false);
    } else {
      fetchHabits();
    }
  }, [externalHabits]);

  // Listen for habit completion updates
  useEffect(() => {
    const handleHabitUpdate = () => {
      if (!externalHabits) {
        fetchHabits();
      }
      if (onDataUpdate) {
        onDataUpdate();
      }
    };

    window.addEventListener('habitCompleted', handleHabitUpdate);
    window.addEventListener('habitUncompleted', handleHabitUpdate);
    
    return () => {
      window.removeEventListener('habitCompleted', handleHabitUpdate);
      window.removeEventListener('habitUncompleted', handleHabitUpdate);
    };
  }, [externalHabits, onDataUpdate]);

  // Check if a habit is due on a specific date
  const isHabitDueOnDate = (habit: Habit, date: Date): boolean => {
    const habitStartDate = new Date(habit.start_date);
    if (date < habitStartDate) return false;

    const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, etc.
    
    switch (habit.target_days) {
      case 'every_day':
        return true;
      case 'weekdays':
        return dayOfWeek >= 1 && dayOfWeek <= 5; // Monday to Friday
      case 'custom':
        return true; // For now, assume custom means every day
      default:
        return true;
    }
  };

  // Fetch completion data for a specific date range
  const fetchCompletionData = async (startDate: string, endDate: string) => {
    const token = localStorage.getItem('authToken');
    if (!token) return {};

    const completionMap: { [date: string]: { completed: number; total: number } } = {};

    // Initialize all dates
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      completionMap[dateStr] = { completed: 0, total: 0 };
    }

    // Get completion data for each habit
    for (const habit of habits) {
      try {
        const response = await fetch(`/api/habits/${habit.id}/history?start_date=${startDate}&end_date=${endDate}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
          const historyData = await response.json();
          
          // Process each date in the range
          for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            const dateStr = d.toISOString().split('T')[0];
            const today = new Date().toISOString().split('T')[0];
            
            if (isHabitDueOnDate(habit, d)) {
              completionMap[dateStr].total++;
              
              // For today, use real-time completion status
              if (dateStr === today) {
                if (habit.is_completed_today) {
                  completionMap[dateStr].completed++;
                }
              } else {
                // For historical dates, check completion history
                const completion = historyData.history?.find((h: any) => h.date === dateStr);
                if (completion && completion.status === 'completed') {
                  completionMap[dateStr].completed++;
                }
              }
            }
          }
        }
      } catch (error) {
        console.error(`Failed to fetch history for habit ${habit.id}:`, error);
      }
    }

    return completionMap;
  };

  // Generate calendar data
  const generateCalendarData = async () => {
    if (habits.length === 0) {
      setCalendarData([]);
      return;
    }

    const today = new Date();
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    let startDate: Date;
    let endDate: Date;
    
    if (viewMode === 'week') {
      // Get the start of the week (Sunday)
      const dayOfWeek = currentDate.getDay();
      startDate = new Date(currentDate);
      startDate.setDate(currentDate.getDate() - dayOfWeek);
      
      endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 6);
    } else {
      // Month view
      startDate = new Date(year, month, 1);
      endDate = new Date(year, month + 1, 0);
      
      // Extend to show full weeks
      const startDayOfWeek = startDate.getDay();
      if (startDayOfWeek > 0) {
        startDate.setDate(startDate.getDate() - startDayOfWeek);
      }
      
      const endDayOfWeek = endDate.getDay();
      if (endDayOfWeek < 6) {
        endDate.setDate(endDate.getDate() + (6 - endDayOfWeek));
      }
    }

    const completionData = await fetchCompletionData(
      startDate.toISOString().split('T')[0],
      endDate.toISOString().split('T')[0]
    );

    const days: CalendarDay[] = [];
    
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      const dayData = completionData[dateStr] || { completed: 0, total: 0 };
      
      days.push({
        date: dateStr,
        dayNumber: d.getDate(),
        isCurrentMonth: d.getMonth() === month,
        isToday: dateStr === today.toISOString().split('T')[0],
        completedHabits: dayData.completed,
        totalHabits: dayData.total,
        completionRatio: dayData.total > 0 ? dayData.completed / dayData.total : 0
      });
    }
    
    setCalendarData(days);
  };

  // Regenerate calendar when dependencies change
  useEffect(() => {
    if (!loading) {
      generateCalendarData();
    }
  }, [habits, currentDate, viewMode, loading]);

  // Navigation functions
  const navigatePrevious = () => {
    if (viewMode === 'week') {
      const newDate = new Date(currentDate);
      newDate.setDate(currentDate.getDate() - 7);
      setCurrentDate(newDate);
    } else {
      const newDate = new Date(currentDate);
      newDate.setMonth(currentDate.getMonth() - 1);
      setCurrentDate(newDate);
    }
  };

  const navigateNext = () => {
    if (viewMode === 'week') {
      const newDate = new Date(currentDate);
      newDate.setDate(currentDate.getDate() + 7);
      setCurrentDate(newDate);
    } else {
      const newDate = new Date(currentDate);
      newDate.setMonth(currentDate.getMonth() + 1);
      setCurrentDate(newDate);
    }
  };

  const navigateToday = () => {
    setCurrentDate(new Date());
  };

  // Get display title
  const getDisplayTitle = () => {
    if (viewMode === 'week') {
      const startOfWeek = new Date(currentDate);
      startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      
      if (startOfWeek.getMonth() === endOfWeek.getMonth()) {
        return `${startOfWeek.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })} - Week ${Math.ceil(currentDate.getDate() / 7)}`;
      } else {
        return `${startOfWeek.toLocaleDateString('en-US', { month: 'short' })} - ${endOfWeek.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`;
      }
    } else {
      return currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    }
  };

  // Get completion color
  const getCompletionColor = (ratio: number, isToday: boolean) => {
    if (isToday) {
      if (ratio === 1) return 'bg-green-500 text-white';
      if (ratio > 0.7) return 'bg-green-400 text-white';
      if (ratio > 0.3) return 'bg-yellow-400 text-gray-900';
      if (ratio > 0) return 'bg-orange-400 text-white';
      return 'bg-gray-300 text-gray-700 ring-2 ring-blue-500';
    } else {
      if (ratio === 1) return 'bg-green-500 text-white';
      if (ratio > 0.7) return 'bg-green-400 text-white';
      if (ratio > 0.3) return 'bg-yellow-400 text-gray-900';
      if (ratio > 0) return 'bg-orange-400 text-white';
      return 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="w-5 h-5" />
            <span>Habit Calendar</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-muted-foreground">Loading calendar...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="w-5 h-5" />
            <span>Habit Calendar</span>
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Select value={viewMode} onValueChange={(value: ViewMode) => handleViewModeChange(value)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">Week</SelectItem>
                <SelectItem value="month">Month</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={navigatePrevious}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={navigateNext}>
              <ChevronRight className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={navigateToday}>
              Today
            </Button>
          </div>
          <h3 className="text-lg font-medium">{getDisplayTitle()}</h3>
        </div>
      </CardHeader>
      <CardContent>
        {/* Day headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="text-center text-sm font-medium text-muted-foreground p-2">
              {day}
            </div>
          ))}
        </div>
        
        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1">
          {calendarData.map((day) => (
            <div
              key={day.date}
              className={`
                aspect-square p-2 rounded-lg text-xs flex flex-col items-center justify-center
                ${getCompletionColor(day.completionRatio, day.isToday)}
                ${!day.isCurrentMonth && viewMode === 'month' ? 'opacity-30' : ''}
                transition-colors duration-150
              `}
              title={`${day.date}: ${day.completedHabits}/${day.totalHabits} habits completed`}
            >
              <span className="font-medium">{day.dayNumber}</span>
              {day.totalHabits > 0 && (
                <span className="text-[10px] mt-1">
                  {day.completedHabits}/{day.totalHabits}
                </span>
              )}
            </div>
          ))}
        </div>
        
        {/* Legend */}
        <div className="flex items-center justify-center space-x-4 mt-4 text-xs text-muted-foreground">
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 rounded bg-green-500"></div>
            <span>Perfect</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 rounded bg-green-400"></div>
            <span>Great</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 rounded bg-yellow-400"></div>
            <span>Good</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 rounded bg-orange-400"></div>
            <span>Some</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 rounded bg-gray-300"></div>
            <span>None</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}