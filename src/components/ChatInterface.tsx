import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { useChat } from '@/hooks/useChat';
import EnhancedMessageBubble from '@/components/chat/EnhancedMessageBubble';
import EnhancedTypingIndicator from '@/components/chat/EnhancedTypingIndicator';
import UniversityResults from '@/components/chat/UniversityResults';
import ExpertHelpSection from '@/components/chat/ExpertHelpSection';
import ChatInput from '@/components/chat/ChatInput';

const ChatInterface: React.FC = () => {
  const {
    messages,
    isLoading,
    otpMode,
    phoneNumber,
    universities,
    showResults,
    showExpertHelp,
    chatComplete,
    messagesEndRef,
    sendMessage,
  } = useChat();

  return (
    <div 
      className="max-w-4xl mx-auto p-2 sm:p-4 h-[600px] sm:h-[700px] flex flex-col animate-scale-in"
      role="main"
    >
      <Card className="flex-1 flex flex-col shadow-hover backdrop-blur-sm border-border/50">
        <CardContent className="flex-1 flex flex-col p-0">
          <div 
            className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-1 bg-gradient-to-b from-background/50 to-background"
            role="log"
            aria-label="Chat conversation"
            aria-live="polite"
          >
            {messages.map((message, index) => (
              <EnhancedMessageBubble 
                key={message.id} 
                message={message}
                isLast={index === messages.length - 1}
              />
            ))}
            
            {isLoading && <EnhancedTypingIndicator />}

            {showResults && universities.length > 0 && (
              <div className="animate-scale-in">
                <UniversityResults universities={universities} />
              </div>
            )}

            {showExpertHelp && (
              <div className="animate-slide-in-left">
                <ExpertHelpSection />
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          <ChatInput 
            onSendMessage={sendMessage}
            isLoading={isLoading}
            otpMode={otpMode}
            phoneNumber={phoneNumber}
            disabled={chatComplete}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default ChatInterface;
