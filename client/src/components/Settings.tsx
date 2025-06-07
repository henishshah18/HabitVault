import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Settings as SettingsIcon, Moon, Sun, Quote, Calendar, Save, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getCurrentUserId, getUserPreferences, saveUserPreferences } from '@/lib/localStorage';

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
  const [originalSettings, setOriginalSettings] = useState<UserSettings>({
    darkMode: false,
    motivationalQuotes: true,
    analyticsTimeRange: 'month'
  });
  const [userId, setUserId] = useState<number | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  // Load settings from user-scoped localStorage on component mount
  useEffect(() => {
    const currentUserId = getCurrentUserId();
    if (currentUserId) {
      setUserId(currentUserId);
      const userSettings = getUserPreferences(currentUserId);
      const loadedSettings = {
        darkMode: userSettings.darkMode,
        motivationalQuotes: userSettings.motivationalQuotes,
        analyticsTimeRange: userSettings.analyticsTimeRange
      };
      setSettings(loadedSettings);
      setOriginalSettings(loadedSettings);
      
      // Apply dark mode if enabled
      if (userSettings.darkMode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  }, []);

  // Check for changes
  useEffect(() => {
    const changed = JSON.stringify(settings) !== JSON.stringify(originalSettings);
    setHasChanges(changed);
  }, [settings, originalSettings]);

  // Update settings locally (not saved until Save button is clicked)
  const updateSetting = <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    
    // Apply dark mode immediately for preview
    if (key === 'darkMode') {
      if (value) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  };

  // Save all settings to localStorage
  const saveSettings = async () => {
    if (!userId) return;
    
    setIsSaving(true);
    try {
      // Save all preferences at once
      saveUserPreferences(userId, settings);
      setOriginalSettings(settings);
      setHasChanges(false);
      
      // Dispatch custom event to notify other components
      window.dispatchEvent(new CustomEvent('userPreferenceChanged', {
        detail: { userId, settings }
      }));
      
      toast({
        title: "Settings Saved",
        description: "Your preferences have been saved successfully.",
      });
    } catch (error) {
      console.error('Failed to save settings:', error);
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Reset to original settings
  const resetSettings = () => {
    setSettings(originalSettings);
    
    // Revert dark mode
    if (originalSettings.darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
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

      {/* Save/Reset Actions */}
      {hasChanges && (
        <Card className="border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950/20">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-center sm:text-left">
                <p className="font-medium text-orange-800 dark:text-orange-200">
                  You have unsaved changes
                </p>
                <p className="text-sm text-orange-600 dark:text-orange-300">
                  Click Save to apply your new preferences
                </p>
              </div>
              <div className="flex space-x-3">
                <Button
                  variant="outline"
                  onClick={resetSettings}
                  disabled={isSaving}
                  className="border-orange-300 text-orange-700 hover:bg-orange-100 dark:border-orange-600 dark:text-orange-300"
                >
                  Reset
                </Button>
                <Button
                  onClick={saveSettings}
                  disabled={isSaving}
                  className="bg-orange-600 hover:bg-orange-700 text-white"
                >
                  {isSaving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Settings
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Success indicator when no changes */}
      {!hasChanges && originalSettings.darkMode !== undefined && (
        <Card className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-center space-x-2">
              <Check className="w-5 h-5 text-green-600 dark:text-green-400" />
              <p className="text-green-700 dark:text-green-300 font-medium">
                All settings saved
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}