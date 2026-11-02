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

const ErrorRateChart = ({
  data = [],
  height = 260,
  title = 'Success vs Error Rate (%)',
}) => {
  if (!data || data.length === 0) {
    return (
      <div
        style={{ height }}
        className="w-full flex items-center justify-center bg-navy-800/40 border border-navy-500/50 rounded-xl text-slate-400 text-sm"
      >
        No error rate metrics available
      </div>
    );
  }

  const labels = data.map((item) => {
    const rawDate = item.timestamp || item.createdAt || item.date || item.time;
    const dateObj = new Date(rawDate);
    if (isValid(dateObj)) {
      return format(dateObj, 'MMM d, HH:mm');
    }
    return String(rawDate || '');
  });

  const errorRates = data.map((item) => {
    let rate = item.errorRate ?? item.errors ?? 0;
    if (rate <= 1 && rate > 0) rate = rate * 100;
    return Math.min(100, Math.max(0, Math.round(rate * 10) / 10));
  });

  const successRates = errorRates.map((errRate) => Math.round((100 - errRate) * 10) / 10);

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Success Rate (%)',
        data: successRates,
        backgroundColor: '#10b981',
        borderRadius: 4,
        stack: 'Stack 0',
      },
      {
        label: 'Error Rate (%)',
        data: errorRates,
        backgroundColor: '#ef4444',
        borderRadius: 4,
        stack: 'Stack 0',
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top',
        align: 'end',
        labels: {
          color: '#94a3b8',
          boxWidth: 12,
          boxHeight: 12,
          usePointStyle: true,
          font: { size: 11, family: 'Inter, system-ui, sans-serif' },
        },
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
          label: (context) => ` ${context.dataset.label}: ${context.parsed.y}%`,
        },
      },
    },
    scales: {
      x: {
        stacked: true,
        grid: {
          display: false,
        },
        ticks: {
          color: '#64748b',
          font: { size: 10, family: 'Inter, system-ui, sans-serif' },
          maxRotation: 0,
          autoSkip: true,
          maxTicksLimit: 7,
        },
      },
      y: {
        stacked: true,
        max: 100,
        beginAtZero: true,
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

export default ErrorRateChart;
