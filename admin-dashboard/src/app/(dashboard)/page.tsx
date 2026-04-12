'use client';

import { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  CalendarIcon,
  Download,
  DollarSign,
  Car,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Loader,
} from 'lucide-react';
import { format, subDays } from 'date-fns';
import useSWR from 'swr';
import { fetcher } from '@/lib/api';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

export default function DashboardPage() {
  const today = new Date();
  const [dateRange, setDateRange] = useState({
    start: format(subDays(today, 30), 'yyyy-MM-dd'),
    end: format(today, 'yyyy-MM-dd'),
  });

  const { data: stats, error, isLoading } = useSWR<any>(
    `/reports/dashboard?start=${dateRange.start}&end=${dateRange.end}`,
    fetcher
  );

  // Chart data preparation
  const revenueData = useMemo(() => {
    return stats?.data.dailyRevenue?.map((item: any) => ({
      date: format(new Date(item.date), 'MMM dd'),
      revenue: item.amount,
    })) || [];
  }, [stats]);

  const bookingsByStatus = useMemo(() => {
    return stats?.data.bookingsByStatus
      ? Object.entries(stats.data.bookingsByStatus).map(([status, count]) => ({
          name: status.charAt(0).toUpperCase() + status.slice(1),
          value: count,
        }))
      : [];
  }, [stats]);

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDateRange((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const exportToExcel = () => {
    if (!stats) return toast.error('No data to export');

    const wb = XLSX.utils.book_new();

    // Summary sheet
    const summaryData = [
      ['Metric', 'Value'],
      ['Total Revenue', `SBD${stats.data.totalRevenue?.toLocaleString() || '0'}`],
      ["Today's Revenue", `SBD${stats.data.todayRevenue?.toLocaleString() || '0'}`],
      ['Total Bookings', stats.data.totalBookings || 0],
      ['Active Vehicles', stats.data.activeVehicles || 0],
      ['Pending Bookings', stats.data.pendingBookings || 0],
      ['Paid Bookings', stats.data.paidBookings || 0],
      ['Bookings Need Approval', stats.data.bookingsNeedApproval || 0],
      ['Date Range', `${dateRange.start} to ${dateRange.end}`],
    ];
    const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary');

    // Daily revenue
    if (revenueData.length > 0) {
      const revenueSheet = XLSX.utils.json_to_sheet(revenueData);
      XLSX.utils.book_append_sheet(wb, revenueSheet, 'Daily Revenue');
    }

    XLSX.writeFile(wb, `dashboard-report-${format(today, 'yyyy-MM-dd')}.xlsx`);
    toast.success('Report exported to Excel');
  };

  if (isLoading) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[60vh]">
        <Loader className="w-10 h-10 animate-spin text-blue-600 mb-4" />
        <p className="text-gray-600 dark:text-slate-400">Loading dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center text-red-600 dark:text-red-400">
        Failed to load dashboard data. Please try again.
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8">
      {/* Header + Date Filter */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Dashboard</h1>
          <p className="text-gray-600 dark:text-slate-400 mt-1">
            {format(new Date(dateRange.start), 'MMM dd, yyyy')} –{' '}
            {format(new Date(dateRange.end), 'MMM dd, yyyy')}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 items-end">
          <div className="grid grid-cols-2 gap-4 w-full sm:w-auto">
            <div>
              <Label htmlFor="start" className="text-gray-700 dark:text-slate-300">Start Date</Label>
              <Input
                id="start"
                type="date"
                name="start"
                value={dateRange.start}
                onChange={handleDateChange}
                max={dateRange.end}
                className="mt-1 bg-white dark:bg-slate-800 border-gray-300 dark:border-slate-600 text-gray-900 dark:text-white dark:text-slate-200"
              />
            </div>
            <div>
              <Label htmlFor="end" className="text-gray-700 dark:text-slate-300">End Date</Label>
              <Input
                id="end"
                type="date"
                name="end"
                value={dateRange.end}
                onChange={handleDateChange}
                min={dateRange.start}
                max={format(today, 'yyyy-MM-dd')}
                className="mt-1 bg-white dark:bg-slate-800 border-gray-300 dark:border-slate-600 text-gray-900 dark:text-white"
              />
            </div>
          </div>

          <Button onClick={exportToExcel} variant="default" className="flex w-full sm:w-auto">
            <Download className="w-4 h-4 mr-2 mt-1" />
            Export Excel
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Cards remain the same structure, Card component now handles dark mode */}
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-slate-400">Total Revenue</p>
              <p className="text-3xl font-bold mt-2 text-gray-900 dark:text-white">
                SBD{stats?.data.totalRevenue?.toLocaleString() || '0'}
              </p>
            </div>
            <DollarSign className="w-10 h-10 text-green-600 opacity-20" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-slate-400">Today's Revenue</p>
              <p className="text-3xl font-bold mt-2 text-gray-900 dark:text-white">
                SBD{stats?.data.todayRevenue?.toLocaleString() || '0'}
              </p>
            </div>
            <TrendingUp className="w-10 h-10 text-blue-600 opacity-20" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-slate-400">Total Bookings</p>
              <p className="text-3xl font-bold mt-2 text-gray-900 dark:text-white">{stats?.totalBookings || 0}</p>
            </div>
            <Calendar className="w-10 h-10 text-purple-600 opacity-20" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-slate-400">Active Vehicles</p>
              <p className="text-3xl font-bold mt-2 text-gray-900 dark:text-white">{stats?.data.activeVehicles || 0}</p>
            </div>
            <Car className="w-10 h-10 text-amber-600 opacity-20" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-slate-400">Pending Bookings</p>
              <p className="text-3xl font-bold mt-2 text-amber-600">
                {stats?.data.pendingBookings || 0}
              </p>
            </div>
            <Clock className="w-10 h-10 text-amber-600 opacity-20" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-slate-400">Paid Bookings</p>
              <p className="text-3xl font-bold mt-2 text-green-600">
                {stats?.paidBookings || 0}
              </p>
            </div>
            <CheckCircle2 className="w-10 h-10 text-green-600 opacity-20" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-slate-400">Need Approval</p>
              <p className="text-3xl font-bold mt-2 text-red-600">
                {stats?.data.bookingsNeedApproval || 0}
              </p>
            </div>
            <AlertCircle className="w-10 h-10 text-red-600 opacity-20" />
          </div>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Revenue Over Time */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Revenue Over Time</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-slate-700" />
                <XAxis dataKey="date" stroke="#6b7280" className="dark:stroke-slate-500" />
                <YAxis stroke="#6b7280" className="dark:stroke-slate-500" />
                <Tooltip
                  formatter={(value: number) => [`SBD${value.toLocaleString()}`, 'Revenue']}
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', color: '#000' }}
                  wrapperStyle={{ outline: 'none' }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Bookings by Status */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Bookings by Status</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={bookingsByStatus}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-slate-700" />
                <XAxis dataKey="name" stroke="#6b7280" className="dark:stroke-slate-500" />
                <YAxis stroke="#6b7280" className="dark:stroke-slate-500" />
                <Tooltip
                  formatter={(value: number) => [`${value} bookings`, 'Count']}
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', color: '#000' }}
                  wrapperStyle={{ outline: 'none' }}
                />
                <Legend />
                <Bar dataKey="value" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
}