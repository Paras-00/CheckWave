import React from 'react';

const Badge = ({
  status = 'unknown',
  label,
  size = 'md',
  className = '',
}) => {
  const normalized = (status || '').toString().toLowerCase();

  const variantStyles = {
    // Monitors statuses
    up: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    active: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    healthy: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    down: 'bg-red-500/10 text-red-400 border-red-500/20',
    failed: 'bg-red-500/10 text-red-400 border-red-500/20',
    paused: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
    inactive: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
    unknown: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    pending: 'bg-amber-500/10 text-amber-400 border-amber-500/20',

    // Incident statuses
    open: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    resolved: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    investigating: 'bg-blue-500/10 text-blue-400 border-blue-500/20',

    // Severities
    critical: 'bg-red-500/20 text-red-300 border-red-500/40 font-semibold',
    high: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
    medium: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    low: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  };

  const sizeStyles = {
    sm: 'px-2 py-0.5 text-[11px]',
    md: 'px-2.5 py-0.5 text-xs',
    lg: 'px-3 py-1 text-sm',
  };

  const styleClass = variantStyles[normalized] || 'bg-slate-500/10 text-slate-300 border-slate-500/20';
  const sizeClass = sizeStyles[size] || sizeStyles.md;

  const displayLabel = label || normalized.toUpperCase();

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full border tracking-wide uppercase ${styleClass} ${sizeClass} ${className}`}
    >
      {displayLabel}
    </span>
  );
};

export default Badge;
