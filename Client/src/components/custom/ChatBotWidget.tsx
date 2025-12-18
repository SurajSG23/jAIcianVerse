import React, { useState, useRef, useEffect } from 'react';

// Message type definition
interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

// Component props (can be extended for customization)
interface ChatWidgetProps {
  accentColor?: string;
  bgColor?: string;
}
  
export default function ChatBotWidget({ 
  accentColor = '#ff7a18', 
  bgColor = '#0f0f0f' 
}: ChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Hi! I\'m your AI assistant. How can I help you today?',
      sender: 'bot',
      timestamp: new Date(),
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  /**
   * WIRE YOUR RAG BACKEND HERE
   * Replace this mock function with your actual API call
   */
  const sendMessageToRAG = async (userMessage: string): Promise<string> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));
    // Mock responses
    const responses = [
      'That\'s a great question! Let me help you with that.',
      'I understand what you\'re looking for. Here\'s what I found...',
      'Based on the information I have, I can suggest...',
      'Let me break that down for you in a clear way.',
      'I\'m here to help! Could you provide a bit more context?',
    ];
    
    return responses[Math.floor(Math.random() * responses.length)];
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputValue,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    try {
      const botResponse = await sendMessageToRAG(inputValue);
      
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: botResponse,
        sender: 'bot',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: 'Sorry, I encountered an error. Please try again.',
        sender: 'bot',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleNewChat = () => {
    setMessages([
      {
        id: Date.now().toString(),
        text: 'Hi! I\'m your AI assistant. How can I help you today?',
        sender: 'bot',
        timestamp: new Date(),
      }
    ]);
  };

  const handleClearChat = () => {
    if (window.confirm('Are you sure you want to clear all messages?')) {
      handleNewChat();
    }
  };

  return (
    <div 
      className="fixed bottom-0 right-0 z-50 font-sans"
      style={{ 
        '--accent': accentColor,
        '--bg': bgColor,
      } as React.CSSProperties}
    >
      {/* Chat Window */}
      <div
        className={`
          fixed bottom-24 right-6 w-96 h-[600px] 
          bg-neutral-900 rounded-2xl shadow-2xl
          flex flex-col overflow-hidden
          transition-all duration-300 ease-in-out
          ${isOpen 
            ? 'opacity-100 translate-y-0 pointer-events-auto' 
            : 'opacity-0 translate-y-8 pointer-events-none'
          }
        `}
        style={{ 
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 122, 24, 0.1)' 
        }}
      >
        {/* Header */}
        <div 
          className="flex items-center justify-between px-5 py-4 bg-black border-b"
          style={{ borderBottomColor: accentColor }}
        >
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ 
                background: `linear-gradient(135deg, ${accentColor} 0%, #ff5500 100%)` 
              }}
            >
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </div>
            <h2 className="text-white font-semibold text-lg">Preksha's Assistant</h2>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={handleNewChat}
              className="p-2 rounded-lg hover:bg-neutral-800 transition-colors group"
              aria-label="New chat"
              title="New chat"
            >
              <svg className="w-4 h-4 text-neutral-400 group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
            
            <button
              onClick={handleClearChat}
              className="p-2 rounded-lg hover:bg-neutral-800 transition-colors group"
              aria-label="Clear chat"
              title="Clear chat"
            >
              <svg className="w-4 h-4 text-neutral-400 group-hover:text-red-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
            
            <button
              onClick={() => setIsOpen(false)}
              className="p-2 rounded-lg hover:bg-neutral-800 transition-colors group ml-1"
              aria-label="Close chat"
            >
              <svg className="w-4 h-4 text-neutral-400 group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Messages Container */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 bg-neutral-900">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`
                  max-w-[80%] px-4 py-3 rounded-2xl
                  ${message.sender === 'user'
                    ? 'rounded-br-sm text-white shadow-lg'
                    : 'rounded-bl-sm bg-neutral-800 text-neutral-100 shadow-md'
                  }
                `}
                style={message.sender === 'user' ? { 
                  background: `linear-gradient(135deg, ${accentColor} 0%, #ff5500 100%)` 
                } : {}}
              >
                <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                  {message.text}
                </p>
              </div>
            </div>
          ))}
          
          {isTyping && (
            <div className="flex justify-start">
              <div className="max-w-[80%] px-4 py-3 rounded-2xl rounded-bl-sm bg-neutral-800 shadow-md">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-neutral-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-neutral-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-neutral-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-black border-t border-neutral-800">
          <div className="flex items-center gap-2 bg-neutral-900 rounded-xl p-2 border border-neutral-800 focus-within:border-opacity-50"
            style={{ 
              borderColor: 'rgba(255, 122, 24, 0.2)',
            }}
          >
            <button
              className="p-2 text-neutral-400 hover:text-white transition-colors rounded-lg hover:bg-neutral-800"
              aria-label="Voice input"
              title="Voice input (coming soon)"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            </button>
            
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              className="flex-1 bg-transparent text-white placeholder-neutral-500 outline-none text-sm px-2"
              aria-label="Message input"
            />
            
            <button
              onClick={handleSendMessage}
              disabled={!inputValue.trim()}
              className="p-2 rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:scale-105 active:scale-95"
              style={{ 
                background: inputValue.trim() 
                  ? `linear-gradient(135deg, ${accentColor} 0%, #ff5500 100%)` 
                  : '#374151',
                boxShadow: inputValue.trim() 
                  ? `0 4px 12px rgba(255, 122, 24, 0.3)` 
                  : 'none'
              }}
              aria-label="Send message"
            >
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Floating Chat Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 w-16 h-16 rounded-full shadow-2xl hover:scale-110 transition-transform duration-200 active:scale-95 focus:outline-none focus:ring-4"
        style={{ 
          background: `linear-gradient(135deg, ${accentColor} 0%, #ff5500 100%)`,
          boxShadow: `0 8px 24px rgba(255, 122, 24, 0.4), 0 4px 12px rgba(0, 0, 0, 0.3)`,
        }}
        aria-label={isOpen ? 'Close chat' : 'Open chat'}
        aria-expanded={isOpen}
      >
        <div className="relative w-full h-full flex items-center justify-center">
          <svg 
            className={`w-7 h-7 text-white transition-all duration-300 ${isOpen ? 'rotate-90 opacity-0 absolute' : 'rotate-0 opacity-100'}`} 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
          <svg 
            className={`w-7 h-7 text-white transition-all duration-300 ${isOpen ? 'rotate-0 opacity-100' : '-rotate-90 opacity-0 absolute'}`} 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>
    </div>
  );
}