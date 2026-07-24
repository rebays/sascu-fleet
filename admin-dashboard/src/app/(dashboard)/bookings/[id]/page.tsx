'use client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Car, Mail, Phone, FileText,
  Clock, CheckCircle2, XCircle, Loader, ArrowRight, ArrowLeft,
  ShieldCheck, CreditCard, MapPin, Receipt, IdCard
} from 'lucide-react';
import useSWR, { mutate } from 'swr';
import { fetcher } from '@/lib/api';
import Image from 'next/image';
import { use, useState, useEffect } from 'react';
import BookingActions from '@/components/BookingActions';
import BookingPrintView from '@/components/BookingPrintView';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function BookingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: response, error, isLoading } = useSWR<any>(`/bookings/${id}`, fetcher);
  const { data: bookingPayments } = useSWR<any>(`/bookings/admin/${id}/payments`, fetcher);
  const booking = response?.data;

  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<'approve' | 'reject' | 'cancel' | null>(null);
  const [statusNote, setStatusNote] = useState('');
  const [docType, setDocType] = useState<'invoice' | 'receipt'>('invoice');
  const [submittingStatus, setSubmittingStatus] = useState(false);

  const payments = bookingPayments?.data || [];
  const router = useRouter();

  const pendingStatus = pendingAction === 'approve' ? 'confirmed' : pendingAction ? 'cancelled' : null;
  const actionLabel = pendingAction === 'approve' ? 'Approve' : pendingAction === 'reject' ? 'Reject' : 'Cancel';

  const handlePreview = (type: 'invoice' | 'receipt') => {
    setDocType(type);
    setTimeout(() => window.print(), 50);
  };

  const handleStatusChange = async () => {
    if (!pendingStatus || submittingStatus) return;
    setSubmittingStatus(true);
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

      const result = await res.json().catch(() => null);
      if (!res.ok) throw new Error(result?.message || 'Failed to update status');

      toast.success(
        pendingAction === 'approve' ? 'Booking approved!' : pendingAction === 'reject' ? 'Booking rejected!' : 'Booking cancelled!'
      );
      mutate(`/bookings/${booking._id}`);
      mutate(`/bookings/admin/${booking._id}/payments`);
      mutate('/bookings/admin/all');
      setStatusModalOpen(false);
      setStatusNote('');
      setPendingAction(null);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update status');
    } finally {
      setSubmittingStatus(false);
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
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
      <Loader className="animate-spin w-8 h-8 text-blue-600" />
      <p className="text-sm text-gray-500 dark:text-slate-400">Fetching booking details...</p>
    </div>
  );

  if (!booking) return null;

  const formatDate = (d: string, short = false) => {
    const options: Intl.DateTimeFormatOptions = short
      ? { month: 'short', day: 'numeric', year: 'numeric' }
      : { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(d).toLocaleDateString('en-ZA', options);
  };

  const formatTime = (d: string) => new Date(d).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const getStatusVariant = (status: string): 'success' | 'destructive' | 'outline' => {
    if (status === 'confirmed') return 'success';
    if (status === 'cancelled') return 'destructive';
    return 'outline';
  };

  const initials = (booking.user?.name || 'Guest Customer')
    .split(' ')
    .map((p: string) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const rentalDays = Math.ceil(
    (new Date(booking.endDate).getTime() - new Date(booking.startDate).getTime()) / (1000 * 60 * 60 * 24)
  );

  const balanceDue = booking.totalPrice - (booking.deposit || 0);

  return (
    <div>
      {/* Dashboard View (Hidden during print) */}
      <div className="print:hidden p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <button
              onClick={() => router.push('/bookings')}
              className="inline-flex items-center gap-1 text-sm text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200 mb-1"
            >
              <ArrowLeft className="w-4 h-4" /> Back to bookings
            </button>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-semibold text-blue-900 dark:text-slate-400">
                Booking #{booking.bookingRef}
              </h1>
              <Badge variant={getStatusVariant(booking.status)} className="capitalize">
                {booking.status}
              </Badge>
            </div>
            <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">
              Received on {formatDate(booking.createdAt, true)}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {booking.status === 'pending' && (
              <>
                <Button
                  variant="outline"
                  className="text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                  onClick={() => { setPendingAction('reject'); setStatusModalOpen(true); }}
                >
                  <XCircle className="w-4 h-4 mr-2" /> Reject
                </Button>
                <Button onClick={() => { setPendingAction('approve'); setStatusModalOpen(true); }}>
                  <CheckCircle2 className="w-4 h-4 mr-2" /> Approve Booking
                </Button>
              </>
            )}
            {booking.status === 'confirmed' && (
              <Button
                variant="outline"
                className="text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                onClick={() => { setPendingAction('cancel'); setStatusModalOpen(true); }}
              >
                <XCircle className="w-4 h-4 mr-2" /> Cancel Booking
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Main Details */}
          <div className="lg:col-span-2 space-y-6">

            {/* Rental Period Card */}
            <Card className="p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-semibold flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gray-400" /> Rental Period
                </h2>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="capitalize">
                    {booking.locationType === 'out-of-town' ? 'Out of Town' : 'In Town'}
                  </Badge>
                  <span className="text-xs font-medium text-gray-500 dark:text-slate-400">
                    {rentalDays} day{rentalDays !== 1 ? 's' : ''} rental
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-gray-500 dark:text-slate-400">Pickup</p>
                    <p className="font-semibold text-sm truncate">{formatDate(booking.startDate, true)}</p>
                    <p className="text-xs text-gray-400 dark:text-slate-500">{formatTime(booking.startDate)}</p>
                  </div>
                </div>

                <ArrowRight className="w-5 h-5 text-gray-300 dark:text-slate-600 shrink-0" />

                <div className="flex items-center gap-3 flex-1 justify-end text-right min-w-0">
                  <div className="min-w-0">
                    <p className="text-xs text-gray-500 dark:text-slate-400">Return</p>
                    <p className="font-semibold text-sm truncate">{formatDate(booking.endDate, true)}</p>
                    <p className="text-xs text-gray-400 dark:text-slate-500">{formatTime(booking.endDate)}</p>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                </div>
              </div>

              {booking.pickupLocation && (
                <div className="mt-4 flex items-start gap-2 text-sm text-gray-600 dark:text-slate-300 bg-gray-50 dark:bg-slate-900/40 rounded-lg p-3">
                  <MapPin className="w-4 h-4 text-gray-400 dark:text-slate-500 mt-0.5 shrink-0" />
                  <span>{booking.pickupLocation}</span>
                </div>
              )}

              {(booking.requestedPickupTime || booking.confirmedPickupTime) && (
                <div className="mt-4 flex items-start gap-2 text-sm text-gray-600 dark:text-slate-300 bg-gray-50 dark:bg-slate-900/40 rounded-lg p-3">
                  <Clock className="w-4 h-4 text-gray-400 dark:text-slate-500 mt-0.5 shrink-0" />
                  {booking.confirmedPickupTime ? (
                    <span>
                      Confirmed pickup time: <strong>{booking.confirmedPickupTime}</strong>
                    </span>
                  ) : (
                    <span>
                      Customer requested <strong>{booking.requestedPickupTime}</strong> — not yet confirmed
                    </span>
                  )}
                </div>
              )}
            </Card>

            {/* Financials & Status Log Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Payment Summary */}
              <Card className="p-5 flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-base font-semibold flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-gray-400" /> Payment Summary
                  </h2>
                  <Badge
                    variant={booking.paymentStatus === 'paid' ? 'success' : booking.paymentStatus === 'refunded' ? 'destructive' : 'secondary'}
                    className="capitalize"
                  >
                    {booking.paymentStatus}
                  </Badge>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-slate-400">Total Price</span>
                    <span className="font-medium">SBD {booking.totalPrice?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-slate-400">Deposit Paid</span>
                    <span className="font-medium text-green-600 dark:text-green-400">SBD {booking.deposit?.toLocaleString()}</span>
                  </div>
                  <div className="border-t border-gray-100 dark:border-slate-700 my-2" />
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">Balance Due</span>
                    <span className="text-xl font-bold text-red-600 dark:text-red-400">SBD {balanceDue.toLocaleString()}</span>
                  </div>
                </div>

                <div className="mt-4">
                  <BookingActions booking={booking} onPreview={handlePreview} />
                </div>
              </Card>

              {/* Status History */}
              <Card className="p-5">
                <h2 className="text-base font-semibold flex items-center gap-2 mb-4">
                  <FileText className="w-4 h-4 text-gray-400" /> Status History
                </h2>
                <div className="space-y-4">
                  {booking.statusHistory?.map((h: any, i: number) => (
                    <div key={i} className="flex gap-3 relative">
                      {i !== booking.statusHistory.length - 1 && (
                        <div className="absolute left-[7px] top-4 -bottom-4 w-px bg-gray-100 dark:bg-slate-700" />
                      )}
                      <div className={`w-3.5 h-3.5 rounded-full mt-1 shrink-0 z-10 ${
                        h.status === 'confirmed' ? 'bg-green-500' : h.status === 'cancelled' ? 'bg-red-500' : 'bg-blue-500'
                      }`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start gap-2">
                          <p className="font-medium text-sm capitalize">{h.status}</p>
                          <span className="text-xs text-gray-400 dark:text-slate-500 shrink-0">{formatDate(h.changedAt, true)}</span>
                        </div>
                        {h.note && <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">{h.note}</p>}
                      </div>
                    </div>
                  ))}
                  {(!booking.statusHistory || booking.statusHistory.length === 0) && (
                    <p className="text-sm text-gray-400 dark:text-slate-500 italic">No status changes recorded.</p>
                  )}
                </div>
              </Card>
            </div>

            {/* Payments Table */}
            <Card className="overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 dark:border-slate-700 flex items-center gap-2">
                <Receipt className="w-4 h-4 text-gray-400" />
                <h2 className="text-base font-semibold">Transaction Record</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-gray-200 dark:border-slate-700 bg-gray-50/60 dark:bg-slate-900/30">
                    <tr>
                      <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-slate-400">Ref ID</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-slate-400">Method</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-slate-400">Recorded At</th>
                      <th className="text-right px-5 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-slate-400">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.length > 0 ? payments.map((p: any) => (
                      <tr key={p._id} className="border-b border-gray-100 dark:border-slate-700 last:border-0 hover:bg-gray-50 dark:hover:bg-slate-700/40 transition-colors">
                        <td className="px-5 py-3 font-mono text-xs text-gray-500 dark:text-slate-400">P-{p._id.slice(-6)}</td>
                        <td className="px-5 py-3 capitalize">{p.paymentMethod}</td>
                        <td className="px-5 py-3 text-gray-500 dark:text-slate-400">{formatDate(p.createdAt, true)}</td>
                        <td className="px-5 py-3 text-right font-semibold">SBD {p.amount.toLocaleString()}</td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={4} className="px-5 py-10 text-center text-gray-400 dark:text-slate-500 italic">No transactions found for this booking.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">

            {/* Customer Profile Card */}
            <Card className="p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 flex items-center justify-center text-base font-semibold shrink-0">
                  {initials || 'C'}
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold truncate">{booking.user?.name || 'Guest Customer'}</h3>
                  <p className="text-xs text-gray-500 dark:text-slate-400">Customer</p>
                </div>
              </div>

              <div className="space-y-2 text-sm text-gray-600 dark:text-slate-300">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-gray-400 dark:text-slate-500 shrink-0" />
                  <span className="truncate">{booking.user?.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-gray-400 dark:text-slate-500 shrink-0" />
                  <span>{booking.user?.phone || 'Not provided'}</span>
                </div>
              </div>

              <div className="mt-4 flex items-center gap-2.5 p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800/40">
                <ShieldCheck className="w-4 h-4 text-green-600 dark:text-green-400 shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs text-green-700 dark:text-green-400 font-medium">Driver's License</p>
                  <p className="text-sm font-semibold text-green-800 dark:text-green-300 truncate">{booking.driversLicense}</p>
                </div>
              </div>

              <div className="mt-3 flex items-center gap-2.5 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/40">
                <IdCard className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs text-blue-700 dark:text-blue-400 font-medium">SASCU Member ID</p>
                  <p className="text-sm font-semibold text-blue-800 dark:text-blue-300 truncate">{booking.memberId || booking.user?.memberId || 'Not provided'}</p>
                </div>
              </div>
            </Card>

            {/* Vehicle Card */}
            <Card className="overflow-hidden">
              {booking.vehicle?.images?.[0] ? (
                <div className="relative h-40">
                  <Image fill src={booking.vehicle.images[0]} alt="car" className="object-cover" />
                </div>
              ) : (
                <div className="h-40 bg-gray-100 dark:bg-slate-700 flex items-center justify-center">
                  <Car className="w-10 h-10 text-gray-300 dark:text-slate-500" />
                </div>
              )}
              <div className="p-5">
                <h3 className="font-semibold mb-3">{booking.vehicle?.make} {booking.vehicle?.model}</h3>

                <div className="flex items-center justify-between text-sm mb-4">
                  <span className="text-gray-500 dark:text-slate-400">License Plate</span>
                  <span className="font-mono text-xs px-1.5 py-0.5 rounded bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-300">
                    {booking.vehicle?.licensePlate}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg bg-gray-50 dark:bg-slate-900/40">
                    <p className="text-xs text-gray-500 dark:text-slate-400">In Town / Day</p>
                    <p className="font-semibold">SBD {booking.vehicle?.pricePerDay || 0}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-gray-50 dark:bg-slate-900/40">
                    <p className="text-xs text-gray-500 dark:text-slate-400">In Town / Half-Day</p>
                    <p className="font-semibold">SBD {booking.vehicle?.pricePerHalfDay || 0}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-gray-50 dark:bg-slate-900/40">
                    <p className="text-xs text-gray-500 dark:text-slate-400">Out of Town / Day</p>
                    <p className="font-semibold">SBD {booking.vehicle?.pricePerDayOutOfTown || 0}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-gray-50 dark:bg-slate-900/40">
                    <p className="text-xs text-gray-500 dark:text-slate-400">Out of Town / Half-Day</p>
                    <p className="font-semibold">SBD {booking.vehicle?.pricePerHalfDayOutOfTown || 0}</p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Status Modal */}
        <Dialog
          open={statusModalOpen}
          onOpenChange={(open) => {
            setStatusModalOpen(open);
            if (!open) { setPendingAction(null); setStatusNote(''); }
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {pendingAction === 'approve'
                  ? <CheckCircle2 className="w-5 h-5 text-green-600" />
                  : <XCircle className="w-5 h-5 text-red-600" />}
                {actionLabel} Booking?
              </DialogTitle>
              <DialogDescription>
                You are about to mark Booking #{booking.bookingRef} as{' '}
                <strong className="capitalize">{pendingStatus}</strong>.
              </DialogDescription>
            </DialogHeader>

            {pendingAction === 'cancel' && (
              <div className="space-y-2">
                {['partial', 'paid'].includes(booking.paymentStatus) && (
                  <div className="flex items-start gap-2 text-sm text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800/40 rounded-lg p-3">
                    <CreditCard className="w-4 h-4 mt-0.5 shrink-0" />
                    <span>
                      This booking has SBD {booking.deposit?.toLocaleString()} recorded as paid. Cancelling will mark
                      payment status as <strong>refunded</strong> - process the actual refund to the customer separately.
                    </span>
                  </div>
                )}
                {new Date(booking.startDate) <= new Date() && (
                  <div className="flex items-start gap-2 text-sm text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800/40 rounded-lg p-3">
                    <Clock className="w-4 h-4 mt-0.5 shrink-0" />
                    <span>This rental's pickup date has already passed. Confirm the vehicle was not handed over before cancelling.</span>
                  </div>
                )}
                <div className="flex items-start gap-2 text-sm text-gray-500 dark:text-slate-400">
                  <span>The vehicle will become available for other bookings during this period.</span>
                </div>
              </div>
            )}

            <div>
              <Label>Administrative Note (optional)</Label>
              <Input
                placeholder="e.g. Approved after verifying driver details"
                value={statusNote}
                onChange={(e) => setStatusNote(e.target.value)}
              />
              <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">This note will be visible in the status history.</p>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setStatusModalOpen(false)}>
                {pendingAction === 'cancel' ? 'Back' : 'Cancel'}
              </Button>
              <Button
                variant={pendingAction === 'approve' ? 'default' : 'destructive'}
                onClick={handleStatusChange}
                disabled={submittingStatus}
              >
                {submittingStatus ? <Loader className="w-4 h-4 mr-2 animate-spin" /> : null}
                Confirm {actionLabel}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Print Template (Visible only during print) */}
      <BookingPrintView booking={booking} payments={payments} docType={docType} />
    </div>
  );
}
