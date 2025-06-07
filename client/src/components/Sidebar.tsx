import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar, 
  Target, 
  BarChart3, 
  Settings, 
  Menu, 
  X,
  LogOut 
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onLogout: () => void;
}

export function Sidebar({ activeTab, onTabChange, onLogout }: SidebarProps) {
  const [isMinimized, setIsMinimized] = useState(false);

  const navigationItems = [
    {
      id: 'daily-checkin',
      label: 'Daily Check-in',
      icon: Calendar,
      description: 'Today\'s habits'
    },
    {
      id: 'manage-habits',
      label: 'Manage Habits',
      icon: Target,
      description: 'Add, edit, delete habits'
    },
    {
      id: 'analytics',
      label: 'Analytics Dashboard',
      icon: BarChart3,
      description: 'Calendar & progress tracking'
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
      description: 'Dark mode & preferences'
    }
  ];

  return (
    <div className="h-full flex flex-col bg-card">
      {/* Sidebar Header - matches main header height */}
      <div className="h-16 px-4 border-b flex items-center justify-between">
        {!isMinimized && (
          <h2 className="font-semibold text-lg">Navigation</h2>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsMinimized(!isMinimized)}
          className="p-2"
        >
          {isMinimized ? <Menu className="w-4 h-4" /> : <X className="w-4 h-4" />}
        </Button>
      </div>

      {/* Navigation Items */}
      <div className="flex-1 p-2">
        <nav className="space-y-2">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            
            return (
              <Button
                key={item.id}
                variant={isActive ? 'default' : 'ghost'}
                onClick={() => onTabChange(item.id)}
                className={`w-full justify-start transition-all duration-200 ${
                  isMinimized ? 'px-2' : 'px-3'
                } ${isActive ? 'bg-primary text-primary-foreground' : ''}`}
                title={isMinimized ? item.label : undefined}
              >
                <Icon className={`w-4 h-4 ${isMinimized ? '' : 'mr-3'}`} />
                {!isMinimized && (
                  <div className="flex flex-col items-start">
                    <span className="text-sm font-medium">{item.label}</span>
                    {!isActive && (
                      <span className="text-xs text-muted-foreground">{item.description}</span>
                    )}
                  </div>
                )}

              </Button>
            );
          })}
        </nav>
      </div>

      {/* Logout Button */}
      <div className="p-2 border-t">
        <Button
          variant="outline"
          onClick={onLogout}
          className={`w-full justify-start ${isMinimized ? 'px-2' : 'px-3'}`}
          title={isMinimized ? 'Logout' : undefined}
        >
          <LogOut className={`w-4 h-4 ${isMinimized ? '' : 'mr-3'}`} />
          {!isMinimized && <span>Logout</span>}
        </Button>
      </div>
    </div>
  );
}