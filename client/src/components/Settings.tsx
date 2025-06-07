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
      
      // Don't show automatic toast - only show "Saved" state
    } catch (error) {
      console.error('Failed to save settings:', error);
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setTimeout(() => setIsSaving(false), 1000); // Keep "Saved" state for 1 second
    }
  };

  return (
    <div className="space-y-6">

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



      {/* Save Button - Always visible */}
      <div className="flex justify-end">
        <Button
          onClick={saveSettings}
          disabled={!hasChanges || isSaving}
          variant={hasChanges ? "default" : "secondary"}
          className={hasChanges ? "bg-blue-600 hover:bg-blue-700" : ""}
        >
          {isSaving ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              Saved
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
  );
}