import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { Sidebar } from './Sidebar';
import { DailyCheckin } from './DailyCheckin';
import { ManageHabits } from './ManageHabits';
import { AnalyticsDashboard } from './AnalyticsDashboard';
import { Settings } from './Settings';
import { MotivationalQuote } from './MotivationalQuote';
import { User as UserIcon, Vault } from 'lucide-react';
import { getCurrentUserId, clearUserData, initializeUserPreferences } from '@/lib/localStorage';

interface User {
  id: number;
  email: string;
}

/**
 * Props for the Dashboard component
 */
interface DashboardProps {
  onLogout: () => void;
}

export function Dashboard({ onLogout }: DashboardProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('daily-checkin');
  const { toast } = useToast();

  useEffect(() => {
    const fetchUserData = async () => {
      const token = localStorage.getItem('authToken');
      
      if (!token) {
        onLogout();
        return;
      }

      // Initialize user preferences immediately
      const userId = getCurrentUserId();
      if (userId) {
        initializeUserPreferences(userId);
      }

      try {
        const response = await fetch('/api/protected', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();
          setUser(data.user);
        } else {
          if (response.status === 401) {
            localStorage.removeItem('authToken');
            localStorage.removeItem('userId');
            onLogout();
            return;
          }
          setError('Failed to load user data');
        }
      } catch (err) {
        setError('Network error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, [onLogout]);

  const handleLogout = () => {
    // Only remove auth tokens, NOT user preferences - they should persist
    localStorage.removeItem('authToken');
    localStorage.removeItem('userId');
    // Remove dark mode class on logout
    document.documentElement.classList.remove('dark');
    onLogout();
  };

  /**
   * Handles tab switching in the dashboard
   * @param {string} value - The identifier of the selected tab
   */
  const handleNewHabit = () => {
    setActiveTab('manage-habits');
  };

  const renderActiveContent = () => {
    switch (activeTab) {
      case 'daily-checkin':
        return <DailyCheckin onLogout={onLogout} onNewHabit={handleNewHabit} />;
      case 'manage-habits':
        return <ManageHabits onLogout={onLogout} />;
      case 'analytics':
        return <AnalyticsDashboard />;
      case 'settings':
        return <Settings />;
      default:
        return <DailyCheckin onLogout={onLogout} onNewHabit={handleNewHabit} />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen">
        <div className="flex-1 flex items-center justify-center">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">Loading...</div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <Sidebar 
        activeTab={activeTab} 
        onTabChange={setActiveTab} 
        onLogout={handleLogout} 
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex items-center justify-between h-16 px-6">
            {/* App Logo/Name */}
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <Vault className="w-8 h-8 text-primary" />
                <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                  HabitVault
                </h1>
              </div>
            </div>

            {/* User Info */}
            <div className="flex items-center space-x-3">
              {user && (
                <div className="flex items-center space-x-2">
                  <UserIcon className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground hidden sm:inline">
                    Welcome, {user.email.split('@')[0]}!
                  </span>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          <div className="h-full w-full px-4 sm:px-6 lg:px-8 py-6 space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Motivational Quote - Only show on Daily Check-in */}
            {activeTab === 'daily-checkin' && (
              <div className="flex justify-center">
                <div className="w-full max-w-2xl">
                  <MotivationalQuote />
                </div>
              </div>
            )}

            {/* Active Content */}
            {renderActiveContent()}
          </div>
        </main>
      </div>
    </div>
  );
}

/**
 * Handles the creation of a new habit
 * Updates the UI and syncs with the backend
 */

/**
 * Handles the editing of an existing habit
 * @param {Habit} habit - The habit to be edited
 */

/**
 * Handles the deletion of a habit
 * @param {number} habitId - The ID of the habit to be deleted
 */