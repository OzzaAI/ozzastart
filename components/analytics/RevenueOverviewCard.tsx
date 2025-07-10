'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { ApexOptions } from 'apexcharts';
import { HelpCircle, Plus, Settings, ArrowUp } from 'lucide-react';

const Chart = dynamic(() => import('react-apexcharts'), { ssr: false });

interface RevenueOverviewCardProps {
  data?: Array<{ date: string; revenue: number }>;
  availableForPayout?: number;
  pendingRevenue?: number;
  totalRevenue?: number;
  className?: string;
}

const defaultData = [
  { date: '2024-06-02', revenue: 0 },
  { date: '2024-06-03', revenue: 1200 },
  { date: '2024-06-04', revenue: 1800 },
  { date: '2024-06-05', revenue: 1500 },
  { date: '2024-06-06', revenue: 2200 },
  { date: '2024-06-07', revenue: 2800 },
  { date: '2024-06-08', revenue: 2400 },
  { date: '2024-06-09', revenue: 3200 },
  { date: '2024-06-10', revenue: 3800 },
  { date: '2024-06-11', revenue: 3400 },
  { date: '2024-06-12', revenue: 4200 },
  { date: '2024-06-13', revenue: 4800 },
  { date: '2024-06-14', revenue: 4400 },
  { date: '2024-06-15', revenue: 5200 },
  { date: '2024-06-16', revenue: 5800 },
  { date: '2024-06-17', revenue: 5400 },
  { date: '2024-06-18', revenue: 6200 },
  { date: '2024-06-19', revenue: 6800 },
  { date: '2024-06-20', revenue: 6400 },
  { date: '2024-06-21', revenue: 7200 },
  { date: '2024-06-22', revenue: 7800 },
  { date: '2024-06-23', revenue: 7400 },
  { date: '2024-06-24', revenue: 8200 },
  { date: '2024-06-25', revenue: 8800 },
  { date: '2024-06-26', revenue: 8400 },
  { date: '2024-06-27', revenue: 9200 },
  { date: '2024-06-28', revenue: 9800 },
  { date: '2024-06-29', revenue: 9400 },
  { date: '2024-06-30', revenue: 12500 }
];

export default function RevenueOverviewCard({ 
  data = defaultData, 
  availableForPayout = 8500,
  pendingRevenue = 4000,
  totalRevenue = 12500,
  className = '' 
}: RevenueOverviewCardProps) {
  const [showBreakdown, setShowBreakdown] = useState(false);

  const chartOptions: ApexOptions = {
    chart: {
      type: 'area',
      height: 200,
      toolbar: {
        show: false
      },
      zoom: {
        enabled: false
      },
      sparkline: {
        enabled: false
      },
      background: 'transparent'
    },
    dataLabels: {
      enabled: false
    },
    stroke: {
      curve: 'smooth',
      width: 2,
      colors: ['#6355FF']
    },
    fill: {
      type: 'gradient',
      gradient: {
        shade: 'light',
        type: 'vertical',
        shadeIntensity: 0.5,
        gradientToColors: ['#8277FF'],
        inverseColors: false,
        opacityFrom: 0.7,
        opacityTo: 0,
        stops: [0, 100]
      }
    },
    colors: ['#6355FF'],
    grid: {
      show: false
    },
    xaxis: {
      type: 'datetime',
      categories: data.map(item => item.date),
      labels: {
        show: true,
        style: {
          colors: '#808EB6',
          fontSize: '12px',
          fontWeight: 400
        },
        formatter: function(value: string) {
          const date = new Date(value);
          return date.toLocaleDateString('en-US', { 
            month: 'short', 
            day: '2-digit' 
          });
        }
      },
      axisBorder: {
        show: false
      },
      axisTicks: {
        show: false
      },
      tooltip: {
        enabled: false
      }
    },
    yaxis: {
      show: false
    },
    legend: {
      show: false
    },
    markers: {
      size: 0,
      hover: {
        size: 6,
        sizeOffset: 3
      }
    },
    tooltip: {
      enabled: true,
      shared: true,
      intersect: false,
      theme: 'light',
      style: {
        fontSize: '12px'
      },
      x: {
        format: 'MMM dd'
      },
      y: {
        formatter: function(value: number) {
          return '$' + value.toLocaleString();
        }
      }
    }
  };

  const series = [
    {
      name: 'Total Revenue',
      data: data.map(item => item.revenue)
    }
  ];

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden ${className}`}>
      <div className="p-6">
        <div className="flex items-start gap-6">
          {/* Chart Section */}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Total Revenue</h3>
              <div className="group relative">
                <HelpCircle className="w-4 h-4 text-indigo-500 cursor-help" />
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                  Revenue generated across your coaching network
                </div>
              </div>
            </div>
            
            <div style={{ minHeight: '200px' }}>
              <Chart
                options={chartOptions}
                series={series}
                type="area"
                height={200}
              />
            </div>
          </div>

          {/* Revenue Summary Section */}
          <div className="flex-shrink-0 w-80">
            <div className="space-y-6">
              {/* Available for Cashout */}
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="text-sm text-gray-500 mb-1">
                      Available for Cashout
                    </div>
                    <div className="text-3xl font-bold text-gray-900">
                      ${availableForPayout.toLocaleString()}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-500 mb-1">Available Soon</div>
                    <div className="text-xl font-semibold text-gray-900">
                      ${pendingRevenue.toLocaleString()}
                    </div>
                    <button 
                      onClick={() => setShowBreakdown(!showBreakdown)}
                      className="text-sm text-indigo-600 hover:text-indigo-500 font-medium mt-1"
                    >
                      View breakdown
                    </button>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-3">
                  <button 
                    disabled={availableForPayout === 0}
                    className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Cash Out
                  </button>
                  <button className="w-full flex items-center justify-center gap-2 border border-gray-300 text-gray-700 py-3 px-4 rounded-lg font-semibold hover:bg-gray-50 transition-colors">
                    <Settings className="w-4 h-4" />
                    Settings
                  </button>
                </div>
              </div>

              {/* Breakdown Modal/Dropdown */}
              {showBreakdown && (
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Processing Purchases</span>
                    <span className="font-semibold">${(pendingRevenue * 0.7).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Agency Commissions</span>
                    <span className="font-semibold">${(pendingRevenue * 0.2).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Platform Fees</span>
                    <span className="font-semibold">${(pendingRevenue * 0.1).toLocaleString()}</span>
                  </div>
                  <div className="border-t border-gray-200 pt-2 mt-2">
                    <div className="flex justify-between items-center text-sm font-semibold">
                      <span className="text-gray-900">Total Available Soon</span>
                      <span className="text-gray-900">${pendingRevenue.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}