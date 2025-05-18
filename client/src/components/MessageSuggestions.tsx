import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

// Dating intent options
type DatingIntent = 'long-term' | 'casual' | 'friendship' | 'one-night';

interface MessageSuggestionsProps {
  recipientName: string;
  onSelectSuggestion: (message: string) => void;
}

export function MessageSuggestions({ recipientName, onSelectSuggestion }: MessageSuggestionsProps) {
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<Record<DatingIntent, string[]>>({
    'long-term': [],
    'casual': [],
    'friendship': [],
    'one-night': []
  });
  const [currentIntent, setCurrentIntent] = useState<DatingIntent>('casual');

  // Generate message suggestions based on the selected dating intent
  const generateSuggestions = async () => {
    setLoading(true);
    
    try {
      // Call the backend API to get message suggestions
      const response = await fetch('/api/messages/suggestions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipientName,
          relationshipIntent: currentIntent
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch message suggestions');
      }
      
      const data = await response.json();
      
      // Create a suggestions object with the current intent's suggestions
      const newSuggestions = {
        ...suggestions,
        [currentIntent]: data.suggestions || []
      };
      
      setSuggestions(newSuggestions);
    } catch (error) {
      console.error('Failed to generate suggestions:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-4 mb-2">
      <Card>
        <CardContent className="p-4">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-sm font-medium">Message Suggestions</h3>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={generateSuggestions} 
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                  Generating...
                </>
              ) : 'Generate Ideas'}
            </Button>
          </div>
          
          <Tabs defaultValue="casual" value={currentIntent} onValueChange={(value) => setCurrentIntent(value as DatingIntent)}>
            <TabsList className="grid grid-cols-4 mb-2">
              <TabsTrigger value="casual">Casual</TabsTrigger>
              <TabsTrigger value="long-term">Long-term</TabsTrigger>
              <TabsTrigger value="friendship">Friendship</TabsTrigger>
              <TabsTrigger value="one-night">One-night</TabsTrigger>
            </TabsList>
            
            {Object.entries(suggestions).map(([intent, messages]) => (
              <TabsContent key={intent} value={intent} className="mt-0">
                {messages.length > 0 ? (
                  <div className="grid gap-2">
                    {messages.map((message, index) => (
                      <div 
                        key={index} 
                        className="text-sm p-2 border rounded-md cursor-pointer hover:bg-primary/5"
                        onClick={() => onSelectSuggestion(message)}
                      >
                        {message}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 text-sm text-muted-foreground">
                    {loading ? 'Generating suggestions...' : 'Click "Generate Ideas" to get message suggestions'}
                  </div>
                )}
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}