import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { format, isValid } from 'date-fns';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const ResponseTimeChart = ({
  data = [],
  height = 280,
  title = 'Response Time (ms)',
}) => {
  if (!data || data.length === 0) {
    return (
      <div
        style={{ height }}
        className="w-full flex items-center justify-center bg-navy-800/40 border border-navy-500/50 rounded-xl text-slate-400 text-sm"
      >
        No response time data available for the selected period
      </div>
    );
  }

  // Format labels & values
  const labels = data.map((item) => {
    const rawDate = item.timestamp || item.createdAt || item.date || item.time;
    const dateObj = new Date(rawDate);
    if (isValid(dateObj)) {
      return format(dateObj, 'HH:mm');
    }
    return String(rawDate || '');
  });

  const values = data.map((item) => {
    const val = item.responseTime ?? item.value ?? item.duration ?? 0;
    return typeof val === 'number' ? Math.round(val) : 0;
  });

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Response Time (ms)',
        data: values,
        borderColor: '#3b82f6',
        backgroundColor: (context) => {
          const ctx = context.chart.ctx;
          const gradient = ctx.createLinearGradient(0, 0, 0, height);
          gradient.addColorStop(0, 'rgba(59, 130, 246, 0.45)');
          gradient.addColorStop(1, 'rgba(59, 130, 246, 0.0)');
          return gradient;
        },
        fill: true,
        tension: 0.4,
        borderWidth: 2,
        pointRadius: values.length > 30 ? 0 : 3,
        pointHoverRadius: 5,
        pointBackgroundColor: '#3b82f6',
        pointBorderColor: '#0f1117',
        pointBorderWidth: 1.5,
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
        padding: {
          bottom: 16,
        },
      },
      tooltip: {
        backgroundColor: '#141824',
        titleColor: '#e2e8f0',
        bodyColor: '#60a5fa',
        borderColor: '#2a3347',
        borderWidth: 1,
        padding: 10,
        boxPadding: 4,
        usePointStyle: true,
        callbacks: {
          label: (context) => ` ${context.parsed.y} ms`,
        },
      },
    },
    scales: {
      x: {
        grid: {
          color: '#1e2a45',
          drawBorder: false,
        },
        ticks: {
          color: '#64748b',
          font: { size: 11, family: 'Inter, system-ui, sans-serif' },
          maxRotation: 0,
          autoSkip: true,
          maxTicksLimit: 8,
        },
      },
      y: {
        beginAtZero: true,
        grid: {
          color: '#1e2a45',
          drawBorder: false,
        },
        ticks: {
          color: '#64748b',
          font: { size: 11, family: 'Inter, system-ui, sans-serif' },
          callback: (value) => `${value}ms`,
        },
      },
    },
    interaction: {
      intersect: false,
      mode: 'index',
    },
  };

  return (
    <div style={{ height }} className="w-full relative">
      <Line data={chartData} options={options} />
    </div>
  );
};

export default ResponseTimeChart;
