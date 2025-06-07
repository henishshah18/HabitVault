import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Settings as SettingsIcon, Moon, Sun, Quote, Calendar } from 'lucide-react';

interface UserSettings {
  darkMode: boolean;
  motivationalQuotes: boolean;
  heatmapView: 'weekly' | 'monthly';
}

export function Settings() {
  const [settings, setSettings] = useState<UserSettings>({
    darkMode: false,
    motivationalQuotes: true,
    heatmapView: 'monthly'
  });

  // Load settings from localStorage on component mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('habitvault-settings');
    if (savedSettings) {
      const parsed = JSON.parse(savedSettings);
      setSettings(parsed);
      
      // Apply dark mode if enabled
      if (parsed.darkMode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  }, []);

  // Save settings to localStorage whenever they change
  const updateSetting = <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    localStorage.setItem('habitvault-settings', JSON.stringify(newSettings));
    
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
              value={settings.heatmapView}
              onValueChange={(value: 'weekly' | 'monthly') => updateSetting('heatmapView', value)}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}