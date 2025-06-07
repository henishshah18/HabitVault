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
  const [viewSwitching, setViewSwitching] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [calendarData, setCalendarData] = useState<CalendarDay[]>([]);
  const [completionCache, setCompletionCache] = useState<Map<string, any>>(new Map());

  // Load view mode preference
  useEffect(() => {
    const userId = getCurrentUserId();
    if (userId) {
      const prefs = getUserPreferences(userId);
      setViewMode(prefs.analyticsTimeRange === 'week' ? 'week' : 'month');
    }
  }, []);

  // Save view mode preference
  const handleViewModeChange = async (mode: ViewMode) => {
    if (mode === viewMode) return;
    
    setViewSwitching(true);
    setViewMode(mode);
    const userId = getCurrentUserId();
    if (userId) {
      updateUserPreference(userId, 'analyticsTimeRange', mode === 'week' ? 'week' : 'month');
    }
    
    // Regenerate calendar data for new view
    await generateCalendarData();
    setViewSwitching(false);
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
    // First check if the date is on or after the habit start date
    const habitStartDate = new Date(habit.start_date);
    if (date < habitStartDate) return false;

    const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, etc.
    // Convert to backend format: 0=Monday, 6=Sunday
    const backendDayOfWeek = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    
    if (habit.target_days === 'every_day') {
      return true;
    } else if (habit.target_days === 'weekdays') {
      return backendDayOfWeek < 5; // Monday to Friday
    } else {
      // Handle custom days like "monday,wednesday,friday"
      if (habit.target_days.includes(',')) {
        const weekdayNames = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
        const selectedDays = habit.target_days.split(',').map(day => day.trim().toLowerCase());
        const todayName = weekdayNames[backendDayOfWeek];
        return selectedDays.includes(todayName);
      }
      
      // For single custom day
      const weekdayNames = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
      const todayName = weekdayNames[backendDayOfWeek];
      return habit.target_days.toLowerCase() === todayName;
    }
  };

  // Fetch completion data for a specific date range with caching and parallel requests
  const fetchCompletionData = async (startDate: string, endDate: string) => {
    const token = localStorage.getItem('authToken');
    if (!token) return {};

    const cacheKey = `${startDate}-${endDate}-${habits.map(h => h.id).join(',')}`;
    
    // Check cache first
    if (completionCache.has(cacheKey)) {
      return completionCache.get(cacheKey);
    }

    const completionMap: { [date: string]: { completed: number; total: number } } = {};

    // Initialize all dates using local timezone
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      completionMap[dateStr] = { completed: 0, total: 0 };
    }

    // Fetch all habit histories in parallel
    const historyPromises = habits.map(async (habit) => {
      try {
        const response = await fetch(`/api/habits/${habit.id}/history?start_date=${startDate}&end_date=${endDate}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
          const historyData = await response.json();
          return { habit, historyData };
        }
        return { habit, historyData: null };
      } catch (error) {
        console.error(`Failed to fetch history for habit ${habit.id}:`, error);
        return { habit, historyData: null };
      }
    });

    const historyResults = await Promise.all(historyPromises);

    // Process all results
    historyResults.forEach(({ habit, historyData }) => {
      if (!historyData) return;

      // Process each date in the range
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        const today = new Date();
        const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
        
        if (isHabitDueOnDate(habit, d)) {
          completionMap[dateStr].total++;
          
          // For today, use real-time completion status
          if (dateStr === todayStr) {
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
    });

    // Cache the result
    setCompletionCache(prev => new Map(prev.set(cacheKey, completionMap)));

    return completionMap;
  };

  // Generate calendar data
  const generateCalendarData = async () => {
    if (habits.length === 0) {
      setCalendarData([]);
      return;
    }

    if (!viewSwitching) {
      setLoading(true);
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

    const startDateStr = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}-${String(startDate.getDate()).padStart(2, '0')}`;
    const endDateStr = `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')}`;
    
    const completionData = await fetchCompletionData(startDateStr, endDateStr);

    const days: CalendarDay[] = [];
    
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      const dayData = completionData[dateStr] || { completed: 0, total: 0 };
      
      days.push({
        date: dateStr,
        dayNumber: d.getDate(),
        isCurrentMonth: d.getMonth() === month,
        isToday: dateStr === todayStr,
        completedHabits: dayData.completed,
        totalHabits: dayData.total,
        completionRatio: dayData.total > 0 ? dayData.completed / dayData.total : 0
      });
    }
    
    setCalendarData(days);
    if (!viewSwitching) {
      setLoading(false);
    }
  };

  // Update calendar when habits or date changes (but not viewMode - handled in handleViewModeChange)
  useEffect(() => {
    generateCalendarData();
  }, [habits, currentDate]);

  // Clear cache when habits change
  useEffect(() => {
    setCompletionCache(new Map());
  }, [habits]);

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
            <span>Habit History Calendar</span>
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
    <Card className={`transition-opacity duration-500 ${viewSwitching ? 'opacity-60' : 'opacity-100'}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="w-5 h-5" />
            <span>Habit History Calendar</span>
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