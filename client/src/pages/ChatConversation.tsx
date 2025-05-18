import { useState, useEffect, useRef } from 'react';
import { useParams, useLocation } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { ArrowLeft, SendHorizontal } from 'lucide-react';
import { format } from 'date-fns';
import { MessageSuggestions } from '@/components/MessageSuggestions';
import { useToast } from '@/hooks/use-toast';

interface Message {
  id: number;
  matchId: number;
  senderId: number;
  receiverId: number;
  content: string;
  read: boolean;
  createdAt: string;
}

interface User {
  id: number;
  username: string;
  name: string;
  age: number;
  image: string;
}

interface Match {
  id: number;
  user1Id: number;
  user2Id: number;
  createdAt: string;
}

const ChatConversation = () => {
  const [inputValue, setInputValue] = useState('');
  const { matchId } = useParams();
  const [, setLocation] = useLocation();
  const matchIdNum = Number(matchId);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Current user (hardcoded for demo, should come from auth context)
  const currentUserId = 1;

  // Fetch match details to get the other user
  const { data: matchData } = useQuery<{match: Match, user: User}>({
    queryKey: [`/api/matches/${matchIdNum}`],
    enabled: !isNaN(matchIdNum)
  });

  // Fetch messages for this match
  const { data: messages = [] } = useQuery<Message[]>({
    queryKey: [`/api/matches/${matchIdNum}/messages`],
    enabled: !isNaN(matchIdNum),
    refetchInterval: 5000 // Poll for new messages
  });

  // Send a message mutation
  const messageMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!matchData) throw new Error('Match data not available');
      const messageData = {
        matchId: matchIdNum,
        senderId: currentUserId,
        receiverId: matchData.user.id,
        content
      };
      const res = await apiRequest('POST', '/api/messages', messageData);
      return res.json();
    },
    onSuccess: () => {
      // Clear input and refetch messages
      setInputValue('');
      queryClient.invalidateQueries({ queryKey: [`/api/matches/${matchIdNum}/messages`] });
      queryClient.invalidateQueries({ queryKey: [`/api/users/${currentUserId}/unread`] });
    }
  });

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      messageMutation.mutate(inputValue);
      setShowSuggestions(false);
    }
  };

  // Handle clicking a suggested message
  const handleSelectSuggestion = (message: string) => {
    setInputValue(message);
  };

  // Group messages by date
  const messagesByDate: Record<string, Message[]> = {};
  messages.forEach(message => {
    const date = new Date(message.createdAt).toLocaleDateString();
    if (!messagesByDate[date]) {
      messagesByDate[date] = [];
    }
    messagesByDate[date].push(message);
  });

  if (!matchData) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary rounded-full border-t-transparent"></div>
      </div>
    );
  }

  const otherUser = matchData.user;

  return (
    <div className="h-full flex flex-col">
      {/* Chat header */}
      <div className="bg-white shadow-sm z-10 px-4 py-3 flex items-center">
        <Button variant="ghost" size="icon" onClick={() => setLocation('/messages')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex items-center ml-2">
          <Avatar className="h-10 w-10">
            <AvatarImage src={otherUser.image} alt={otherUser.name} />
            <AvatarFallback>{otherUser.name.substring(0, 2)}</AvatarFallback>
          </Avatar>
          <div className="ml-3">
            <h3 className="font-medium">{otherUser.name}, {otherUser.age}</h3>
          </div>
        </div>
      </div>

      {/* Chat messages */}
      <div className="flex-1 p-4 overflow-y-auto bg-slate-50">
        {Object.entries(messagesByDate).map(([date, dateMessages]) => (
          <div key={date} className="mb-6">
            <div className="text-center mb-4">
              <span className="bg-slate-200 text-slate-600 text-xs px-2 py-1 rounded-full">
                {date === new Date().toLocaleDateString() ? 'Today' : date}
              </span>
            </div>
            
            {dateMessages.map(message => (
              <div 
                key={message.id} 
                className={`flex mb-3 ${message.senderId === currentUserId ? 'justify-end' : 'justify-start'}`}
              >
                {message.senderId !== currentUserId && (
                  <Avatar className="h-8 w-8 mr-2 mt-1">
                    <AvatarImage src={otherUser.image} alt={otherUser.name} />
                    <AvatarFallback>{otherUser.name.substring(0, 2)}</AvatarFallback>
                  </Avatar>
                )}
                <div className="max-w-[75%]">
                  <div 
                    className={`px-4 py-2 rounded-2xl break-words ${
                      message.senderId === currentUserId 
                        ? 'bg-primary text-white' 
                        : 'bg-white'
                    }`}
                  >
                    {message.content}
                  </div>
                  <div className="text-xs text-gray-400 mt-1 px-2">
                    {format(new Date(message.createdAt), 'h:mm a')}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Message suggestions */}
      {showSuggestions && (
        <MessageSuggestions 
          recipientName={otherUser.name}
          onSelectSuggestion={handleSelectSuggestion}
        />
      )}

      {/* Chat input */}
      <form onSubmit={handleSubmit} className="p-3 bg-white border-t">
        <div className="flex items-center">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mr-2"
            onClick={() => setShowSuggestions(prev => !prev)}
          >
            {showSuggestions ? 'Hide Ideas' : 'Get Ideas'}
          </Button>
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Type a message..."
            className="flex-1"
          />
          <Button 
            type="submit" 
            size="icon" 
            className="ml-2" 
            disabled={!inputValue.trim() || messageMutation.isPending}
          >
            <SendHorizontal className="h-5 w-5" />
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ChatConversation;