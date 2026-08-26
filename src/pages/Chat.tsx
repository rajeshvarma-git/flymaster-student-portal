import React from 'react';
import ChatInterface from '@/components/ChatInterface';
import ErrorBoundary from '@/components/ErrorBoundary';

const Chat: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 py-8">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-primary-foreground bg-clip-text text-transparent">
            University Advisor AI
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Get personalized university recommendations and expert guidance for your study abroad journey
          </p>
        </div>
        
        <ErrorBoundary>
          <ChatInterface />
        </ErrorBoundary>
      </div>
    </div>
  );
};

export default Chat;