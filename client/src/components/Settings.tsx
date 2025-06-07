import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Settings as SettingsIcon, Moon, Sun, Quote, Calendar } from 'lucide-react';
import { getCurrentUserId, getUserPreferences, updateUserPreference } from '@/lib/localStorage';

interface UserSettings {
  darkMode: boolean;
  motivationalQuotes: boolean;
  analyticsTimeRange: 'week' | 'month';
}

export function Settings() {
  const [settings, setSettings] = useState<UserSettings>({
    darkMode: false,
    motivationalQuotes: true,
    analyticsTimeRange: 'month'
  });
  const [userId, setUserId] = useState<number | null>(null);

  // Load settings from user-scoped localStorage on component mount
  useEffect(() => {
    const currentUserId = getCurrentUserId();
    if (currentUserId) {
      setUserId(currentUserId);
      const userSettings = getUserPreferences(currentUserId);
      setSettings({
        darkMode: userSettings.darkMode,
        motivationalQuotes: userSettings.motivationalQuotes,
        analyticsTimeRange: userSettings.analyticsTimeRange
      });
      
      // Apply dark mode if enabled
      if (userSettings.darkMode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  }, []);

  // Save settings to user-scoped localStorage whenever they change
  const updateSetting = <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => {
    if (!userId) return;
    
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    updateUserPreference(userId, key, value);
    
    // Apply dark mode immediately
    if (key === 'darkMode') {
      if (value) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <SettingsIcon className="w-5 h-5" />
            <span>Settings</span>
          </CardTitle>
          <CardDescription>
            Customize your HabitVault experience
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Appearance Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            {settings.darkMode ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            <span>Appearance</span>
          </CardTitle>
          <CardDescription>
            Customize the look and feel of the application
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="dark-mode">Dark Mode</Label>
              <p className="text-sm text-muted-foreground">
                Switch between light and dark themes
              </p>
            </div>
            <Switch
              id="dark-mode"
              checked={settings.darkMode}
              onCheckedChange={(checked) => updateSetting('darkMode', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Content Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Quote className="w-5 h-5" />
            <span>Content Preferences</span>
          </CardTitle>
          <CardDescription>
            Control what content is displayed in your dashboard
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="motivational-quotes">Motivational Quotes</Label>
              <p className="text-sm text-muted-foreground">
                Show daily motivational quotes on your dashboard
              </p>
            </div>
            <Switch
              id="motivational-quotes"
              checked={settings.motivationalQuotes}
              onCheckedChange={(checked) => updateSetting('motivationalQuotes', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Analytics View Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="w-5 h-5" />
            <span>Analytics Preferences</span>
          </CardTitle>
          <CardDescription>
            Configure how analytics data is displayed
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="heatmap-view">Default Heatmap View</Label>
              <p className="text-sm text-muted-foreground">
                Choose the default view for habit history heatmaps
              </p>
            </div>
            <Select
              value={settings.analyticsTimeRange}
              onValueChange={(value: 'week' | 'month') => updateSetting('analyticsTimeRange', value)}
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
        </CardContent>
      </Card>
    </div>
  );
}