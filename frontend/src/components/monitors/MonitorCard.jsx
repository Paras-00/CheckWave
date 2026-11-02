import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ExternalLink,
  Play,
  Pause,
  RefreshCw,
  Edit2,
  Trash2,
  Clock,
  Zap,
  ShieldCheck,
} from 'lucide-react';
import { formatDistanceToNow, isValid } from 'date-fns';
import StatusDot from '../common/StatusDot';
import Badge from '../common/Badge';

// Sparkline SVG component
const MiniSparkline = ({ points = [] }) => {
  if (!points || points.length < 2) {
    return <div className="h-9 w-24 flex items-center justify-center text-[10px] text-slate-500">No trend</div>;
  }

  const values = points.map((p) => (typeof p === 'number' ? p : p.responseTime || p.value || 0));
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const width = 100;
  const height = 36;
  const padding = 3;

  const coordinates = values.map((val, idx) => {
    const x = padding + (idx / (values.length - 1)) * (width - padding * 2);
    const y = height - padding - ((val - min) / range) * (height - padding * 2);
    return `${x},${y}`;
  });

  const pathD = `M ${coordinates.join(' L ')}`;

  return (
    <div className="flex flex-col items-end">
      <svg width={width} height={height} className="overflow-visible">
        <path
          d={pathD}
          fill="none"
          stroke="#3b82f6"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Highlight latest point */}
        {coordinates.length > 0 && (
          <circle
            cx={coordinates[coordinates.length - 1].split(',')[0]}
            cy={coordinates[coordinates.length - 1].split(',')[1]}
            r="2.5"
            className="fill-blue-400 stroke-navy-700 stroke-2"
          />
        )}
      </svg>
      <span className="text-[10px] text-slate-500 font-mono mt-0.5">last {values.length} checks</span>
    </div>
  );
};

const MonitorCard = ({
  monitor,
  onCheck,
  onPauseToggle,
  onEdit,
  onDelete,
}) => {
  const [checking, setChecking] = useState(false);
  const [toggling, setToggling] = useState(false);

  const monitorId = monitor._id || monitor.id;
  const isPaused = monitor.status === 'paused' || monitor.isActive === false;
  const status = isPaused ? 'paused' : monitor.status || 'unknown';

  const handleManualCheck = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (checking || !onCheck) return;
    setChecking(true);
    try {
      await onCheck(monitorId);
    } finally {
      setChecking(false);
    }
  };

  const handleToggle = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (toggling || !onPauseToggle) return;
    setToggling(true);
    try {
      await onPauseToggle(monitor);
    } finally {
      setToggling(false);
    }
  };

  const formatLastChecked = (dateStr) => {
    if (!dateStr) return 'Never';
    const dateObj = new Date(dateStr);
    if (!isValid(dateObj)) return 'Never';
    try {
      return formatDistanceToNow(dateObj, { addSuffix: true });
    } catch {
      return 'Recently';
    }
  };

  const sparklineData =
    monitor.history && Array.isArray(monitor.history)
      ? monitor.history.slice(-15)
      : monitor.recentChecks || [monitor.lastResponseTime || 120];

  return (
    <div className="card-hover group relative flex flex-col justify-between overflow-hidden">
      {/* Top Header Row */}
      <div>
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <StatusDot status={status} size="md" />
            <Link
              to={`/monitors/${monitorId}`}
              className="text-base font-semibold text-white hover:text-blue-400 transition-colors truncate"
              title={monitor.name}
            >
              {monitor.name}
            </Link>
          </div>
          <Badge status={status} size="sm" />
        </div>

        {/* URL with external link */}
        <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-5">
          <a
            href={monitor.url}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-blue-400 hover:underline truncate max-w-[240px]"
            title={monitor.url}
          >
            {monitor.url}
          </a>
          <ExternalLink className="w-3 h-3 shrink-0 text-slate-500" />
        </div>

        {/* Performance metrics & Sparkline */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3 rounded-lg bg-navy-800/60 border border-navy-500/60 mb-5">
          <div>
            <span className="text-[11px] text-slate-400 flex items-center gap-1">
              <Zap className="w-3 h-3 text-amber-400" />
              Latency
            </span>
            <span className="text-sm font-semibold text-slate-200 mt-0.5 block">
              {monitor.lastResponseTime != null ? `${Math.round(monitor.lastResponseTime)} ms` : '--'}
            </span>
          </div>

          <div>
            <span className="text-[11px] text-slate-400 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-400" />
              7d Uptime
            </span>
            <span className="text-sm font-semibold text-emerald-400 mt-0.5 block">
              {monitor.uptime7d != null
                ? `${Number(monitor.uptime7d).toFixed(1)}%`
                : monitor.uptime != null
                ? `${Number(monitor.uptime).toFixed(1)}%`
                : '100%'}
            </span>
          </div>

          <div className="col-span-2 sm:col-span-1 flex justify-end items-center">
            <MiniSparkline points={sparklineData} />
          </div>
        </div>
      </div>

      {/* Footer Info & Actions */}
      <div className="pt-3 border-t border-navy-600/70 flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-1.5 truncate">
          <Clock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          <span className="truncate">{formatLastChecked(monitor.lastChecked || monitor.updatedAt)}</span>
        </div>

        {/* Action button row */}
        <div className="flex items-center gap-1">
          <button
            onClick={handleManualCheck}
            disabled={checking || isPaused}
            title="Run check now"
            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-400 hover:bg-navy-600 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${checking ? 'animate-spin text-blue-400' : ''}`} />
          </button>

          <button
            onClick={handleToggle}
            disabled={toggling}
            title={isPaused ? 'Resume monitor' : 'Pause monitor'}
            className="p-1.5 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-navy-600 transition-colors"
          >
            {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onEdit?.(monitor);
            }}
            title="Edit monitor"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-navy-600 transition-colors"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onDelete?.(monitor);
            }}
            title="Delete monitor"
            className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-navy-600 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default MonitorCard;
