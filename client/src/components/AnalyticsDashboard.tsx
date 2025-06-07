import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, Calendar, TrendingUp } from 'lucide-react';

export function AnalyticsDashboard() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BarChart3 className="w-5 h-5" />
            <span>Analytics Dashboard</span>
          </CardTitle>
          <CardDescription>
            Track your habit progress and insights over time
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="w-5 h-5" />
              <span>Habit Calendar</span>
            </CardTitle>
            <CardDescription>
              Visual heatmap of your habit completion
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-semibold mb-2">Calendar View Coming Soon</h3>
              <p>Interactive calendar showing your habit completion patterns</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5" />
              <span>Progress Trends</span>
            </CardTitle>
            <CardDescription>
              Charts and insights about your progress
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              <TrendingUp className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-semibold mb-2">Progress Charts Coming Soon</h3>
              <p>Detailed analytics and trend visualization</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Habit Statistics</CardTitle>
          <CardDescription>
            Overview of your habit tracking performance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <h3 className="text-lg font-semibold mb-2">Statistics Coming Soon</h3>
            <p>Comprehensive statistics about your habit completion rates, streaks, and more</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}