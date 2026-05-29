import { useState } from 'react';

const STARTER = [
  'What should I watch today?',
  'Which setup has the best risk/reward?',
  'Summarize my recent analyses.',
];

export const CHAT_PANEL_WIDTH = 420;

export default function FloatingChat({ open, onOpen, onClose }) {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Ask me about your scanner results, watchlist, recent analyses, or trade risk.',
    },
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const send = async (text = input) => {
    const message = text.trim();
    if (!message || loading) return;

    setInput('');
    setError(null);
    setLoading(true);
    setMessages((prev) => [...prev, { role: 'user', content: message }]);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Chat failed');
      setMessages((prev) => [...prev, { role: 'assistant', content: payload.answer }]);
    } catch (err) {
      setError(err.message || 'Chat failed');
    } finally {
      setLoading(false);
    }
  };

  const resizeInput = (element) => {
    element.style.height = 'auto';
    element.style.height = `${Math.min(element.scrollHeight, 120)}px`;
  };

  const renderInline = (text) => {
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={index} className="text-[#f1f1f1] font-bold">{part.slice(2, -2)}</strong>;
      }
      return <span key={index}>{part}</span>;
    });
  };

  const renderContent = (content) => {
    const lines = content.split('\n').map((line) => line.trim()).filter(Boolean);
    if (lines.length <= 1) return <p>{content}</p>;

    return (
      <div className="space-y-2">
        {lines.map((line, index) => {
          const heading = line.match(/^#{1,3}\s+(.*)$/);
          const bullet = line.match(/^[-*•]\s+(.*)$/);
          const numbered = line.match(/^\d+[.)]\s+(.*)$/);
          if (heading) {
            return (
              <div key={index} className="text-[#f1f1f1] font-bold text-sm pt-1 first:pt-0">
                {renderInline(heading[1])}
              </div>
            );
          }
          if (bullet || numbered) {
            return (
              <div key={index} className="flex gap-2 pl-1">
                <span className="text-[#4e9af1] flex-shrink-0">{numbered ? numbered[0].match(/^\d+/)?.[0] + '.' : '•'}</span>
                <span>{renderInline(bullet?.[1] || numbered?.[1])}</span>
              </div>
            );
          }
          return <p key={index}>{renderInline(line)}</p>;
        })}
      </div>
    );
  };

  return (
    <>
      <aside
        className={`fixed top-0 right-0 z-[60] h-screen bg-[#1a1a1a] border-l border-[#333] shadow-2xl transition-transform duration-200 w-[min(420px,100vw)] ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="h-full flex flex-col">
          <div className="h-14 px-4 border-b border-[#222] flex items-center justify-between">
            <div>
              <div className="text-sm font-bold text-[#f1f1f1]">Trading Agent</div>
              <div className="text-[10px] text-[#555]">Uses your watchlist, scans, and analysis history</div>
            </div>
            <button
              onClick={onClose}
              className="text-xs px-2 py-1 rounded bg-[#222] hover:bg-[#2a2a2a] text-[#888] hover:text-[#f1f1f1]"
              aria-label="Minimize chat"
            >
              Minimize
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {messages.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                className={`text-xs leading-relaxed rounded p-3 whitespace-pre-wrap ${
                  message.role === 'user'
                    ? 'ml-8 bg-[#4e9af1]/15 border border-[#4e9af1]/30 text-[#dcecff]'
                    : 'mr-8 bg-[#111] border border-[#222] text-[#ccc]'
                }`}
              >
                {renderContent(message.content)}
              </div>
            ))}
            {loading && (
              <div className="mr-8 bg-[#111] border border-[#222] rounded p-3 text-xs text-[#888]">
                Thinking...
              </div>
            )}
            {error && (
              <div className="bg-[#ff4757]/10 border border-[#ff4757]/30 rounded p-3 text-xs text-[#ff8a94]">
                {error}
              </div>
            )}
          </div>

          <div className="p-3 border-t border-[#222]">
            <div className="flex flex-wrap gap-2 mb-2">
              {STARTER.map((starter) => (
                <button
                  key={starter}
                  onClick={() => send(starter)}
                  disabled={loading}
                  className="text-[10px] px-2 py-1 rounded bg-[#222] hover:bg-[#2a2a2a] text-[#888] hover:text-[#f1f1f1] disabled:opacity-40"
                >
                  {starter}
                </button>
              ))}
            </div>
            <form
              className="flex gap-2"
              onSubmit={(event) => {
                event.preventDefault();
                send();
              }}
            >
              <textarea
                value={input}
                onChange={(event) => {
                  setInput(event.target.value);
                  resizeInput(event.target);
                }}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && !event.shiftKey) {
                    event.preventDefault();
                    send();
                    event.currentTarget.style.height = 'auto';
                  }
                }}
                placeholder="Ask about trades, timing, risk..."
                rows={1}
                className="flex-1 min-w-0 max-h-28 resize-none overflow-y-auto bg-[#111] border border-[#333] rounded px-3 py-2 text-xs leading-relaxed text-[#f1f1f1] placeholder-[#555] focus:outline-none focus:border-[#4e9af1]"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="px-3 py-2 bg-[#4e9af1] hover:bg-[#6aaef5] disabled:opacity-40 rounded text-xs font-bold text-[#111]"
              >
                Send
              </button>
            </form>
          </div>
        </div>
      </aside>

      {!open && (
        <button
          onClick={onOpen}
          className="fixed right-0 top-1/2 -translate-y-1/2 z-[60] h-32 w-10 rounded-l-lg bg-[#4e9af1] hover:bg-[#6aaef5] text-[#111] font-black shadow-xl border border-[#86c1ff] flex items-center justify-center"
          aria-label="Open trading agent"
        >
          <span className="[writing-mode:vertical-rl] rotate-180 text-xs tracking-wider">AI CHAT</span>
        </button>
      )}
    </>
  );
}
