import React from 'react';
import { Button } from '@/components/ui/button';
import { MessageCircle, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
const ChatButton: React.FC = () => {
  return <Link to="/chat">
      <Button size="lg" className="bg-gradient-to-r from-primary to-primary-foreground hover:from-primary/90 hover:to-primary-foreground/90 shadow-lg hover:shadow-xl transition-all duration-300 animate-fade-in group text-base text-gray-600">
        <div className="flex items-center space-x-2">
          <MessageCircle className="h-5 w-5 group-hover:scale-110 transition-transform" />
          <span className="font-semibold">Start AI Chat</span>
          <Sparkles className="h-4 w-4 group-hover:rotate-12 transition-transform" />
        </div>
      </Button>
    </Link>;
};
export default ChatButton;