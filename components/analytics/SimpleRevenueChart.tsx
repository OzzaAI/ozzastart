'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { HelpCircle } from 'lucide-react';

// Dynamic import to avoid SSR issues with ApexCharts
const Chart = dynamic(() => import('react-apexcharts'), { 
  ssr: false,
  loading: () => (
    <div className="h-48 bg-gray-100 rounded-lg animate-pulse flex items-center justify-center">
      <div className="text-gray-500">Loading chart...</div>
    </div>
  )
});

interface SimpleRevenueChartProps {
  className?: string;
}

export default function SimpleRevenueChart({ className = '' }: SimpleRevenueChartProps) {
  // Sample data that matches the Stan Store style
  const revenueData = [
    0, 1200, 1800, 1500, 2200, 2800, 2400, 3200, 3800, 3400, 
    4200, 4800, 4400, 5200, 5800, 5400, 6200, 6800, 6400, 7200, 
    7800, 7400, 8200, 8800, 8400, 9200, 9800, 9400, 12500
  ];

  const chartOptions = {
    chart: {
      type: 'area' as const,
      height: 380,
      toolbar: { show: false },
      zoom: { enabled: false },
      background: 'transparent'
    },
    dataLabels: { enabled: false },
    stroke: {
      curve: 'smooth' as const,
      width: 2,
      colors: ['#1e40af']
    },
    fill: {
      type: 'gradient' as const,
      gradient: {
        shade: 'light',
        type: 'vertical',
        shadeIntensity: 0.3,
        gradientToColors: ['#3b82f6'],
        inverseColors: false,
        opacityFrom: 0.8,
        opacityTo: 0.1,
        stops: [0, 70, 100]
      }
    },
    colors: ['#1e40af'],
    grid: { show: false },
    xaxis: {
      categories: Array.from({ length: 29 }, (_, i) => `Jun ${i + 2}`),
      labels: {
        show: true,
        style: {
          colors: '#808EB6',
          fontSize: '12px'
        }
      },
      axisBorder: { show: false },
      axisTicks: { show: false }
    },
    yaxis: { show: false },
    legend: { show: false },
    markers: { size: 0 },
    tooltip: {
      enabled: true,
      theme: 'light' as const,
      y: {
        formatter: function(value: number) {
          return '$' + value.toLocaleString();
        }
      }
    }
  };

  const series = [{
    name: 'Revenue',
    data: revenueData
  }];

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}>
      <div className="flex items-center gap-2 mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Total Revenue</h3>
        <HelpCircle className="w-4 h-4 text-indigo-500" />
      </div>
      
      <div className="text-3xl font-bold text-gray-900 mb-6">
        $12,500
      </div>
      
      <div style={{ minHeight: '380px' }}>
        <Chart
          options={chartOptions}
          series={series}
          type="area"
          height={380}
        />
      </div>
    </div>
  );
}