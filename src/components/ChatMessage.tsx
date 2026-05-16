import { User, Activity } from 'lucide-react';
import { format } from 'date-fns';

interface ChatMessageProps {
  message: {
    id: string; // ✨ Added this line to fix the TypeScript error
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
  };
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
          isUser ? 'bg-emerald-600' : 'bg-emerald-100'
        }`}
      >
        {isUser ? (
          <User className="w-4 h-4 text-white" />
        ) : (
          <Activity className="w-4 h-4 text-emerald-600" />
        )}
      </div>

      <div className={`flex-1 ${isUser ? 'flex flex-col items-end' : ''}`}>
        <div
          className={`rounded-2xl px-4 py-3 max-w-[80%] ${
            isUser
              ? 'bg-emerald-600 text-white rounded-tr-sm'
              : 'bg-gray-100 text-gray-900 rounded-tl-sm'
          }`}
        >
          <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
        </div>
        <span className="text-xs text-gray-500 mt-1">
          {format(new Date(message.timestamp), 'HH:mm')}
        </span>
      </div>
    </div>
  );
}