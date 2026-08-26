import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getRecommendationsForProfile } from '@/lib/universityRecommendations';
import type { UniversityRecommendation } from '@/lib/universityRecommendations';

export type { UniversityRecommendation };

export interface ChatMessage {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
}

interface ChatState {
  messages: ChatMessage[];
  conversationData: Record<string, any>;
  sessionId: string;
  stepIndex: number;
  isLoading: boolean;
  otpMode: boolean;
  phoneNumber: string;
  universities: UniversityRecommendation[];
  showResults: boolean;
  showExpertHelp: boolean;
}

const FUNNEL_STEPS = [
  {
    key: 'country',
    question: "Hi there! 👋 I'm your AI study abroad advisor from Fly Masters. Which country would you love to study in?",
    reply: (value: string) =>
      `Great choice — ${value}! What is your highest qualification? (for example 12th, Bachelor's, or Master's)`,
  },
  {
    key: 'qualification',
    question: "What is your highest qualification?",
    reply: (value: string) =>
      `Got it, ${value}. Which field or program are you most interested in? (for example Computer Science, Business, or Nursing)`,
  },
  {
    key: 'streamOrProgram',
    question: 'Which field of study interests you?',
    reply: (value: string) =>
      `${value} is a strong path. What is your academic score — percentage or GPA?`,
  },
  {
    key: 'academicScore',
    question: 'What is your academic score?',
    reply: (value: string) =>
      `Thanks, ${value} noted. What is your estimated study budget? (for example 20 lakhs or $25,000)`,
  },
  {
    key: 'budget',
    question: 'What is your study budget?',
    reply: (value: string) =>
      `Budget noted: ${value}. What is your full name?`,
  },
  {
    key: 'fullName',
    question: 'What is your full name?',
    reply: (value: string) =>
      `Nice to meet you, ${value}! What email should we use for your university shortlist?`,
  },
  {
    key: 'email',
    question: 'What is your email address?',
    reply: (value: string) =>
      `Thanks. Last step — what is your phone number, including country code?`,
  },
  {
    key: 'phone',
    question: 'What is your phone number?',
    reply: () =>
      'Perfect — I have your profile. Let me find universities that match you.',
  },
] as const;

const INITIAL_STATE: ChatState = {
  messages: [],
  conversationData: {},
  sessionId: '',
  stepIndex: 0,
  isLoading: false,
  otpMode: false,
  phoneNumber: '',
  universities: [],
  showResults: false,
  showExpertHelp: false,
};

let cachedSessionId: string | null = null;

export const useChat = () => {
  const [state, setState] = useState<ChatState>(INITIAL_STATE);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const sessionIdRef = useRef('');
  const stepIndexRef = useRef(0);
  const dataRef = useRef<Record<string, any>>({});

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [state.messages, state.isLoading]);

  const addMessage = useCallback((message: Omit<ChatMessage, 'id' | 'timestamp'>) => {
    const newMessage: ChatMessage = {
      ...message,
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      timestamp: new Date(),
    };
    setState((prev) => ({ ...prev, messages: [...prev.messages, newMessage] }));
  }, []);

  const persistInBackground = useCallback(async (message: string, conversationData: Record<string, any>) => {
    const sessionId = sessionIdRef.current;
    if (!sessionId) return;

    try {
      await supabase.functions.invoke('chat-ai', {
        body: { message, sessionId, conversationData },
      });
    } catch (error) {
      console.warn('Chat persist skipped:', error);
    }
  }, []);

  const fetchUniversities = useCallback(async (conversationData: Record<string, any>) => {
    try {
      const universities = await getRecommendationsForProfile(conversationData);
      setState((prev) => ({
        ...prev,
        universities,
        showResults: true,
        showExpertHelp: true,
        isLoading: false,
      }));
      addMessage({
        type: 'ai',
        content: `🎓 Here are universities in ${conversationData.country} that match your profile. A counselor can help you apply.`,
      });
    } catch (error) {
      console.error('Error fetching universities:', error);
      setState((prev) => ({ ...prev, showExpertHelp: true, isLoading: false }));
      addMessage({
        type: 'ai',
        content: 'Your profile is ready. Our counselors can now shortlist universities in your chosen country.',
      });
    }
  }, [addMessage]);

  const initializeChat = useCallback(async () => {
    if (!cachedSessionId) {
      cachedSessionId = crypto.randomUUID();
    }

    const sessionUuid = cachedSessionId;
    sessionIdRef.current = sessionUuid;
    stepIndexRef.current = 0;
    dataRef.current = {};

    try {
      const textSessionId = `chat_${sessionUuid.slice(0, 8)}`;
      await supabase.from('chat_sessions').insert({
        id: sessionUuid,
        session_id: textSessionId,
        current_stage: 1,
        conversation_data: {},
        user_id: null,
      });
    } catch (error) {
      console.warn('Chat session insert skipped:', error);
    }

    setState((prev) => {
      if (prev.messages.length > 0) {
        return { ...prev, sessionId: sessionUuid, stepIndex: 0 };
      }
      return {
        ...prev,
        sessionId: sessionUuid,
        stepIndex: 0,
        messages: [{
          id: 'welcome',
          type: 'ai',
          content: FUNNEL_STEPS[0].question,
          timestamp: new Date(),
        }],
      };
    });
  }, []);

  const sendMessage = useCallback(async (message: string) => {
    const trimmed = message.trim();
    if (!trimmed || state.isLoading) return;

    addMessage({ type: 'user', content: trimmed });
    setState((prev) => ({ ...prev, isLoading: true }));

    const step = FUNNEL_STEPS[stepIndexRef.current] ?? FUNNEL_STEPS[0];
    const nextData = {
      ...dataRef.current,
      [step.key]: trimmed,
    };

    if (step.key === 'phone') {
      nextData.phone = trimmed;
    }

    dataRef.current = nextData;
    const nextStepIndex = Math.min(stepIndexRef.current + 1, FUNNEL_STEPS.length);
    stepIndexRef.current = nextStepIndex;

    setState((prev) => ({
      ...prev,
      conversationData: nextData,
      stepIndex: nextStepIndex,
      phoneNumber: step.key === 'phone' ? trimmed : prev.phoneNumber,
    }));

    persistInBackground(trimmed, nextData);

    await new Promise((resolve) => setTimeout(resolve, 450));

    if (nextStepIndex >= FUNNEL_STEPS.length) {
      addMessage({
        type: 'ai',
        content: step.reply(trimmed),
      });
      await fetchUniversities(nextData);
      return;
    }

    addMessage({
      type: 'ai',
      content: step.reply(trimmed),
    });
    setState((prev) => ({ ...prev, isLoading: false }));
  }, [state.isLoading, addMessage, persistInBackground, fetchUniversities]);

  return {
    ...state,
    messagesEndRef,
    initializeChat,
    sendMessage,
  };
};
