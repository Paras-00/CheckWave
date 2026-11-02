import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { format, isValid } from 'date-fns';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const UptimeChart = ({
  data = [],
  height = 240,
  title = 'Daily Uptime (%)',
}) => {
  if (!data || data.length === 0) {
    return (
      <div
        style={{ height }}
        className="w-full flex items-center justify-center bg-navy-800/40 border border-navy-500/50 rounded-xl text-slate-400 text-sm"
      >
        No uptime records available
      </div>
    );
  }

  const labels = data.map((item) => {
    const raw = item.date || item.timestamp || item.day;
    const dateObj = new Date(raw);
    if (isValid(dateObj)) {
      return format(dateObj, 'MMM d');
    }
    return String(raw || '');
  });

  const uptimes = data.map((item) => {
    let val = item.uptime ?? item.percentage ?? 100;
    if (val <= 1 && val > 0) val = val * 100;
    return Math.min(100, Math.max(0, Math.round(val * 100) / 100));
  });

  // Color by threshold: >=99% green, >=95% yellow, <95% red
  const backgroundColors = uptimes.map((uptime) => {
    if (uptime >= 99) return '#10b981';
    if (uptime >= 95) return '#f59e0b';
    return '#ef4444';
  });

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Uptime (%)',
        data: uptimes,
        backgroundColor: backgroundColors,
        borderRadius: 4,
        maxBarThickness: 32,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: Boolean(title),
        text: title,
        color: '#94a3b8',
        font: {
          size: 13,
          weight: 500,
          family: 'Inter, system-ui, sans-serif',
        },
        align: 'start',
        padding: { bottom: 12 },
      },
      tooltip: {
        backgroundColor: '#141824',
        titleColor: '#e2e8f0',
        borderColor: '#2a3347',
        borderWidth: 1,
        padding: 10,
        callbacks: {
          label: (context) => ` Uptime: ${context.parsed.y}%`,
        },
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: '#64748b',
          font: { size: 10, family: 'Inter, system-ui, sans-serif' },
          maxRotation: 0,
          autoSkip: true,
          maxTicksLimit: 14,
        },
      },
      y: {
        min: 80,
        max: 100,
        grid: {
          color: '#1e2a45',
          drawBorder: false,
        },
        ticks: {
          color: '#64748b',
          font: { size: 10, family: 'Inter, system-ui, sans-serif' },
          callback: (value) => `${value}%`,
        },
      },
    },
  };

  return (
    <div style={{ height }} className="w-full relative">
      <Bar data={chartData} options={options} />
    </div>
  );
};

export default UptimeChart;
