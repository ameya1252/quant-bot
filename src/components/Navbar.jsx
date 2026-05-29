import { NavLink } from 'react-router-dom';

const links = [
  { to: '/', label: 'Dashboard' },
  { to: '/scanner', label: 'Scanner' },
  { to: '/watchlist', label: 'Watchlist' },
  { to: '/log', label: 'Trade Log' },
];

export default function Navbar() {
  return (
    <header className="border-b border-[#222] mb-6 sticky top-0 z-50 bg-[#111]/95 backdrop-blur">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-[#00c46a] font-bold text-lg tracking-tight">▶ AI TRADER</span>
          <span className="text-[#555] text-xs hidden sm:block ml-2">Opus analysis · Haiku chat · cost-capped search</span>
        </div>
        <nav className="flex items-center gap-1">
          {links.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `px-3 py-1.5 text-xs rounded transition-colors ${
                  isActive
                    ? 'bg-[#222] text-[#f1f1f1]'
                    : 'text-[#888] hover:text-[#f1f1f1] hover:bg-[#1a1a1a]'
                }`
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>
      </div>
    </header>
  );
}
