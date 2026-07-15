// src/app/(dashboard)/bookings/page.tsx
'use client';

import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command';

import {
  Calendar,
  Car,
  User,
  Edit,
  Trash2,
  Plus,
  Check,
  ChevronsUpDown,
  List,
  Grid3x3,
  Search,
  Eye,
  Loader,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import useSWR, { mutate } from 'swr';
import { fetcher } from '@/lib/api';
import { toast } from 'sonner';

const PAGE_SIZE = 9;

export default function AdminBookingsPage() {
  const { data: bookingsRes, error: bError, isLoading: bLoading } = useSWR<any>('/bookings/admin/all', fetcher);
  const { data: vehiclesRes, error: vError, isLoading: vLoading } = useSWR<any>('/vehicles', fetcher);
  const { data: usersRes, error: uError, isLoading: uLoading } = useSWR<any>('/users/all', fetcher);
  const { data: meRes } = useSWR<any>('/users/me', fetcher);


  const bookings = bookingsRes?.data || [];
  const vehicles = vehiclesRes?.data || vehiclesRes || [];
  const users = usersRes?.data || [];
  const isSuperAdmin = meRes?.role === 'superadmin';

  const [viewMode, setViewMode] = useState<'card' | 'list'>('card');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  let disableSaveButton: boolean = false;

  const [form, setForm] = useState({
    userId: '',
    vehicleId: '',
    startDate: '',
    endDate: '',
    deposit: '0.00',
    balance: '0.00',
    driverLicense: '',
    pickupLocation: '',
    locationType: 'in-town',
    totalPrice: '0.00'
  });

  // Picker states
  const [vehicleOpen, setVehicleOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const [creatingUser, setCreatingUser] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // ← NEW: status filter
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [bookingToDelete, setBookingToDelete] = useState<any>(null);


  // Combined filter: search + status
  const filtered = useMemo(() => {
    let list = bookings;

    // Search filter
    if (search) {
      const lower = search.toLowerCase();
      list = list.filter((b: any) =>
        b.bookingRef?.toLowerCase().includes(lower) ||
        b.user?.name?.toLowerCase().includes(lower) ||
        b.user?.email?.toLowerCase().includes(lower) ||
        b.vehicle?.make?.toLowerCase().includes(lower) ||
        b.vehicle?.model?.toLowerCase().includes(lower)
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      if (statusFilter === 'paid') {
        list = list.filter((b: any) => b.paymentStatus === 'paid');
      } else {
        list = list.filter((b: any) => b.status === statusFilter);
      }
    }

    return list;
  }, [bookings, search, statusFilter]);

  //pagination
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginatedBookings = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, currentPage]);


  // Resolves the day/half-day rate for a vehicle given membership + location type.
  // Falls back progressively: member rate -> regular rate -> in-town rate -> half of day rate.
  const getVehicleRate = (vehicle: any, isMember: boolean, locationType: string, isHalfDay: boolean) => {
    const pick = (memberVal: number, regularVal: number) => (isMember && memberVal > 0 ? memberVal : regularVal);
    const dayInTown = pick(vehicle.pricePerDayMember || 0, vehicle.pricePerDay || 0);
    const dayOutOfTown = pick(vehicle.pricePerDayMemberOutOfTown || 0, vehicle.pricePerDayOutOfTown || 0) || dayInTown;
    const halfDayInTown = pick(vehicle.pricePerHalfDayMember || 0, vehicle.pricePerHalfDay || 0) || dayInTown / 2;
    const halfDayOutOfTown = pick(vehicle.pricePerHalfDayMemberOutOfTown || 0, vehicle.pricePerHalfDayOutOfTown || 0) || dayOutOfTown / 2;

    const dayRate = locationType === 'out-of-town' ? dayOutOfTown : dayInTown;
    const halfDayRate = locationType === 'out-of-town' ? halfDayOutOfTown : halfDayInTown;
    return isHalfDay ? halfDayRate : dayRate;
  };

  // Bookings <=12h are charged the half-day rate; anything longer rounds up to full days.
  const calculateBookingTotal = (vehicleId: string, userId: string, startDate: string, endDate: string, locationType: string) => {
    if (!vehicleId || !startDate || !endDate) return null;
    const vehicle = vehicles.find((v: any) => v._id === vehicleId);
    if (!vehicle) return null;

    const hours = (new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60);
    if (hours <= 0) return null;

    const isHalfDay = hours <= 12;
    const days = isHalfDay ? 1 : Math.max(1, Math.ceil(hours / 24));
    const isMember = !!users.find((u: any) => u._id === userId)?.isMember;
    const rate = getVehicleRate(vehicle, isMember, locationType, isHalfDay);
    const totalPrice = isHalfDay ? rate : days * rate;

    return { vehicle, isMember, isHalfDay, days, rate, totalPrice };
  };

  const bookingCalc = calculateBookingTotal(form.vehicleId, form.userId, form.startDate, form.endDate, form.locationType);

  const openCreateModal = () => {
    setEditing(null);
    setForm({
      userId: '',
      vehicleId: '',
      startDate: '',
      endDate: '',
      deposit: '0.00',
      balance: '0.00',
      driverLicense: '',
      pickupLocation: '',
      locationType: 'in-town',
      totalPrice: '0.00'
    });
    setCreatingUser(false);
    setOpen(true);
  };

  const isLocked = (booking: any) => !isSuperAdmin && (booking.status === 'confirmed' || booking.status === 'completed');

  const openEditModal = (booking: any) => {
    if (isLocked(booking)) return;
    setEditing(booking);
    console.log('booking to edit:');
    console.log(booking)
    setForm({
      userId: booking.user?._id || '',
      vehicleId: booking.vehicle?._id || '',
      startDate: booking.startDate.slice(0, 16),
      endDate: booking.endDate.slice(0, 16),
      deposit: booking.deposit.toString(),
      balance: booking.balance.toString(),
      driverLicense: booking.driversLicense || '',
      pickupLocation: booking.pickupLocation || '',
      locationType: booking.locationType || 'in-town',
      totalPrice: booking.totalPrice.toString(),
    });
    setCreatingUser(false);
    setOpen(true);
  };

  const openDeleteModal = (booking: any) => {
    if (isLocked(booking)) return;
    setBookingToDelete(booking);
    setDeleteModalOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.userId || !form.vehicleId || !form.startDate || !form.endDate) {
      toast.error('Please fill all required fields');
      return;
    }

    const vehicle = vehicles.find((v: any) => v._id === form.vehicleId);
    if (!vehicle) {
      toast.error('Vehicle not found');
      return;
    }

    const conflict = bookings.find((b: any) =>
      b.vehicle?._id === form.vehicleId &&
      b._id !== editing?._id &&
      b.status !== 'cancelled' &&
      new Date(b.startDate) < new Date(form.endDate) &&
      new Date(b.endDate) > new Date(form.startDate)
    );

    if (conflict) {
      toast.error('This vehicle is already booked during the selected dates');
      return;
    }

    const calc = calculateBookingTotal(form.vehicleId, form.userId, form.startDate, form.endDate, form.locationType);
    if (!calc) {
      toast.error('End date must be after start date');
      return;
    }
    const totalPrice = calc.totalPrice;

    const payload = {
      user: form.userId,
      vehicle: form.vehicleId,
      startDate: new Date(form.startDate).toISOString(),
      endDate: new Date(form.endDate).toISOString(),
      deposit: parseFloat(form.deposit) || 0,
      balance: totalPrice - (parseFloat(form.deposit) || 0),
      driversLicense: form.driverLicense,
      pickupLocation: form.pickupLocation,
      locationType: form.locationType,
      totalPrice: totalPrice,
    };

    try {
      const url = editing
        ? `${process.env.NEXT_PUBLIC_API_URL}/bookings/admin/${editing._id}`
        : `${process.env.NEXT_PUBLIC_API_URL}/bookings/admin`;

      const res = await fetch(url, {
        method: editing ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(payload),
      });

      //Handle Response base on return HTTP code
      const result = await res.json();

      if (result.success === false) {
        toast.error(result.message || 'Failed to save booking');
        console.error('Error response:', result);
      }
      else {
        toast.success(editing ? 'Booking updated!' : 'Booking created!');
      }

      mutate('/bookings/admin/all');
      setOpen(false);

    } catch (err) {
      toast.error('Network error');
    }
  };

  const handleCreateUser = async () => {
    if (!newUserName || !newUserEmail) {
      toast.error('Name and email required');
      return;
    }

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newUserName,
          email: newUserEmail,
          password: 'temp123456',
          phone: '',
        }),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success(`User ${newUserName} created!`);
        setForm({ ...form, userId: data.user.id });
        mutate('/users');
        setCreatingUser(false);
        setNewUserName('');
        setNewUserEmail('');
      } else {
        toast.error(data.message || 'Failed to create user');
      }
    } catch {
      toast.error('Network error');
    }
  };

  if (bLoading) return <div className="text-center py-20 "><Loader className="animate-spin flex w-6 h-6 mx-auto" />Loading bookings...</div>;
  if (vLoading || uLoading) return <div className="text-center py-20">Loading support data...</div>
  if (bError || vError || uError) return <div className="text-center py-20 text-red-600">Failed to load bookings</div>;

  const formatDate = (d: string) => new Date(d).toLocaleDateString('en-ZA');

  const handleDeleteBooking = async () => {
    if (!bookingToDelete) return;

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/bookings/admin/${bookingToDelete._id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      const result = await res.json();

      if (result.success === false) {
        toast.error(result.message || 'Failed to delete booking');
      } else {
        toast.success('Booking deleted successfully!');
        mutate('/bookings/admin/all');
      }
    } catch (err) {
      toast.error('Network error');
    } finally {
      setDeleteModalOpen(false);
      setBookingToDelete(null);
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-xl font-semibold text-blue-900 dark:text-slate-400">Bookings ({filtered.length})</h1>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              placeholder="Search by ref, customer, vehicle..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 w-96"
            />
          </div>
          {/* Status Filter */}
          <Select value={statusFilter} onValueChange={(val) => {
            setStatusFilter(val);
            setCurrentPage(1);
          }}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Bookings</SelectItem>
              <SelectItem value="pending">Awaiting Approval</SelectItem>
              <SelectItem value="confirmed">Confirmed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
            </SelectContent>
          </Select>
          {/* View Toggle */}
          <div className="flex rounded-lg ">
            <Button
              variant={viewMode === 'card' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('card')}
              className="mr-1.5 rounded-md"
            >
              <Grid3x3 className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="rounded-md"
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
          <Button className="flex items-center" onClick={openCreateModal}>
            <Plus className="w-5 h-5 mr-2" />
            New Booking
          </Button>
        </div>

      </div>

      {/* Bookings List */}
      {/* CARD VIEW */}
      {viewMode === 'card' && (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {paginatedBookings.map((b: any) => (
            <Card key={b._id} className="group overflow-hidden transition-all hover:shadow-md hover:border-gray-300 dark:hover:border-slate-600">
              <div className="p-5">
                {/* Header: ref + customer, status badges */}
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="min-w-0">
                    <p className="text-xs font-mono text-gray-500 dark:text-slate-400 mb-0.5">#{b.bookingRef}</p>
                    <p className="font-semibold truncate">{b.user?.name || 'N/A'}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <Badge variant={b.status === 'confirmed' ? 'success' : b.status === 'cancelled' ? 'destructive' : 'outline'} className="capitalize">
                      {b.status}
                    </Badge>
                    <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${b.paymentStatus === 'paid' ? 'text-green-600 dark:text-green-400' : 'text-amber-600 dark:text-amber-400'}`}>
                      <span className="w-1.5 h-1.5 rounded-full bg-current" />
                      {b.paymentStatus === 'paid' ? 'Paid' : 'Payment pending'}
                    </span>
                  </div>
                </div>

                {/* Details */}
                <div className="space-y-2 text-sm text-gray-600 dark:text-slate-300">
                  <div className="flex items-center gap-2">
                    <Car className="w-4 h-4 text-gray-400 dark:text-slate-500 shrink-0" />
                    <span className="truncate">{b.vehicle?.make} {b.vehicle?.model}</span>
                    <span className="ml-auto font-mono text-xs px-1.5 py-0.5 rounded bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-300">
                      {b.vehicle?.licensePlate}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-400 dark:text-slate-500 shrink-0" />
                    <span>{formatDate(b.startDate)} → {formatDate(b.endDate)}</span>
                  </div>
                </div>
              </div>

              {/* Footer: price + actions */}
              <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 dark:border-slate-700 bg-gray-50/60 dark:bg-slate-900/30">
                <p className="text-lg font-bold">
                  <span className="text-xs font-medium text-gray-500 dark:text-slate-400 mr-1">SBD</span>
                  {Number(b.totalPrice).toLocaleString()}
                </p>
                <div className="flex gap-1">
                  <Button size="sm" variant="ghost" title="View" onClick={() => window.location.href = `/bookings/${b._id}`}>
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    title={isLocked(b) ? `${b.status === 'confirmed' ? 'Confirmed' : 'Completed'} bookings can't be edited` : 'Edit'}
                    disabled={isLocked(b)}
                    onClick={() => openEditModal(b)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    title={isLocked(b) ? `${b.status === 'confirmed' ? 'Confirmed' : 'Completed'} bookings can't be deleted` : 'Delete'}
                    disabled={isLocked(b)}
                    className="text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                    onClick={() => openDeleteModal(b)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* LIST VIEW */}
      {viewMode === 'list' && (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-gray-200 dark:border-slate-700 bg-gray-50/60 dark:bg-slate-900/30">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-slate-400">Ref</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-slate-400">Customer</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-slate-400">Vehicle</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-slate-400">Dates</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-slate-400">Amount</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-slate-400">Status</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-slate-400">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedBookings.map((b: any) => (
                  <tr key={b._id} className="border-b border-gray-100 dark:border-slate-700 last:border-0 hover:bg-gray-50 dark:hover:bg-slate-700/40 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-gray-500 dark:text-slate-400">#{b.bookingRef}</td>
                    <td className="px-4 py-3 font-medium">{b.user?.name || 'N/A'}</td>
                    <td className="px-4 py-3">
                      {b.vehicle?.make} {b.vehicle?.model}{' '}
                      <span className="font-mono text-xs px-1.5 py-0.5 rounded bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-300">{b.vehicle?.licensePlate}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-slate-300">
                      {formatDate(b.startDate)} → {formatDate(b.endDate)}
                    </td>
                    <td className="px-4 py-3 font-semibold">SBD{Number(b.totalPrice).toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <Badge variant={b.paymentStatus === 'paid' ? 'success' : 'secondary'} className="capitalize">
                        {b.paymentStatus}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1">
                        <Button size="sm" variant="ghost" title="View" onClick={() => window.location.href = `/bookings/${b._id}`}>
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          title={isLocked(b) ? `${b.status === 'confirmed' ? 'Confirmed' : 'Completed'} bookings can't be edited` : 'Edit'}
                          disabled={isLocked(b)}
                          onClick={() => openEditModal(b)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          title={isLocked(b) ? `${b.status === 'confirmed' ? 'Confirmed' : 'Completed'} bookings can't be deleted` : 'Delete'}
                          disabled={isLocked(b)}
                          className="text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                          onClick={() => openDeleteModal(b)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-4 mt-12">
          <Button
            variant="outline"
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="w-5 h-5 mr-1" />
          </Button>

          <span className="text-sm font-medium">
            Page {currentPage} of {totalPages}
          </span>

          <Button
            variant="outline"
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
          >
            <ChevronRight className="w-5 h-5 ml-1" />
          </Button>
        </div>
      )}

      {/* Create/Edit Modal */}
<Dialog open={open} onOpenChange={setOpen}>
  <DialogContent className="max-w-7xl">
    <DialogHeader>
      <DialogTitle>{editing ? 'Edit' : 'Create'} Booking</DialogTitle>
    </DialogHeader>

    <div className="py-4">
      {/* Two-column layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Vehicle Picker */}
          <div>
            <Label>Vehicle</Label>
            <Popover open={vehicleOpen} onOpenChange={setVehicleOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" role="combobox" className="w-full flex justify-between">
                  {form.vehicleId
                    ? `${vehicles.find((v: any) => v._id === form.vehicleId)?.make} ${vehicles.find((v: any) => v._id === form.vehicleId)?.model}`
                    : 'Select vehicle...'}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0">
                <Command>
                  <CommandInput placeholder="Search vehicles..." />
                  <CommandEmpty>No vehicle found.</CommandEmpty>
                  <CommandGroup>
                    {vehicles.map((v: any) => (
                      <CommandItem
                        key={v._id}
                        onSelect={() => {
                          setForm({ ...form, vehicleId: v._id });
                          setVehicleOpen(false);
                        }}
                      >
                        <Check
                          className={`mr-2 h-4 w-4 ${form.vehicleId === v._id ? 'opacity-100' : 'opacity-0'}`}
                        />
                        {v.make} {v.model} • {v.licensePlate}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {/* Customer Picker */}
          <div>
            <Label>Customer</Label>
            <Popover open={userOpen} onOpenChange={setUserOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" role="combobox" className="w-full flex justify-between">
                  {form.userId
                    ? users.find((u: any) => u._id === form.userId)?.name || 'Select user...'
                    : 'Select or create customer...'}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0">
                <Command>
                  <CommandInput placeholder="Search users..." />
                  <CommandEmpty>
                    {/* Your create user UI */}
                  </CommandEmpty>
                  <CommandGroup>
                    {users.map((u: any) => (
                      <CommandItem
                        key={u._id}
                        onSelect={() => {
                          setForm({ ...form, userId: u._id });
                          setUserOpen(false);
                        }}
                      >
                        <Check
                          className={`mr-2 h-4 w-4 ${form.userId === u._id ? 'opacity-100' : 'opacity-0'}`}
                        />
                        {u.name} • {u.email}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {/* Driver License */}
          <div>
            <Label>Driver License Number</Label>
            <Input
              type="text"
              placeholder="e.g. DL123456"
              value={form.driverLicense || ''}
              onChange={(e) => setForm({ ...form, driverLicense: e.target.value })}
              required
            />
            <p className="text-sm text-gray-500 mt-1">
              Required for booking confirmation
            </p>
          </div>

          {/* Pickup Location */}
          <div>
            <Label>Pickup Location</Label>
            <Input
              type="text"
              placeholder="e.g. Honiara International Airport, Hotel Name, or Address"
              value={form.pickupLocation || ''}
              onChange={(e) => setForm({ ...form, pickupLocation: e.target.value })}
              required
            />
            <p className="text-sm text-gray-500 mt-1">
              Where the customer will pick up the vehicle
            </p>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Start Date & Time</Label>
              <Input
                type="datetime-local"
                value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
              />
            </div>
            <div>
              <Label>End Date & Time</Label>
              <Input
                type="datetime-local"
                value={form.endDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
              />
            </div>
          </div>

          {/* Location Type */}
          <div>
            <Label>Rental Zone</Label>
            <Select value={form.locationType} onValueChange={(v) => setForm({ ...form, locationType: v })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="in-town">In Town</SelectItem>
                <SelectItem value="out-of-town">Out of Town</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-gray-500 mt-1">Determines which rate applies</p>
          </div>

          {/* Deposit */}
          <div>
            <Label>Deposit Amount (SBD)</Label>
            <Input
              type="number"
              placeholder="0"
              value={form.deposit || ''}
              onChange={(e) => setForm({ ...form, deposit: e.target.value })}
              min="0"
              step="50"
            />
            <p className="text-sm text-gray-500 mt-1">Amount customer pays upfront</p>
          </div>

          {/* Total Price */}
          <div className="rounded-lg bg-blue-50 p-4 border border-blue-200">
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold text-blue-900">Total Price</span>
              <span className="text-3xl font-bold text-blue-700">
                SBD{(bookingCalc?.totalPrice || 0).toLocaleString()}
              </span>
            </div>

            {bookingCalc && (
              <>
                <p className="text-sm mt-2 dark:text-blue-900">
                  {form.locationType === 'out-of-town' ? 'Out of town' : 'In town'}
                  {bookingCalc.isMember ? ' member rate' : ' regular rate'} applied: SBD{bookingCalc.rate.toLocaleString()}
                  {bookingCalc.isHalfDay ? '/half-day' : '/day'}
                </p>
                <p className="text-sm text-blue-600 mt-1">
                  {bookingCalc.isHalfDay
                    ? `Half-day rate (12h or less)`
                    : `${bookingCalc.days} day${bookingCalc.days > 1 ? 's' : ''} × SBD${bookingCalc.rate.toLocaleString()}/day`}
                </p>
              </>
            )}
          </div>

        </div>
      </div>

      {/* Availability message - full width below columns */}
      {form.vehicleId && form.startDate && form.endDate && (
        <div className="mt-6 p-4 rounded-lg border">
          {(() => {
            const selectedVehicle = vehicles.find((v: any) => v._id === form.vehicleId);
            if (!selectedVehicle) return null;

            const start = new Date(form.startDate);
            const end = new Date(form.endDate);

            const conflict = bookings.find((b: any) =>
              b.vehicle?._id === form.vehicleId &&
              b._id !== editing?._id &&
              b.status !== 'cancelled' &&
              new Date(b.startDate) < end &&
              new Date(b.endDate) > start
            );

            const disableSaveButton = !!conflict;

            if (conflict) {
              return (
                <div className="flex items-start gap-3 text-red-600">
                  <XCircle className="w-6 h-6 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold">Vehicle Unavailable</p>
                    <p className="text-sm">
                      This vehicle is already booked from{' '}
                      {new Date(conflict.startDate).toLocaleDateString()} to{' '}
                      {new Date(conflict.endDate).toLocaleDateString()}.
                    </p>
                    <p className="text-sm mt-1">
                      Booking Ref: #{conflict.bookingRef}
                    </p>
                  </div>
                </div>
              );
            }

            return (
              <div className="flex items-center gap-3 text-green-600">
                <CheckCircle2 className="w-6 h-6 shrink-0" />
                <p className="font-semibold">Vehicle Available!</p>
              </div>
            );
          })()}
        </div>
      )}
    </div>

    <DialogFooter>
      <Button variant="outline" onClick={() => setOpen(false)}>
        Cancel
      </Button>
      <Button
        onClick={handleSubmit}
        disabled={disableSaveButton}
      >
        Save Booking
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-red-600">
              <AlertTriangle className="w-6 h-6" />
              Delete Booking?
            </DialogTitle>
          </DialogHeader>
          <div className="py-6">
            <p className="text-lg">Are you sure you want to delete this booking?</p>
            {bookingToDelete && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <p className="font-mono text-lg">#{bookingToDelete.bookingRef}</p>
                <p className="text-gray-600">
                  <User className="inline w-4 h-4" /> {bookingToDelete.user?.name || 'N/A'}
                </p>
                <p className="text-gray-600">
                  <Car className="inline w-4 h-4" /> {bookingToDelete.vehicle?.make} {bookingToDelete.vehicle?.model}
                </p>
                <p className="text-gray-600">
                  <Calendar className="inline w-4 h-4" /> {formatDate(bookingToDelete.startDate)} → {formatDate(bookingToDelete.endDate)}
                </p>
                <p className="text-xl font-bold mt-2">SBD{bookingToDelete.totalPrice}</p>
              </div>
            )}
            <p className="text-sm text-red-600 mt-4 font-medium">
              This action cannot be undone.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteBooking}>
              Yes, Delete Booking
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}