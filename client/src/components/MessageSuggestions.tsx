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
      // In a real implementation with an API key, this would call the backend API
      // For now, we'll use pre-defined suggestions based on intent
      const mockSuggestions: Record<DatingIntent, string[]> = {
        'long-term': [
          `Hi ${recipientName}, I noticed we share an interest in puzzles. What's your favorite type to solve?`,
          `Hello ${recipientName}! I'm looking for something meaningful. What are you hoping to find here?`,
          `${recipientName}, your profile really caught my attention. I'd love to get to know you better.`
        ],
        'casual': [
          `Hey ${recipientName}! How's your day going? Any fun plans for the weekend?`,
          `${recipientName}, your profile made me smile. What do you enjoy doing for fun?`,
          `Hi there ${recipientName}! No pressure, just wanted to say hello and see where things go.`
        ],
        'friendship': [
          `Hey ${recipientName}, I'm new in town and looking to make some friends. Would you be up for showing me around?`,
          `Hi ${recipientName}! I noticed we both enjoy similar activities. Would be great to hang out sometime!`,
          `${recipientName}, looking to expand my social circle. What kind of activities do you enjoy with friends?`
        ],
        'one-night': [
          `Hey ${recipientName}, I'm only in town for the night. Want to meet up for a drink?`,
          `${recipientName}, you're incredibly attractive. Any interest in meeting up tonight?`,
          `Direct and honest - I'm looking for something casual. If that's not your thing, no worries!`
        ]
      };
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setSuggestions(mockSuggestions);
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