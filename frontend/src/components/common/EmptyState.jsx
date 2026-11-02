import React from 'react';
import { HelpCircle } from 'lucide-react';

const EmptyState = ({
  icon: Icon = HelpCircle,
  title = 'No data found',
  description = 'There are no records to display at this moment.',
  action,
  className = '',
}) => {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center p-8 sm:p-12 border border-dashed border-navy-500 rounded-xl bg-navy-800/20 ${className}`}
    >
      <div className="w-14 h-14 rounded-2xl bg-navy-800 border border-navy-500 flex items-center justify-center text-blue-400 mb-4 shadow-inner">
        <Icon className="w-7 h-7" />
      </div>
      <h3 className="text-base sm:text-lg font-semibold text-slate-200 mb-1">{title}</h3>
      <p className="text-sm text-slate-400 max-w-sm mb-6 leading-relaxed">{description}</p>
      {action && <div>{action}</div>}
    </div>
  );
};

export default EmptyState;
