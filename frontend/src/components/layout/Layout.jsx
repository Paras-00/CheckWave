import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

const Layout = ({
  children,
  title,
  showTimeRange = false,
  timeRange = '24h',
  onTimeRangeChange,
  actions,
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-navy-900 text-slate-200 flex">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main content wrapper */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        {/* Top Header */}
        <Header
          title={title}
          onMenuClick={() => setSidebarOpen(true)}
          timeRange={timeRange}
          onTimeRangeChange={onTimeRangeChange}
          showTimeRange={showTimeRange}
          actions={actions}
        />

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto animate-in fade-in duration-200">
          {children || <Outlet />}
        </main>
      </div>
    </div>
  );
};

export default Layout;
