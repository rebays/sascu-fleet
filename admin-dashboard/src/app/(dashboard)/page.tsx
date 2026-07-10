'use client';

import { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
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
import { useTheme } from 'next-themes';
import useSWR from 'swr';
import { fetcher } from '@/lib/api';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

// Status hues validated for CVD separation and surface contrast in both modes
const STATUS_COLORS: Record<string, { light: string; dark: string }> = {
  pending: { light: '#f59e0b', dark: '#d97706' },
  confirmed: { light: '#16a34a', dark: '#16a34a' },
  completed: { light: '#2563eb', dark: '#3b82f6' },
  cancelled: { light: '#dc2626', dark: '#ef4444' },
};
const STATUS_ORDER = ['pending', 'confirmed', 'completed', 'cancelled'];

const TINT_CLASSES: Record<string, string> = {
  green: 'bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400',
  blue: 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
  purple: 'bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
  indigo: 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400',
  amber: 'bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400',
  red: 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400',
};

export default function DashboardPage() {
  const today = new Date();
  const [dateRange, setDateRange] = useState({
    start: format(subDays(today, 30), 'yyyy-MM-dd'),
    end: format(today, 'yyyy-MM-dd'),
  });

  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  const chart = {
    grid: isDark ? '#334155' : '#e5e7eb',
    tick: isDark ? '#94a3b8' : '#6b7280',
    line: isDark ? '#3b82f6' : '#2563eb',
    surface: isDark ? '#1e293b' : '#ffffff',
    tooltipBorder: isDark ? '#334155' : '#e5e7eb',
    ink: isDark ? '#f1f5f9' : '#111827',
    cursor: isDark ? 'rgba(148,163,184,0.08)' : 'rgba(107,114,128,0.06)',
  };

  const tooltipStyle = {
    backgroundColor: chart.surface,
    border: `1px solid ${chart.tooltipBorder}`,
    borderRadius: 8,
    color: chart.ink,
    fontSize: 13,
  };

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
      ? Object.entries(stats.data.bookingsByStatus)
          .sort(([a], [b]) => STATUS_ORDER.indexOf(a) - STATUS_ORDER.indexOf(b))
          .map(([status, count]) => ({
            status,
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

  const statCards = [
    { label: 'Total revenue', value: `SBD${stats?.data.totalRevenue?.toLocaleString() || '0'}`, icon: DollarSign, tint: 'green' },
    { label: "Today's revenue", value: `SBD${stats?.data.todayRevenue?.toLocaleString() || '0'}`, icon: TrendingUp, tint: 'blue' },
    { label: 'Total bookings', value: stats?.data.totalBookings || 0, icon: Calendar, tint: 'purple' },
    { label: 'Active vehicles', value: stats?.data.activeVehicles || 0, icon: Car, tint: 'indigo' },
    { label: 'Pending bookings', value: stats?.data.pendingBookings || 0, icon: Clock, tint: 'amber' },
    { label: 'Paid bookings', value: stats?.data.paidBookings || 0, icon: CheckCircle2, tint: 'green' },
    { label: 'Need approval', value: stats?.data.bookingsNeedApproval || 0, icon: AlertCircle, tint: 'red' },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header + Toolbar */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-xl font-semibold text-blue-900 dark:text-slate-400">Dashboard</h1>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">
            {format(new Date(dateRange.start), 'MMM dd, yyyy')} –{' '}
            {format(new Date(dateRange.end), 'MMM dd, yyyy')}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Input
              aria-label="Start date"
              type="date"
              name="start"
              value={dateRange.start}
              onChange={handleDateChange}
              max={dateRange.end}
              className="w-40"
            />
            <span className="text-gray-400 dark:text-slate-500">–</span>
            <Input
              aria-label="End date"
              type="date"
              name="end"
              value={dateRange.end}
              onChange={handleDateChange}
              min={dateRange.start}
              max={format(today, 'yyyy-MM-dd')}
              className="w-40"
            />
          </div>

          <Button onClick={exportToExcel} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export Excel
          </Button>
        </div>
      </div>

      {/* Stat tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {statCards.map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.label} className="p-5">
              <div className="flex items-center gap-4">
                <div className={`flex items-center justify-center w-10 h-10 rounded-lg shrink-0 ${TINT_CLASSES[s.tint]}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm text-gray-500 dark:text-slate-400 truncate">{s.label}</p>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-white truncate">{s.value}</p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Revenue Over Time */}
        <Card className="p-5">
          <div className="mb-4">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">Revenue over time</h3>
            <p className="text-xs text-gray-500 dark:text-slate-400">Daily revenue (SBD) for the selected period</p>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={revenueData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke={chart.grid} />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 12, fill: chart.tick }}
                  dy={8}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 12, fill: chart.tick }}
                  tickFormatter={(v: number) => v.toLocaleString()}
                  width={56}
                />
                <Tooltip
                  formatter={(value: number) => [`SBD${value.toLocaleString()}`, 'Revenue']}
                  contentStyle={tooltipStyle}
                  wrapperStyle={{ outline: 'none' }}
                />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke={chart.line}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 5, strokeWidth: 2, stroke: chart.surface }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Bookings by Status */}
        <Card className="p-5">
          <div className="mb-4">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">Bookings by status</h3>
            <p className="text-xs text-gray-500 dark:text-slate-400">Booking count per status in the selected period</p>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={bookingsByStatus} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke={chart.grid} />
                <XAxis
                  dataKey="name"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 12, fill: chart.tick }}
                  dy={8}
                />
                <YAxis
                  allowDecimals={false}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 12, fill: chart.tick }}
                  width={40}
                />
                <Tooltip
                  formatter={(value: number) => [`${value} booking${value === 1 ? '' : 's'}`, 'Count']}
                  cursor={{ fill: chart.cursor }}
                  contentStyle={tooltipStyle}
                  wrapperStyle={{ outline: 'none' }}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={24}>
                  {bookingsByStatus.map((entry: any) => (
                    <Cell
                      key={entry.status}
                      fill={(STATUS_COLORS[entry.status] || STATUS_COLORS.pending)[isDark ? 'dark' : 'light']}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
}
