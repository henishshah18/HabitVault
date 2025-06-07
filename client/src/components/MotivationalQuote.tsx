import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Quote } from 'lucide-react';

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
  "Don't watch the clock; do what it does. Keep going. - Sam Levenson"
];

export function MotivationalQuote() {
  const [currentQuote, setCurrentQuote] = useState('');

  useEffect(() => {
    // Get a consistent quote for the day based on the date
    const today = new Date();
    const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000);
    const quoteIndex = dayOfYear % motivationalQuotes.length;
    setCurrentQuote(motivationalQuotes[quoteIndex]);
  }, []);

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