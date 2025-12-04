'use client';

import React, { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react';

interface CostData {
  channel: string;
  count: number;
  cost: number;
  limit: number;
  percentage: number;
}

interface NotificationCostDashboardProps {
  userId: string;
  className?: string;
}

export function NotificationCostDashboard({ userId, className = '' }: NotificationCostDashboardProps) {
  const [costData, setCostData] = useState<CostData[]>([]);
  const [totalCost, setTotalCost] = useState(0);
  const [monthlyBudget, setMonthlyBudget] = useState(50); // $50 budget
  const [isOverBudget, setIsOverBudget] = useState(false);

  useEffect(() => {
    loadCostData();
  }, [userId]);

  const loadCostData = async () => {
    // Mock data - in real app, fetch from API
    const mockData: CostData[] = [
      {
        channel: 'SMS',
        count: 45,
        cost: 3.29, // 45 * $0.0732
        limit: 100,
        percentage: 45
      },
      {
        channel: 'Push',
        count: 1250,
        cost: 0.00125, // 1250 * $0.000001
        limit: 1000000,
        percentage: 0.125
      },
      {
        channel: 'Email',
        count: 320,
        cost: 0.032, // 320 * $0.0001
        limit: 62000,
        percentage: 0.52
      },
      {
        channel: 'In-App',
        count: 2500,
        cost: 0, // Free
        limit: 999999,
        percentage: 0.25
      }
    ];

    setCostData(mockData);
    
    const total = mockData.reduce((sum, item) => sum + item.cost, 0);
    setTotalCost(total);
    setIsOverBudget(total > monthlyBudget);
  };

  const getChannelColor = (channel: string) => {
    switch (channel) {
      case 'SMS': return 'text-red-600 bg-red-50';
      case 'Push': return 'text-blue-600 bg-blue-50';
      case 'Email': return 'text-purple-600 bg-purple-50';
      case 'In-App': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusIcon = (percentage: number, channel: string) => {
    if (channel === 'In-App') return <CheckCircle className="w-4 h-4 text-green-500" />;
    if (percentage > 80) return <AlertTriangle className="w-4 h-4 text-red-500" />;
    if (percentage > 50) return <TrendingUp className="w-4 h-4 text-yellow-500" />;
    return <CheckCircle className="w-4 h-4 text-green-500" />;
  };

  const getCostEfficiency = (channel: string, cost: number, count: number) => {
    if (count === 0) return 'N/A';
    const costPerMessage = cost / count;
    if (costPerMessage < 0.001) return 'Excellent';
    if (costPerMessage < 0.01) return 'Good';
    if (costPerMessage < 0.05) return 'Fair';
    return 'Poor';
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Notification Costs</h3>
            <p className="text-sm text-gray-600">Monitor your notification spending</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-gray-900">${totalCost.toFixed(2)}</div>
            <div className="text-sm text-gray-600">This month</div>
          </div>
        </div>
      </div>

      {/* Budget Alert */}
      {isOverBudget && (
        <div className="p-4 bg-red-50 border-l-4 border-red-400">
          <div className="flex items-center">
            <AlertTriangle className="w-5 h-5 text-red-400" />
            <div className="ml-3">
              <p className="text-sm text-red-800">
                <strong>Budget Exceeded!</strong> You've spent ${totalCost.toFixed(2)} of your ${monthlyBudget} budget.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Cost Breakdown */}
      <div className="p-6">
        <div className="space-y-4">
          {costData.map((item) => (
            <div key={item.channel} className="flex items-center justify-between p-4 rounded-lg border border-gray-200">
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-lg ${getChannelColor(item.channel)}`}>
                  <DollarSign className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-medium text-gray-900">{item.channel}</div>
                  <div className="text-sm text-gray-600">
                    {item.count.toLocaleString()} messages
                  </div>
                </div>
              </div>
              
              <div className="text-right">
                <div className="font-semibold text-gray-900">
                  ${item.cost.toFixed(4)}
                </div>
                <div className="text-sm text-gray-600">
                  {getCostEfficiency(item.channel, item.cost, item.count)}
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                {getStatusIcon(item.percentage, item.channel)}
                <div className="text-sm text-gray-600">
                  {item.percentage.toFixed(1)}%
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recommendations */}
      <div className="p-6 bg-gray-50 border-t border-gray-200">
        <h4 className="font-medium text-gray-900 mb-3">Cost Optimization Tips</h4>
        <div className="space-y-2 text-sm text-gray-600">
          <div className="flex items-start space-x-2">
            <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
            <span>Use in-app notifications for non-urgent updates (free)</span>
          </div>
          <div className="flex items-start space-x-2">
            <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
            <span>Reserve SMS for critical alerts only (most expensive)</span>
          </div>
          <div className="flex items-start space-x-2">
            <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
            <span>Use push notifications for important updates (very cheap)</span>
          </div>
          <div className="flex items-start space-x-2">
            <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
            <span>Batch notifications to reduce API calls</span>
          </div>
        </div>
      </div>
    </div>
  );
}
