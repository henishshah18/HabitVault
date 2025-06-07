import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Save, X } from 'lucide-react';

interface Habit {
  id: number;
  name: string;
  target_days: string;
  start_date: string;
  user_id: number;
}

interface HabitFormProps {
  habit?: Habit | null;
  onSuccess: (habit: Habit) => void;
  onCancel: () => void;
}

export function HabitForm({ habit, onSuccess, onCancel }: HabitFormProps) {
  const [name, setName] = useState('');
  const [targetDays, setTargetDays] = useState('every_day');
  const [startDate, setStartDate] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    if (habit) {
      setName(habit.name);
      setTargetDays(habit.target_days);
      setStartDate(habit.start_date);
    } else {
      // Set default start date to today
      const today = new Date().toISOString().split('T')[0];
      setStartDate(today);
    }
  }, [habit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    const token = localStorage.getItem('authToken');
    
    if (!token) {
      setError('Authentication required');
      setIsLoading(false);
      return;
    }

    try {
      const url = habit ? `/api/habits/${habit.id}` : '/api/habits';
      const method = habit ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: name.trim(),
          target_days: targetDays,
          start_date: startDate,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: 'Success',
          description: habit ? 'Habit updated successfully' : 'Habit created successfully',
        });
        onSuccess(data.habit);
      } else {
        setError(data.error || 'Failed to save habit');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const targetDaysOptions = [
    { value: 'every_day', label: 'Every Day' },
    { value: 'weekdays', label: 'Weekdays (Mon-Fri)' },
    { value: 'custom', label: 'Custom Schedule' },
  ];

  return (
    <Card className="w-full max-w-lg mx-auto">
      <CardHeader>
        <div className="flex items-center space-x-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={onCancel}
            className="p-2"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <CardTitle>{habit ? 'Edit Habit' : 'Add New Habit'}</CardTitle>
            <CardDescription>
              {habit ? 'Update your habit details' : 'Create a new habit to track'}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="name">Habit Name</Label>
            <Input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={isLoading}
              placeholder="e.g., Drink 2L water daily"
              maxLength={200}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="target-days">Target Days</Label>
            <Select
              value={targetDays}
              onValueChange={setTargetDays}
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select target days" />
              </SelectTrigger>
              <SelectContent>
                {targetDaysOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="start-date">Start Date</Label>
            <Input
              id="start-date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>
        </CardContent>
        
        <CardFooter className="flex space-x-3">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1"
          >
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isLoading || !name.trim()}
            className="flex-1"
          >
            <Save className="w-4 h-4 mr-2" />
            {isLoading ? 'Saving...' : (habit ? 'Update' : 'Create')}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}