import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Quote } from 'lucide-react';
import { getCurrentUserId, getUserPreferences } from '@/lib/localStorage';

const motivationalQuotes = [
  "The secret of getting ahead is getting started. - Mark Twain",
  "It does not matter how slowly you go as long as you do not stop. - Confucius",
  "Small daily improvements over time lead to stunning results. - Robin Sharma",
  "Success is the sum of small efforts repeated day in and day out. - Robert Collier",
  "Excellence is not a skill, it's an attitude. - Ralph Marston",
  "The only impossible journey is the one you never begin. - Tony Robbins",
  "A year from now you may wish you had started today. - Karen Lamb",
  "Progress, not perfection. - Unknown",
  "The best time to plant a tree was 20 years ago. The second best time is now. - Chinese Proverb",
  "Don't watch the clock; do what it does. Keep going. - Sam Levenson",
  "Your limitation—it's only your imagination.",
  "Great things never come from comfort zones.",
  "Dream it. Wish it. Do it.",
  "Success doesn't just find you. You have to go out and get it.",
  "The harder you work for something, the greater you'll feel when you achieve it.",
  "Dream bigger. Do bigger.",
  "Don't stop when you're tired. Stop when you're done.",
  "Wake up with determination. Go to bed with satisfaction.",
  "Do something today that your future self will thank you for.",
  "Little things make big days.",
  "It's going to be hard, but hard does not mean impossible.",
  "Don't wait for opportunity. Create it.",
  "Sometimes we're tested not to show our weaknesses, but to discover our strengths.",
  "The key to success is to focus on goals, not obstacles.",
  "Dream it. Believe it. Build it.",
  "What seems impossible today will one day become your warm-up.",
  "Turn your wounds into wisdom.",
  "The comeback is always stronger than the setback.",
  "Every expert was once a beginner.",
  "Consistency is the mother of mastery.",
  "Discipline is choosing between what you want now and what you want most.",
  "You don't have to be great to get started, but you have to get started to be great.",
  "Habits are the compound interest of self-improvement.",
  "The pain of discipline weighs ounces, but the pain of regret weighs tons.",
  "Champions keep playing until they get it right.",
  "Success is walking from failure to failure with no loss of enthusiasm.",
  "It always seems impossible until it's done. - Nelson Mandela",
  "The future depends on what you do today. - Mahatma Gandhi",
  "Believe you can and you're halfway there. - Theodore Roosevelt",
  "Quality is not an act, it is a habit. - Aristotle"
];

export function MotivationalQuote() {
  const [currentQuote, setCurrentQuote] = useState('');
  const [showQuotes, setShowQuotes] = useState(true);

  useEffect(() => {
    const loadPreferences = () => {
      // Check user-scoped settings for motivational quotes preference
      const userId = getCurrentUserId();
      if (userId) {
        const userPreferences = getUserPreferences(userId);
        setShowQuotes(userPreferences.motivationalQuotes !== false);
      }
    };

    const handlePreferenceChange = (event: CustomEvent) => {
      if (event.detail.key === 'motivationalQuotes') {
        setShowQuotes(event.detail.value !== false);
      }
    };

    // Initial load
    loadPreferences();

    // Get a consistent quote for the day based on the date
    const today = new Date();
    const dateString = today.toISOString().split('T')[0]; // YYYY-MM-DD format
    
    // Create a simple hash from the date string for consistent daily rotation
    let hash = 0;
    for (let i = 0; i < dateString.length; i++) {
      const char = dateString.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    
    const quoteIndex = Math.abs(hash) % motivationalQuotes.length;
    setCurrentQuote(motivationalQuotes[quoteIndex]);

    // Listen for preference changes
    window.addEventListener('userPreferenceChanged', handlePreferenceChange as EventListener);

    return () => {
      window.removeEventListener('userPreferenceChanged', handlePreferenceChange as EventListener);
    };
  }, []);

  if (!showQuotes) {
    return null;
  }

  return (
    <Card className="border-none bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20">
      <CardContent className="p-6">
        <div className="flex items-center justify-center space-x-3">
          <Quote className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
          <p className="text-center text-lg font-medium italic text-blue-800 dark:text-blue-200">
            {currentQuote}
          </p>
          <Quote className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 transform rotate-180" />
        </div>
      </CardContent>
    </Card>
  );
}