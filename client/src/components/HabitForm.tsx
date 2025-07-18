import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { getTodayLocalDate, getMinDateForPicker, formatDateForForm } from '@/lib/timeUtils';
import { ArrowLeft, Save, X } from 'lucide-react';

/**
 * HabitForm Component
 * 
 * A form component for creating and editing habits. This component provides a modal interface
 * for users to input or modify habit details including name, frequency, and start date.
 * 
 * Features:
 * - Create new habits or edit existing ones
 * - Set habit frequency (daily, weekdays, or custom schedule)
 * - Custom day selection for specific days of the week
 * - Validation and error handling
 * - JWT authentication integration
 */

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

/**
 * Interface for the Habit data structure
 * @interface Habit
 * @property {number} id - Unique identifier for the habit
 * @property {string} unique_id - UUID for the habit
 * @property {string} name - Name/description of the habit
 * @property {string} target_days - Frequency pattern ('every_day', 'weekdays', or comma-separated days)
 * @property {string} start_date - ISO date string for habit start date
 * @property {number} user_id - Associated user identifier
 * @property {number} current_streak - Current consecutive completion streak
 * @property {number} longest_streak - Longest achieved streak
 * @property {boolean} is_due_today - Whether the habit is due for completion today
 * @property {boolean} is_completed_today - Whether the habit has been completed today
 * @property {string} [completion_timestamp] - Optional timestamp of today's completion
 */

interface HabitFormProps {
  habit?: Habit | null;
  onSuccess: (habit: Habit) => void;
  onCancel: () => void;
}

/**
 * Props for the HabitForm component
 * @interface HabitFormProps
 * @property {Habit | null} [habit] - Existing habit data for editing, or null for new habit
 * @property {(habit: Habit) => void} onSuccess - Callback function called after successful save
 * @property {() => void} onCancel - Callback function for canceling the form
 */

export function HabitForm({ habit, onSuccess, onCancel }: HabitFormProps) {
  const [name, setName] = useState('');
  const [targetDays, setTargetDays] = useState('every_day');
  const [customDays, setCustomDays] = useState<string[]>([]);
  const [startDate, setStartDate] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { toast } = useToast();

  /**
   * Array of weekday objects for custom schedule selection
   * Each day contains an id and display label
   */
  const daysOfWeek = [
    { id: 'monday', label: 'Monday' },
    { id: 'tuesday', label: 'Tuesday' },
    { id: 'wednesday', label: 'Wednesday' },
    { id: 'thursday', label: 'Thursday' },
    { id: 'friday', label: 'Friday' },
    { id: 'saturday', label: 'Saturday' },
    { id: 'sunday', label: 'Sunday' },
  ];

  /**
   * Toggles a day in the custom schedule selection
   * @param {string} dayId - The ID of the day to toggle
   * @param {boolean} checked - Whether the day should be selected or unselected
   */
  const handleCustomDayToggle = (dayId: string, checked: boolean) => {
    if (checked) {
      setCustomDays([...customDays, dayId]);
    } else {
      setCustomDays(customDays.filter(day => day !== dayId));
    }
  };

  useEffect(() => {
    if (habit) {
      setName(habit.name);
      setTargetDays(habit.target_days);
      setStartDate(habit.start_date);
      // If custom days, parse them (for now just reset)
      if (habit.target_days === 'custom') {
        setCustomDays([]);
      }
    } else {
      // Set default start date to today in local timezone
      setStartDate(getTodayLocalDate());
    }
  }, [habit]);

  /**
   * Handles form submission for creating or updating a habit
   * Includes validation, API interaction, and error handling
   * @param {React.FormEvent} e - Form submission event
   */
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
          target_days: targetDays === 'custom' ? customDays.join(',') : targetDays,
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

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-lg mx-auto max-h-[90vh] overflow-y-auto">
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

          <div className="space-y-4">
            <Label>Target Days</Label>
            <RadioGroup
              value={targetDays}
              onValueChange={setTargetDays}
              disabled={isLoading}
              className="space-y-3"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="every_day" id="every_day" />
                <Label htmlFor="every_day">Every Day</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="weekdays" id="weekdays" />
                <Label htmlFor="weekdays">Weekdays (Mon-Fri)</Label>
              </div>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="custom" id="custom" />
                  <Label htmlFor="custom">Custom Schedule</Label>
                </div>
                
                {targetDays === 'custom' && (
                  <div className="ml-6 space-y-2">
                    <p className="text-sm text-muted-foreground">Select the days of the week:</p>
                    <div className="grid grid-cols-2 gap-2">
                      {daysOfWeek.map((day) => (
                        <div key={day.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={day.id}
                            checked={customDays.includes(day.id)}
                            onCheckedChange={(checked) => 
                              handleCustomDayToggle(day.id, checked === true)
                            }
                            disabled={isLoading}
                          />
                          <Label htmlFor={day.id} className="text-sm">
                            {day.label}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="start-date">Start Date</Label>
            <Input
              id="start-date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              min={getMinDateForPicker()}
              required
              disabled={isLoading}
            />
            <p className="text-xs text-muted-foreground">
              Start date must be today or later (in your local timezone)
            </p>
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
    </div>
  );
}