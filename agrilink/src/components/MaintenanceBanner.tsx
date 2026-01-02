"use client";

import { useState, useEffect } from 'react';
import { Alert, AlertDescription } from './ui/alert';
import { AlertTriangle } from 'lucide-react';

interface MaintenanceSchedule {
  id: string;
  startTime: string;
  endTime: string;
  duration: number; // in minutes
  message?: string;
  isActive: boolean;
}

export function MaintenanceBanner() {
  const [maintenance, setMaintenance] = useState<MaintenanceSchedule | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // Check if current user is admin
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        const user = JSON.parse(userData);
        setIsAdmin(user.userType === 'admin');
      } catch (e) {
        // Ignore parse errors
      }
    }

    fetchMaintenanceSchedule();
    // Check every 5 minutes for new maintenance schedules
    const interval = setInterval(fetchMaintenanceSchedule, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchMaintenanceSchedule = async () => {
    try {
      const response = await fetch('/api/maintenance/schedule');
      if (response.ok) {
        const data = await response.json();
        if (data.maintenance && data.shouldShow) {
          setMaintenance(data.maintenance);
          setIsVisible(true);
        } else {
          setMaintenance(null);
          setIsVisible(false);
        }
      }
    } catch (error) {
      console.error('Error fetching maintenance schedule:', error);
    }
  };

  const formatMaintenanceTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short'
    });
  };

  const getTimeUntilMaintenance = (dateString: string) => {
    const now = new Date();
    const maintenanceTime = new Date(dateString);
    const diff = maintenanceTime.getTime() - now.getTime();
    
    if (diff <= 0) return 'Maintenance is in progress';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `in ${hours} hour${hours > 1 ? 's' : ''} and ${minutes} minute${minutes !== 1 ? 's' : ''}`;
    }
    return `in ${minutes} minute${minutes !== 1 ? 's' : ''}`;
  };

  // Hide banner for admins since they have access to maintenance management page
  if (!isVisible || !maintenance || isAdmin) {
    return null;
  }

  return (
    <Alert className="bg-amber-50 border-amber-300 border-l-4 rounded-none sticky top-0 z-50 shadow-md">
      <AlertTriangle className="h-5 w-5 text-amber-600" />
      <AlertDescription className="w-full">
        <div className="font-semibold text-amber-900 mb-1">
          Planned Maintenance Scheduled
        </div>
        <div className="text-sm text-amber-800">
          {maintenance.message || 'System maintenance is scheduled'} starting {formatMaintenanceTime(maintenance.startTime)} ({getTimeUntilMaintenance(maintenance.startTime)}).
          {maintenance.duration > 15 && (
            <span className="block mt-1">
              Expected duration: {maintenance.duration} minutes. The system may be unavailable during this time.
            </span>
          )}
        </div>
      </AlertDescription>
    </Alert>
  );
}

