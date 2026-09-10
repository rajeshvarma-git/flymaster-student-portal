import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Send } from 'lucide-react';
import { isValidIndiaMobile, normalizeIndiaPhoneInput } from '@/lib/whatsappApi';

interface ChatInputProps {
  onSendMessage: (message: string) => Promise<void>;
  isLoading: boolean;
  otpMode: boolean;
  phoneMode?: boolean;
  phoneNumber: string;
  disabled?: boolean;
  onResendOtp?: () => Promise<void>;
}

const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  isLoading,
  otpMode,
  phoneMode = false,
  phoneNumber,
  disabled = false,
  onResendOtp,
}) => {
  const [currentInput, setCurrentInput] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isLoading && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isLoading, otpMode, phoneMode]);

  const handleSend = async () => {
    if (!currentInput.trim() || isLoading || disabled) return;
    const message = currentInput.trim();
    setCurrentInput('');
    await onSendMessage(message);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (otpMode) {
      if (/^\d*$/.test(value) && value.length <= 6) setCurrentInput(value);
      return;
    }
    if (phoneMode) {
      setCurrentInput(normalizeIndiaPhoneInput(value));
      return;
    }
    setCurrentInput(value);
  };

  const placeholder = otpMode
    ? 'Enter 6-digit verification code...'
    : phoneMode
      ? '10-digit WhatsApp number'
      : 'Type your message...';

  const isValid = otpMode
    ? /^\d{6}$/.test(currentInput)
    : phoneMode
      ? isValidIndiaMobile(currentInput)
      : currentInput.trim().length > 0;

  return (
    <div className="border-t bg-background p-4">
      <div className="flex space-x-2 max-w-4xl mx-auto">
        {phoneMode && (
          <div className="flex items-center rounded-md border px-3 text-sm text-muted-foreground bg-muted/40">
            +91
          </div>
        )}
        <Input
          ref={inputRef}
          value={currentInput}
          onChange={handleInputChange}
          onKeyPress={handleKeyPress}
          placeholder={placeholder}
          disabled={isLoading || disabled}
          className="flex-1 focus-visible:ring-2 focus-visible:ring-primary"
          type={otpMode || phoneMode ? 'tel' : 'text'}
          inputMode={otpMode || phoneMode ? 'numeric' : undefined}
          maxLength={otpMode ? 6 : phoneMode ? 10 : undefined}
          pattern={otpMode ? '\\d{6}' : phoneMode ? '[6-9]\\d{9}' : undefined}
          aria-label={placeholder}
          autoComplete="off"
        />
        <Button
          onClick={() => void handleSend()}
          disabled={isLoading || !isValid || disabled}
          className="px-4"
          aria-label="Send message"
        >
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </div>

      {phoneMode && (
        <p className="text-xs text-muted-foreground mt-2 text-center max-w-4xl mx-auto">
          We’ll send a 6-digit verification code to this WhatsApp number.
        </p>
      )}

      {otpMode && (
        <div className="mt-2 text-center max-w-4xl mx-auto space-y-1">
          <p className="text-xs text-muted-foreground">
            Enter the 6-digit code sent to <span className="font-medium">{phoneNumber}</span>
          </p>
          {onResendOtp && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-auto px-2 py-1 text-xs"
              disabled={isLoading || disabled}
              onClick={() => void onResendOtp()}
            >
              Resend WhatsApp code
            </Button>
          )}
        </div>
      )}

      {!isLoading && !disabled && !otpMode && !phoneMode && (
        <p className="text-xs text-muted-foreground/60 mt-1 text-center">
          Press Enter to send • Shift + Enter for new line
        </p>
      )}

      {disabled && (
        <p className="text-xs text-muted-foreground mt-2 text-center">
          Chat complete. Contact our counselors below for next steps.
        </p>
      )}
    </div>
  );
};

export default ChatInput;
