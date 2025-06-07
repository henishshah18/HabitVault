import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';

interface HabitHistoryData {
  habit_id: number;
  habit_name: string;
  start_date: string;
  end_date: string;
  total_days: number;
  completed_days: number;
  history: Array<{
    date: string;
    status: 'completed' | 'missed' | 'not_logged';
  }>;
}

interface HabitHistoryViewProps {
  habitId: number;
}

type DateRange = 'week' | 'month' | 'custom';

export function HabitHistoryView({ habitId }: HabitHistoryViewProps) {
  const [historyData, setHistoryData] = useState<HabitHistoryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dateRange, setDateRange] = useState<DateRange>('month');
  const [currentDate, setCurrentDate] = useState(new Date());

  const getDateRange = (range: DateRange, date: Date) => {
    const end = new Date(date);
    const start = new Date(date);

    switch (range) {
      case 'week':
        start.setDate(date.getDate() - 6);
        break;
      case 'month':
        start.setDate(date.getDate() - 29);
        break;
      default:
        start.setDate(date.getDate() - 29);
    }

    return {
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0],
    };
  };

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        setError('Authentication required');
        return;
      }

      const { startDate, endDate } = getDateRange(dateRange, currentDate);
      
      const response = await fetch(
        `/api/habits/${habitId}/history?start_date=${startDate}&end_date=${endDate}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch history: ${response.statusText}`);
      }

      const data = await response.json();
      setHistoryData(data);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [habitId, dateRange, currentDate]);

  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    const days = dateRange === 'week' ? 7 : 30;
    
    if (direction === 'prev') {
      newDate.setDate(currentDate.getDate() - days);
    } else {
      newDate.setDate(currentDate.getDate() + days);
    }
    
    setCurrentDate(newDate);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500';
      case 'missed':
        return 'bg-red-400';
      default:
        return 'bg-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Completed';
      case 'missed':
        return 'Missed';
      default:
        return 'Not logged';
    }
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

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center py-8">
            <p className="text-red-600">{error}</p>
            <Button onClick={fetchHistory} className="mt-4">
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!historyData) {
    return null;
  }

  const completionRate = historyData.total_days > 0 
    ? Math.round((historyData.completed_days / historyData.total_days) * 100)
    : 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="w-5 h-5" />
            <span>{historyData.habit_name} History</span>
          </CardTitle>
          
          <div className="flex items-center space-x-2">
            <Select value={dateRange} onValueChange={(value: DateRange) => setDateRange(value)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">Last 7 Days</SelectItem>
                <SelectItem value="month">Last 30 Days</SelectItem>
              </SelectContent>
            </Select>
            
            <div className="flex items-center space-x-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateDate('prev')}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateDate('next')}
                disabled={currentDate >= new Date()}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
          <span>Completion Rate: {completionRate}%</span>
          <span>Completed: {historyData.completed_days}/{historyData.total_days} days</span>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          {/* Calendar Grid */}
          <div className={`grid gap-2 ${dateRange === 'week' ? 'grid-cols-7' : 'grid-cols-7'}`}>
            {historyData.history.map((day, index) => {
              const date = new Date(day.date);
              const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
              const dayNumber = date.getDate();
              
              return (
                <div
                  key={day.date}
                  className="flex flex-col items-center p-2 rounded-lg border"
                  title={`${date.toLocaleDateString()}: ${getStatusText(day.status)}`}
                >
                  <div className="text-xs text-muted-foreground mb-1">
                    {dayName}
                  </div>
                  <div className="text-sm font-medium mb-2">
                    {dayNumber}
                  </div>
                  <div 
                    className={`w-4 h-4 rounded-full ${getStatusColor(day.status)}`}
                  />
                </div>
              );
            })}
          </div>
          
          {/* Legend */}
          <div className="flex items-center justify-center space-x-6 pt-4 border-t">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span className="text-sm">Completed</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-red-400" />
              <span className="text-sm">Missed</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-gray-200" />
              <span className="text-sm">Not logged</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}