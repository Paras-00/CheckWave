import React, { useState, useEffect } from 'react';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';

const StatCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend, // 'up' | 'down' | 'neutral'
  trendValue, // e.g. "+2.4%" or "-15ms"
  color = 'blue', // 'blue' | 'emerald' | 'amber' | 'red' | 'purple'
  className = '',
}) => {
  // Try to parse numeric value for counter animation
  const [displayValue, setDisplayValue] = useState(value);

  useEffect(() => {
    // If value is numeric, run a smooth counter animation
    const num = parseFloat(String(value).replace(/[^0-9.-]/g, ''));
    if (!isNaN(num) && num > 0) {
      let start = 0;
      const duration = 600; // ms
      const steps = 24;
      const stepTime = duration / steps;
      const increment = num / steps;
      let current = 0;

      const timer = setInterval(() => {
        current += increment;
        if (current >= num) {
          setDisplayValue(value);
          clearInterval(timer);
        } else {
          // Format with original suffix (e.g., % or ms)
          const suffix = String(value).replace(/[0-9.-]/g, '');
          const prefix = String(value).startsWith('$') ? '$' : '';
          const formatted = Number.isInteger(num)
            ? Math.round(current)
            : current.toFixed(1);
          setDisplayValue(`${prefix}${formatted}${suffix}`);
        }
      }, stepTime);

      return () => clearInterval(timer);
    } else {
      setDisplayValue(value);
    }
  }, [value]);

  const colorVariants = {
    blue: {
      bg: 'bg-blue-500/10',
      border: 'border-blue-500/20',
      text: 'text-blue-400',
      gradient: 'from-blue-500/10 via-transparent to-transparent',
      hoverBorder: 'hover:border-blue-500/40',
    },
    emerald: {
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/20',
      text: 'text-emerald-400',
      gradient: 'from-emerald-500/10 via-transparent to-transparent',
      hoverBorder: 'hover:border-emerald-500/40',
    },
    amber: {
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/20',
      text: 'text-amber-400',
      gradient: 'from-amber-500/10 via-transparent to-transparent',
      hoverBorder: 'hover:border-amber-500/40',
    },
    red: {
      bg: 'bg-red-500/10',
      border: 'border-red-500/20',
      text: 'text-red-400',
      gradient: 'from-red-500/10 via-transparent to-transparent',
      hoverBorder: 'hover:border-red-500/40',
    },
    purple: {
      bg: 'bg-purple-500/10',
      border: 'border-purple-500/20',
      text: 'text-purple-400',
      gradient: 'from-purple-500/10 via-transparent to-transparent',
      hoverBorder: 'hover:border-purple-500/40',
    },
  };

  const scheme = colorVariants[color] || colorVariants.blue;

  return (
    <div
      className={`relative overflow-hidden bg-navy-700/80 backdrop-blur-md border border-navy-500 rounded-xl p-5 shadow-lg transition-all duration-200 ${scheme.hoverBorder} ${className}`}
    >
      <div
        className={`absolute -top-12 -right-12 w-32 h-32 bg-gradient-to-br ${scheme.gradient} rounded-full blur-2xl pointer-events-none`}
      />

      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-slate-400">{title}</p>
          <h4 className="text-2xl sm:text-3xl font-bold text-slate-100 mt-2 tracking-tight">
            {displayValue ?? '--'}
          </h4>
        </div>
        {Icon && (
          <div
            className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border ${scheme.bg} ${scheme.border} ${scheme.text}`}
          >
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      {(subtitle || trendValue) && (
        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-navy-600 text-xs">
          {trendValue && (
            <span
              className={`inline-flex items-center gap-0.5 font-medium ${
                trend === 'up'
                  ? 'text-emerald-400'
                  : trend === 'down'
                  ? 'text-red-400'
                  : 'text-slate-400'
              }`}
            >
              {trend === 'up' && <ArrowUpRight className="w-3.5 h-3.5" />}
              {trend === 'down' && <ArrowDownRight className="w-3.5 h-3.5" />}
              {trend === 'neutral' && <Minus className="w-3.5 h-3.5" />}
              {trendValue}
            </span>
          )}
          {subtitle && <span className="text-slate-400 truncate">{subtitle}</span>}
        </div>
      )}
    </div>
  );
};

export default StatCard;
