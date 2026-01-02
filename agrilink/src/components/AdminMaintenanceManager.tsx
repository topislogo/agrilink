"use client";

import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Alert, AlertDescription } from './ui/alert';
import { Calendar, Clock, AlertTriangle, Plus, X, Trash2, Ban } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

// Time Picker Component
function TimePicker({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const [hours, setHours] = useState(() => {
    if (value) {
      const [h] = value.split(':');
      return h || '00';
    }
    return '00';
  });
  
  const [minutes, setMinutes] = useState(() => {
    if (value) {
      const [, m] = value.split(':');
      return m || '00';
    }
    return '00';
  });

  useEffect(() => {
    if (value) {
      const [h, m] = value.split(':');
      if (h) setHours(h);
      if (m) setMinutes(m);
    }
  }, [value]);

  const handleHoursChange = (h: string) => {
    setHours(h);
    onChange(`${h}:${minutes}`);
  };

  const handleMinutesChange = (m: string) => {
    setMinutes(m);
    onChange(`${hours}:${m}`);
  };

  // Generate hour options (00-23)
  const hourOptions = Array.from({ length: 24 }, (_, i) => {
    const hour = i.toString().padStart(2, '0');
    return { value: hour, label: hour };
  });

  // Generate minute options (00, 15, 30, 45) or all minutes
  const minuteOptions = Array.from({ length: 60 }, (_, i) => {
    const minute = i.toString().padStart(2, '0');
    return { value: minute, label: minute };
  });

  return (
    <div className="flex gap-2">
      <Select value={hours} onValueChange={handleHoursChange}>
        <SelectTrigger className="w-[80px]">
          <SelectValue placeholder="HH" />
        </SelectTrigger>
        <SelectContent className="max-h-[200px]">
          {hourOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <span className="flex items-center text-gray-500 font-semibold">:</span>
      <Select value={minutes} onValueChange={handleMinutesChange}>
        <SelectTrigger className="w-[80px]">
          <SelectValue placeholder="MM" />
        </SelectTrigger>
        <SelectContent className="max-h-[200px]">
          {minuteOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

interface MaintenanceSchedule {
  id: string;
  startTime: string;
  endTime: string;
  duration: number;
  message?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export function AdminMaintenanceManager({ currentAdmin }: { currentAdmin: any }) {
  const [schedules, setSchedules] = useState<MaintenanceSchedule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    startDate: '',
    startTime: '',
    endDate: '',
    endTime: '',
    duration: '',
    message: ''
  });

  useEffect(() => {
    fetchSchedules();
  }, []);

  const fetchSchedules = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/maintenance', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setSchedules(data.schedules || []);
      } else {
        setError('Failed to fetch maintenance schedules');
      }
    } catch (err) {
      console.error('Error fetching schedules:', err);
      setError('Failed to fetch maintenance schedules');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Auto-calculate duration if both start and end date/time are provided
    if (field === 'startDate' || field === 'startTime' || field === 'endDate' || field === 'endTime') {
      const startDate = formData.startDate;
      const startTime = formData.startTime;
      const endDate = formData.endDate;
      const endTime = formData.endTime;
      
      // Use updated values if they're being changed
      const updatedStartDate = field === 'startDate' ? value : startDate;
      const updatedStartTime = field === 'startTime' ? value : startTime;
      const updatedEndDate = field === 'endDate' ? value : endDate;
      const updatedEndTime = field === 'endTime' ? value : endTime;
      
      if (updatedStartDate && updatedStartTime && updatedEndDate && updatedEndTime) {
        const start = new Date(`${updatedStartDate}T${updatedStartTime}`);
        const end = new Date(`${updatedEndDate}T${updatedEndTime}`);
        if (end > start) {
          const durationMinutes = Math.round((end.getTime() - start.getTime()) / (1000 * 60));
          setFormData(prev => ({ ...prev, duration: durationMinutes.toString() }));
        }
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // Combine date and time into ISO strings
    const startTimeStr = formData.startDate && formData.startTime 
      ? `${formData.startDate}T${formData.startTime}` 
      : '';
    const endTimeStr = formData.endDate && formData.endTime 
      ? `${formData.endDate}T${formData.endTime}` 
      : '';

    // Validation
    if (!formData.startDate || !formData.startTime || !formData.endDate || !formData.endTime) {
      setError('All date and time fields are required');
      return;
    }

    const startTime = new Date(startTimeStr);
    const endTime = new Date(endTimeStr);
    const duration = parseInt(formData.duration);

    if (isNaN(duration) || duration <= 15) {
      setError('Maintenance duration must be greater than 15 minutes');
      return;
    }

    if (startTime <= new Date()) {
      setError('Start time must be in the future');
      return;
    }

    if (endTime <= startTime) {
      setError('End time must be after start time');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/maintenance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
          duration: duration,
          message: formData.message || undefined
        })
      });

      if (response.ok) {
        setSuccess('Maintenance schedule created successfully');
        setFormData({ startDate: '', startTime: '', endDate: '', endTime: '', duration: '', message: '' });
        setShowForm(false);
        fetchSchedules();
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to create maintenance schedule');
      }
    } catch (err) {
      console.error('Error creating schedule:', err);
      setError('Failed to create maintenance schedule');
    }
  };

  const handleCancel = async (scheduleId: string) => {
    if (!confirm('Are you sure you want to cancel this maintenance schedule? The banner will be removed immediately for all users.')) {
      return;
    }

    setCancellingId(scheduleId);
    setError(null);
    setSuccess(null);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/maintenance/${scheduleId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ isActive: false })
      });

      if (response.ok) {
        setSuccess('Maintenance schedule cancelled successfully');
        fetchSchedules();
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to cancel maintenance schedule');
      }
    } catch (err) {
      console.error('Error cancelling schedule:', err);
      setError('Failed to cancel maintenance schedule');
    } finally {
      setCancellingId(null);
    }
  };

  const handleDelete = async (scheduleId: string) => {
    if (!confirm('Are you sure you want to permanently delete this maintenance schedule? This action cannot be undone.')) {
      return;
    }

    setDeletingId(scheduleId);
    setError(null);
    setSuccess(null);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/maintenance/${scheduleId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        setSuccess('Maintenance schedule deleted successfully');
        fetchSchedules();
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to delete maintenance schedule');
      }
    } catch (err) {
      console.error('Error deleting schedule:', err);
      setError('Failed to delete maintenance schedule');
    } finally {
      setDeletingId(null);
    }
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short'
    });
  };

  const getTimeUntil = (dateString: string) => {
    const now = new Date();
    const target = new Date(dateString);
    const diff = target.getTime() - now.getTime();
    
    if (diff <= 0) return 'Past';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Maintenance Schedules</h2>
          <p className="text-sm text-gray-600 mt-1">
            Manage planned maintenance windows. Users will be notified 24 hours in advance.
          </p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="h-4 w-4 mr-2" />
          Schedule Maintenance
        </Button>
      </div>

      {error && (
        <Alert className="bg-red-50 border-red-200">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="bg-green-50 border-green-200">
          <AlertDescription className="text-green-800">{success}</AlertDescription>
        </Alert>
      )}

      {showForm && (
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Create Maintenance Schedule</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startDate">Start Date *</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => handleInputChange('startDate', e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="startTime">Start Time *</Label>
                <TimePicker
                  value={formData.startTime}
                  onChange={(value) => handleInputChange('startTime', value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="endDate">End Date *</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => handleInputChange('endDate', e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="endTime">End Time *</Label>
                <TimePicker
                  value={formData.endTime}
                  onChange={(value) => handleInputChange('endTime', value)}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="duration">Duration (minutes) *</Label>
              <Input
                id="duration"
                type="number"
                min="16"
                value={formData.duration}
                onChange={(e) => setFormData(prev => ({ ...prev, duration: e.target.value }))}
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Must be greater than 15 minutes. Auto-calculated from start/end times.
              </p>
            </div>
            <div>
              <Label htmlFor="message">Message (optional)</Label>
              <Textarea
                id="message"
                value={formData.message}
                onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                placeholder="Custom message to display to users..."
                rows={3}
              />
            </div>
            <div className="flex gap-2">
              <Button type="submit">Create Schedule</Button>
              <Button type="button" variant="outline" onClick={() => {
                setShowForm(false);
                setFormData({ startDate: '', startTime: '', endDate: '', endTime: '', duration: '', message: '' });
                setError(null);
              }}>
                Cancel
              </Button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Start Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Duration
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Time Until
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Message
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {schedules.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    No maintenance schedules found. Create one to get started.
                  </td>
                </tr>
              ) : (
                schedules.map((schedule) => (
                  <tr key={schedule.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {formatDateTime(schedule.startTime)}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-900">{schedule.duration} minutes</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">{getTimeUntil(schedule.startTime)}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        schedule.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {schedule.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-600">
                        {schedule.message || 'No custom message'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {schedule.isActive && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCancel(schedule.id)}
                            disabled={cancellingId === schedule.id}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Ban className="h-4 w-4 mr-1" />
                            {cancellingId === schedule.id ? 'Cancelling...' : 'Cancel'}
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(schedule.id)}
                          disabled={deletingId === schedule.id}
                          className="text-gray-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          {deletingId === schedule.id ? 'Deleting...' : 'Delete'}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

