import React from 'react';

const StatusDot = ({
  status = 'unknown',
  size = 'md',
  pulse = true,
  className = '',
}) => {
  const normalized = (status || '').toString().toLowerCase();

  const colorConfig = {
    up: {
      dot: 'bg-emerald-500',
      ping: 'bg-emerald-400',
    },
    active: {
      dot: 'bg-emerald-500',
      ping: 'bg-emerald-400',
    },
    down: {
      dot: 'bg-red-500',
      ping: 'bg-red-400',
    },
    paused: {
      dot: 'bg-slate-400',
      ping: 'bg-slate-400',
    },
    unknown: {
      dot: 'bg-amber-500',
      ping: 'bg-amber-400',
    },
  };

  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-2.5 h-2.5',
    lg: 'w-3.5 h-3.5',
  };

  const currentConfig = colorConfig[normalized] || colorConfig.unknown;
  const dotSize = sizeClasses[size] || sizeClasses.md;
  const shouldPulse = pulse && normalized !== 'paused';

  return (
    <span className={`relative inline-flex items-center justify-center ${dotSize} ${className}`}>
      {shouldPulse && (
        <span
          className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${currentConfig.ping}`}
        />
      )}
      <span className={`relative inline-flex rounded-full ${dotSize} ${currentConfig.dot}`} />
    </span>
  );
};

export default StatusDot;
