'use client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar, Car, User, Mail, Phone, DollarSign, FileText, 
  Clock, CheckCircle2, XCircle, Loader, ArrowRight,
  ShieldCheck, CreditCard, MapPin, Info, Download, Trash2, Printer
} from 'lucide-react';
import useSWR, { mutate } from 'swr';
import { fetcher } from '@/lib/api';
import Image from 'next/image';
import { Separator } from '@/components/ui/separator';
import { use, useState, useEffect } from 'react';
import BookingActions from '@/components/BookingActions';
import BookingPrintView from '@/components/BookingPrintView';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@radix-ui/react-label';

export default function BookingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: response, error, isLoading } = useSWR<any>(`/bookings/${id}`, fetcher);
  const { data: bookingPayments } = useSWR<any>(`/bookings/admin/${id}/payments`, fetcher);
  const booking = response?.data;

  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<'confirmed' | 'cancelled' | null>(null);
  const [statusNote, setStatusNote] = useState('');

  const payments = bookingPayments?.data || [];
  const router = useRouter();

  const handleStatusChange = async () => {
    if (!pendingStatus) return;
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/bookings/admin/${booking._id}/status`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
          body: JSON.stringify({
            status: pendingStatus,
            note: statusNote || undefined,
          }),
        }
      );

      if (!res.ok) throw new Error();
      toast.success(`Booking ${pendingStatus === 'confirmed' ? 'approved' : 'rejected'}!`);
      mutate(`/bookings/${booking._id}`);
      mutate(`/bookings/admin/${booking._id}/payments`);
      mutate('/bookings/admin/all');
      setStatusModalOpen(false);
    } catch {
      toast.error('Failed to update status');
    }
  };

  useEffect(() => {
    if (error) {
      const status = (error as any)?.response?.status;
      if (status === 404) {
        toast.error('Booking not found');
        router.push('/bookings');
      }
    }
  }, [error, router]);

  if (isLoading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <Loader className="animate-spin w-10 h-10 text-blue-600" />
      <p className="text-gray-500 font-medium">Fetching booking details...</p>
    </div>
  );

  if (!booking) return null;

  const formatDate = (d: string, short = false) => {
    const options: Intl.DateTimeFormatOptions = short 
      ? { month: 'short', day: 'numeric', year: 'numeric' }
      : { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(d).toLocaleDateString('en-ZA', options);
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'confirmed': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'cancelled': return 'bg-rose-100 text-rose-700 border-rose-200';
      case 'completed': return 'bg-blue-100 text-blue-700 border-blue-200';
      default: return 'bg-amber-100 text-amber-700 border-amber-200';
    }
  };

  return (
    <div className="space-y-8">
      {/* Dashboard View (Hidden during print) */}
      <div className="print:hidden p-4 sm:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
        {/* Premium Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm shadow-blue-100/50">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
                Booking #{booking.bookingRef}
              </h1>
              <Badge className={`${getStatusColor(booking.status)} border px-3 py-1 text-xs font-semibold uppercase tracking-wider`}>
                {booking.status}
              </Badge>
            </div>
            <p className="text-gray-500 dark:text-slate-400 flex items-center gap-2 text-sm">
              <Calendar className="w-4 h-4" /> Received on {formatDate(booking.createdAt, true)}
            </p>
          </div>

          <div className="flex flex-wrap gap-3 transition-all">
            <Button variant="outline" className="gap-2 rounded-xl" onClick={() => window.print()}>
              <Printer className="w-4 h-4" /> Print Document
            </Button>
            {booking.status === 'pending' && (
              <>
                <Button 
                  variant="outline" 
                  className="gap-2 rounded-xl border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                  onClick={() => { setPendingStatus('cancelled'); setStatusModalOpen(true); }}
                >
                  <XCircle className="w-4 h-4" /> Reject
                </Button>
                <Button 
                  className="gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200"
                  onClick={() => { setPendingStatus('confirmed'); setStatusModalOpen(true); }}
                >
                  <CheckCircle2 className="w-4 h-4" /> Approve Booking
                </Button>
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column - Main Details (8 cols) */}
          <div className="lg:col-span-8 space-y-8">
            
            {/* Booking Journey Card */}
            <Card className="overflow-hidden border-none shadow-xl shadow-slate-200/50 dark:shadow-none bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-800">
              <div className="bg-slate-50 dark:bg-slate-900/50 px-6 py-4 border-b border-gray-100 dark:border-slate-700 flex items-center justify-between">
                <h2 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Clock className="w-5 h-5 text-blue-500" /> Booking Journey
                </h2>
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Rental Period</span>
              </div>
              
              <div className="p-8">
                <div className="flex flex-col md:flex-row items-center justify-between gap-8 relative">
                  {/* Visual Line */}
                  <div className="hidden md:block absolute top-[22px] left-1/4 right-1/4 h-0.5 bg-linear-to-r from-blue-200 via-blue-400 to-blue-200" />
                  
                  <div className="flex-1 text-center md:text-left space-y-2 z-10">
                    <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-200 mx-auto md:mx-0">
                      <MapPin className="w-6 h-6" />
                    </div>
                    <h3 className="font-bold text-lg dark:text-white">Pickup</h3>
                    <p className="text-sm font-medium text-blue-600">{formatDate(booking.startDate, true)}</p>
                    <p className="text-xs text-slate-500">{new Date(booking.startDate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                  </div>

                  <div className="shrink-0 bg-blue-50 dark:bg-slate-900 px-4 py-2 rounded-full border border-blue-100 dark:border-slate-700 z-10">
                    <span className="text-xs font-bold text-blue-700 dark:text-blue-400">
                      {Math.ceil((new Date(booking.endDate).getTime() - new Date(booking.startDate).getTime()) / (1000 * 60 * 60 * 24))} Days Rental
                    </span>
                  </div>

                  <div className="flex-1 text-center md:text-right space-y-2 z-10">
                    <div className="w-12 h-12 bg-slate-800 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-slate-200 mx-auto md:ml-auto md:mr-0">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <h3 className="font-bold text-lg dark:text-white">Return</h3>
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{formatDate(booking.endDate, true)}</p>
                    <p className="text-xs text-slate-500">{new Date(booking.endDate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                  </div>
                </div>

                {booking.pickupLocation && (
                  <div className="mt-8 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-dashed border-slate-200 dark:border-slate-700 flex items-start gap-3">
                    <Info className="w-5 h-5 text-blue-500 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">Pickup Location</h4>
                      <p className="text-sm text-slate-500">{booking.pickupLocation}</p>
                    </div>
                  </div>
                )}
              </div>
            </Card>

            {/* Financials & Status Log Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               {/* Financial Overview */}
              <Card className="flex flex-col border-none shadow-xl shadow-slate-200/50 dark:shadow-none bg-white dark:bg-slate-800 h-full border border-gray-100 dark:border-slate-800">
                <div className="bg-slate-900 text-white px-6 py-4 rounded-t-xl flex items-center justify-between">
                  <h2 className="font-bold flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-blue-400" /> Payment Summary
                  </h2>
                  <Badge variant={booking.paymentStatus === 'paid' ? 'default' : 'secondary'} className="bg-blue-500/20 text-blue-300 border-blue-500/50 uppercase text-[10px]">
                    {booking.paymentStatus}
                  </Badge>
                </div>
                <div className="p-6 space-y-4 flex-1 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Total Price</span>
                      <span className="font-bold text-slate-900 dark:text-white">SBD {booking.totalPrice?.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Deposit Paid</span>
                      <span className="font-bold text-emerald-600">SBD {booking.deposit?.toLocaleString()}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between items-center py-2">
                      <span className="text-base font-bold text-slate-900 dark:text-white">Balance Due</span>
                      <span className="text-2xl font-black text-rose-600 italic">SBD {(booking.totalPrice - (booking.deposit || 0)).toLocaleString()}</span>
                    </div>
                  </div>
                  
                  <BookingActions booking={booking} />
                </div>
              </Card>

              {/* Status History */}
              <Card className="border-none shadow-xl shadow-slate-200/50 dark:shadow-none bg-white dark:bg-slate-800 h-full border border-gray-100 dark:border-slate-800">
                 <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex items-center justify-between">
                  <h2 className="font-bold flex items-center gap-2 text-slate-900 dark:text-white">
                    <FileText className="w-5 h-5 text-blue-500" /> Status Logs
                  </h2>
                  <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                </div>
                <div className="p-6">
                  <div className="space-y-6">
                    {booking.statusHistory?.map((h: any, i: number) => (
                      <div key={i} className="flex gap-4 relative">
                        {i !== booking.statusHistory.length - 1 && (
                          <div className="absolute left-[11px] top-6 bottom-0 w-0.5 bg-slate-100 dark:bg-slate-800" />
                        )}
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center bg-white dark:bg-slate-900 z-10 ${
                          h.status === 'confirmed' ? 'border-emerald-500' : h.status === 'cancelled' ? 'border-rose-500' : 'border-blue-500'
                        }`}>
                          <div className={`w-2 h-2 rounded-full ${
                             h.status === 'confirmed' ? 'bg-emerald-500' : h.status === 'cancelled' ? 'bg-rose-500' : 'bg-blue-500'
                          }`} />
                        </div>
                        <div className="flex-1 -mt-1">
                          <div className="flex justify-between items-start">
                            <p className="font-bold text-sm text-slate-900 dark:text-white capitalize">{h.status}</p>
                            <span className="text-[10px] font-medium text-slate-400">{formatDate(h.changedAt, true)}</span>
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{h.note}</p>
                        </div>
                      </div>
                    ))}
                    {(!booking.statusHistory || booking.statusHistory.length === 0) && (
                      <div className="text-center py-8 text-slate-400 italic text-sm">No status changes recorded.</div>
                    )}
                  </div>
                </div>
              </Card>
            </div>

            {/* Payments Table */}
            <Card className="border-none shadow-xl shadow-slate-200/50 dark:shadow-none bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-800 overflow-hidden">
               <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex items-center gap-2">
                 <DollarSign className="w-5 h-5 text-blue-500" />
                 <h2 className="font-bold text-slate-900 dark:text-white">Transaction Record</h2>
               </div>
               <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/50 dark:bg-slate-900/50 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100 dark:border-slate-800">
                      <th className="px-6 py-4">Ref ID</th>
                      <th className="px-6 py-4">Method</th>
                      <th className="px-6 py-4">Recorded At</th>
                      <th className="px-6 py-4 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {payments.length > 0 ? payments.map((p: any) => (
                      <tr key={p._id} className="text-sm hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-colors">
                        <td className="px-6 py-4 font-mono font-bold text-blue-600 uppercase text-xs">P-{p._id.slice(-6)}</td>
                        <td className="px-6 py-4 capitalize font-medium text-slate-700 dark:text-slate-300">{p.paymentMethod}</td>
                        <td className="px-6 py-4 text-slate-500">{formatDate(p.createdAt, true)}</td>
                        <td className="px-6 py-4 text-right font-black text-slate-900 dark:text-white">SBD {p.amount.toLocaleString()}</td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={4} className="px-6 py-12 text-center text-slate-400 italic">No transactions found for this booking.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>

          {/* Right Column - Sidebar (4 cols) */}
          <div className="lg:col-span-4 space-y-8">
            
            {/* Customer Profile Card */}
            <Card className="border-none shadow-xl shadow-slate-200/50 dark:shadow-none bg-white dark:bg-slate-800 overflow-hidden border border-gray-100 dark:border-slate-800">
              <div className="h-2 bg-blue-600 w-full" />
              <div className="p-6 space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-linear-to-br from-blue-600 to-indigo-700 rounded-2xl flex items-center justify-center text-white text-2xl font-black shadow-lg">
                    {booking.user?.name?.[0] || 'C'}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white leading-tight">{booking.user?.name || 'Guest Customer'}</h3>
                    <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">Verified Client</p>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl group transition-all hover:bg-blue-50 dark:hover:bg-blue-900/20">
                    <Mail className="w-5 h-5 text-slate-400 group-hover:text-blue-500 transition-colors" />
                    <div className="overflow-hidden">
                      <p className="text-[10px] text-slate-400 uppercase font-bold">Email Address</p>
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate">{booking.user?.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl group transition-all hover:bg-blue-50 dark:hover:bg-blue-900/20">
                    <Phone className="w-5 h-5 text-slate-400 group-hover:text-blue-500 transition-colors" />
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase font-bold">Phone Number</p>
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{booking.user?.phone || 'Not Provided'}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-100 dark:border-emerald-800/50">
                    <ShieldCheck className="w-6 h-6 text-emerald-600 shrink-0" />
                    <div>
                      <p className="text-[10px] text-emerald-600 uppercase font-extrabold pb-0.5">Driver's License</p>
                      <p className="text-lg font-black text-emerald-800 dark:text-emerald-400 tracking-widest leading-none">{booking.driversLicense}</p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Vehicle Card */}
            <Card className="border-none shadow-xl shadow-slate-200/50 dark:shadow-none bg-white dark:bg-slate-800 overflow-hidden border border-gray-100 dark:border-slate-800">
               {booking.vehicle?.images?.[0] ? (
                <div className="aspect-video relative h-48">
                  <Image fill src={booking.vehicle.images[0]} alt="car" className="object-cover" />
                  <div className="absolute inset-0 bg-linear-to-t from-black/80 to-transparent flex flex-col justify-end p-6">
                     <p className="text-white text-xl font-black italic tracking-tight">{booking.vehicle.make} {booking.vehicle.model}</p>
                  </div>
                </div>
              ) : (
                <div className="aspect-video h-48 bg-slate-100 dark:bg-slate-900 flex items-center justify-center">
                  <Car className="w-12 h-12 text-slate-300" />
                </div>
              )}
              <div className="p-6 space-y-5">
                <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                   <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-bold text-slate-400 uppercase">Plate Number</span>
                   </div>
                   <span className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tighter">{booking.vehicle?.licensePlate}</span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl">
                    <p className="text-[10px] text-slate-400 font-bold uppercase">Daily Rate</p>
                    <p className="text-lg font-black text-slate-900 dark:text-white">SBD {booking.vehicle?.pricePerDay}</p>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl">
                    <p className="text-[10px] text-slate-400 font-bold uppercase">Hourly Rate</p>
                    <p className="text-lg font-black text-slate-900 dark:text-white">SBD {booking.vehicle?.pricePerHour}</p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Status Modal */}
        <Dialog open={statusModalOpen} onOpenChange={setStatusModalOpen}>
          <DialogContent className="max-w-md rounded-2xl p-0 overflow-hidden border-none shadow-2xl">
            <div className={`p-6 text-white ${pendingStatus === 'confirmed' ? 'bg-emerald-600' : 'bg-rose-600'}`}>
              <DialogHeader>
                <DialogTitle className="text-white text-2xl font-black">
                  {pendingStatus === 'confirmed' ? 'Approve' : 'Reject'} Request?
                </DialogTitle>
                <DialogDescription className="text-white/80 text-sm font-medium">
                  You are about to change the status of Booking #{booking.bookingRef} to <strong className="uppercase">{pendingStatus}</strong>.
                </DialogDescription>
              </DialogHeader>
            </div>
            
            <div className="p-6 space-y-4 bg-white dark:bg-slate-900">
              <div className="space-y-2">
                <Label className="text-xs font-black uppercase text-slate-500">Administrative Note</Label>
                <Input
                  placeholder="e.g. Approved after verifying driver details"
                  value={statusNote}
                  onChange={(e) => setStatusNote(e.target.value)}
                  className="rounded-xl bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 focus:ring-blue-500"
                />
                <p className="text-[10px] text-slate-400 italic">This note will be visible in the status history logs.</p>
              </div>
            </div>
            
            <DialogFooter className="p-6 sm:justify-center gap-3 bg-slate-50 dark:bg-slate-800/50">
              <Button variant="outline" className="rounded-xl px-8" onClick={() => setStatusModalOpen(false)}>Nevermind</Button>
              <Button
                className={`rounded-xl px-8 shadow-lg ${pendingStatus === 'confirmed' ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200' : 'bg-rose-600 hover:bg-rose-700 shadow-rose-200'}`}
                onClick={handleStatusChange}
              >
                Confirm Change
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Modern Print Template (Visible only during print) */}
      <BookingPrintView booking={booking} payments={payments} />
    </div>
  );
}