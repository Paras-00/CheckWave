import React from 'react';
import { useLocation } from 'react-router-dom';
import { Menu, Clock, User } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

const timeRanges = [
  { label: '1 Hour', value: '1h' },
  { label: '24 Hours', value: '24h' },
  { label: '7 Days', value: '7d' },
  { label: '30 Days', value: '30d' },
];

const pageTitleMap = {
  '/dashboard': 'System Overview',
  '/monitors': 'Monitors Management',
  '/analytics': 'Performance Analytics',
  '/incidents': 'Incident Tracker',
  '/settings': 'System Settings',
};

const Header = ({
  title,
  onMenuClick,
  timeRange = '24h',
  onTimeRangeChange,
  showTimeRange = false,
  actions,
}) => {
  const location = useLocation();
  const { user } = useAuth();

  const currentTitle =
    title ||
    pageTitleMap[location.pathname] ||
    (location.pathname.startsWith('/monitors/') ? 'Monitor Details' : 'CheckWave');

  return (
    <header className="sticky top-0 z-30 h-16 bg-navy-900/80 backdrop-blur-md border-b border-navy-500/80 px-4 sm:px-8 flex items-center justify-between">
      <div className="flex items-center gap-3">
        {/* Mobile menu trigger */}
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-navy-800 transition-colors"
          aria-label="Open Navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight">{currentTitle}</h1>
      </div>

      <div className="flex items-center gap-3 sm:gap-4">
        {/* Time range selector */}
        {showTimeRange && onTimeRangeChange && (
          <div className="flex items-center bg-navy-800 border border-navy-500 rounded-lg p-0.5 text-xs">
            <span className="hidden sm:flex items-center pl-2.5 pr-1.5 text-slate-400">
              <Clock className="w-3.5 h-3.5 mr-1" />
              Range:
            </span>
            <div className="flex items-center">
              {timeRanges.map((range) => (
                <button
                  key={range.value}
                  type="button"
                  onClick={() => onTimeRangeChange(range.value)}
                  className={`px-2.5 py-1 rounded-md font-medium transition-all duration-150 ${
                    timeRange === range.value
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {range.value}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Custom Actions (e.g., Add Monitor button) */}
        {actions && <div className="flex items-center gap-2">{actions}</div>}

        {/* User name indicator */}
        <div className="hidden md:flex items-center gap-2 pl-2 border-l border-navy-600 text-xs text-slate-300">
          <div className="w-6 h-6 rounded-full bg-navy-700 border border-navy-500 flex items-center justify-center text-slate-300">
            <User className="w-3.5 h-3.5" />
          </div>
          <span className="font-medium text-slate-200">{user?.name || user?.email || 'User'}</span>
        </div>
      </div>
    </header>
  );
};

export default Header;
