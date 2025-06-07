import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar, 
  Target, 
  BarChart3, 
  Zap, 
  Eye, 
  Heart,
  TrendingUp,
  Shield,
  Vault,
  CheckCircle2,
  ArrowRight,
  Flame
} from 'lucide-react';

interface LandingPageProps {
  onGetStarted: () => void;
}

export function LandingPage({ onGetStarted }: LandingPageProps) {
  const [hoveredFeature, setHoveredFeature] = useState<number | null>(null);

  const features = [
    {
      icon: Eye,
      title: "Visual Clarity",
      description: "Track your progress with intuitive heatmaps and streak visualizations that make your consistency visible.",
      color: "text-blue-600 dark:text-blue-400"
    },
    {
      icon: Heart,
      title: "Emotional Rewards",
      description: "Celebrate milestones with progressive achievements and motivational quotes that keep you inspired.",
      color: "text-red-600 dark:text-red-400"
    },
    {
      icon: Zap,
      title: "Minimalist Focus",
      description: "No distractions. Just you, your habits, and the tools you need to build lasting consistency.",
      color: "text-yellow-600 dark:text-yellow-400"
    },
    {
      icon: TrendingUp,
      title: "Progress Analytics",
      description: "Understand your patterns with comprehensive analytics that reveal insights about your habit journey.",
      color: "text-green-600 dark:text-green-400"
    }
  ];

  const stats = [
    { label: "Daily Streaks", value: "Track unlimited habits" },
    { label: "Visual Heatmaps", value: "See your consistency" },
    { label: "Milestone Rewards", value: "Celebrate achievements" },
    { label: "Progress Analytics", value: "Understand patterns" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center max-w-4xl mx-auto">
          {/* Logo */}
          <div className="flex items-center justify-center mb-6">
            <div className="bg-primary rounded-xl p-3 mr-3">
              <Vault className="w-8 h-8 text-primary-foreground" />
            </div>
            <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              HabitVault
            </h1>
          </div>

          {/* Tagline */}
          <p className="text-xl md:text-2xl text-muted-foreground mb-4">
            Daily Habit Tracker with Visual Streaks
          </p>

          {/* Main Philosophy */}
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-8 mb-8 border border-gray-200 dark:border-gray-700">
            <blockquote className="text-2xl md:text-3xl font-medium text-gray-800 dark:text-gray-200 mb-4">
              "Consistency beats intensity"
            </blockquote>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Most habit apps are bloated or distracting. HabitVault is minimalist, focused, and built for tracking progress with visual clarity and emotional rewards.
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex justify-center mb-12">
            <Button 
              size="lg" 
              onClick={onGetStarted}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 text-lg"
            >
              Start Building Habits
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                  <p className="font-semibold text-lg text-gray-800 dark:text-gray-200">{stat.value}</p>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Features Section */}
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Built for <span className="text-primary">Consistency</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Every feature is designed to help you build lasting habits through visual feedback and emotional connection.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card 
                  key={index}
                  className={`transition-all duration-300 cursor-pointer ${
                    hoveredFeature === index 
                      ? 'transform -translate-y-2 shadow-xl border-primary' 
                      : 'hover:shadow-lg'
                  }`}
                  onMouseEnter={() => setHoveredFeature(index)}
                  onMouseLeave={() => setHoveredFeature(null)}
                >
                  <CardHeader className="text-center">
                    <div className="mx-auto mb-4 p-3 rounded-full bg-gray-100 dark:bg-gray-800 w-fit">
                      <Icon className={`w-8 h-8 ${feature.color}`} />
                    </div>
                    <CardTitle className="text-xl">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-center text-base">
                      {feature.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* How It Works */}
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-12">
              Simple. Focused. <span className="text-primary">Effective.</span>
            </h2>
            
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="bg-primary/10 rounded-full p-6 w-24 h-24 mx-auto mb-6 flex items-center justify-center">
                  <Target className="w-12 h-12 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-3">1. Set Your Habits</h3>
                <p className="text-muted-foreground">
                  Add the habits you want to build. Keep it simple, focus on what matters most.
                </p>
              </div>

              <div className="text-center">
                <div className="bg-primary/10 rounded-full p-6 w-24 h-24 mx-auto mb-6 flex items-center justify-center">
                  <CheckCircle2 className="w-12 h-12 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-3">2. Track Daily</h3>
                <p className="text-muted-foreground">
                  Check in each day. Watch your streaks grow and see your consistency visualized.
                </p>
              </div>

              <div className="text-center">
                <div className="bg-primary/10 rounded-full p-6 w-24 h-24 mx-auto mb-6 flex items-center justify-center">
                  <Flame className="w-12 h-12 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-3">3. Build Momentum</h3>
                <p className="text-muted-foreground">
                  Celebrate milestones, understand patterns, and build unstoppable momentum.
                </p>
              </div>
            </div>
          </div>

          {/* Philosophy Section */}
          <div className="bg-gradient-to-r from-primary/10 to-purple-600/10 rounded-3xl p-8 md:p-12 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Why <span className="text-primary">HabitVault</span>?
            </h2>
            <div className="max-w-3xl mx-auto space-y-6 text-lg text-muted-foreground">
              <p>
                Most habit trackers overwhelm you with features you don't need. We believe in the power of simplicity.
              </p>
              <p>
                <strong className="text-foreground">Visual clarity</strong> shows you exactly where you stand. 
                <strong className="text-foreground"> Emotional rewards</strong> keep you motivated. 
                <strong className="text-foreground"> Focused design</strong> eliminates distractions.
              </p>
              <p className="text-xl font-medium text-foreground">
                Because consistency isn't about perfection—it's about showing up, day after day.
              </p>
            </div>
            
            <Button 
              size="lg" 
              onClick={onGetStarted}
              className="mt-8 bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-4 text-lg"
            >
              Start Your Journey
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}