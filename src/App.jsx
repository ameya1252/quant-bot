import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import FloatingChat, { CHAT_PANEL_WIDTH } from './components/FloatingChat';
import Dashboard from './pages/Dashboard';
import Scanner from './pages/Scanner';
import Watchlist from './pages/Watchlist';
import TradeLog from './pages/TradeLog';

export default function App() {
  const [chatOpen, setChatOpen] = useState(false);
  const [canReserveChatSpace, setCanReserveChatSpace] = useState(() =>
    typeof window === 'undefined' ? true : window.matchMedia('(min-width: 1024px)').matches,
  );

  useEffect(() => {
    const query = window.matchMedia('(min-width: 1024px)');
    const update = () => setCanReserveChatSpace(query.matches);
    update();
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-[#111] text-[#f1f1f1] font-mono">
        <div
          className="transition-[padding] duration-200"
          style={{ paddingRight: chatOpen && canReserveChatSpace ? CHAT_PANEL_WIDTH : 0 }}
        >
          <Navbar />
          <main className="max-w-7xl mx-auto px-4 pb-12">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/scanner" element={<Scanner />} />
            <Route path="/watchlist" element={<Watchlist />} />
            <Route path="/log" element={<TradeLog />} />
          </Routes>
          </main>
        </div>
        <FloatingChat
          open={chatOpen}
          onOpen={() => setChatOpen(true)}
          onClose={() => setChatOpen(false)}
        />
      </div>
    </BrowserRouter>
  );
}
