'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  DollarSign, FileText, CreditCard, Banknote,
  Receipt, Send, History
} from 'lucide-react';
import { toast } from 'sonner';
import { useSWRConfig } from 'swr';

interface BookingActionsProps {
  booking: any;
  onPaymentRecorded?: () => void;
  onPreview: (type: 'invoice' | 'receipt') => void;
}

export default function BookingActions({ booking, onPaymentRecorded, onPreview }: BookingActionsProps) {
  const { mutate } = useSWRConfig();

  const [paymentOpen, setPaymentOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('card');

  const handleRecordPayment = async () => {
    if (!amount || Number(amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/bookings/admin/${booking._id}/payments`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
          body: JSON.stringify({
            amount: Number(amount),
            paymentMethod: method,
            notes: 'Recorded via premium admin panel'
          }),
        }
      );

      if (!res.ok) throw new Error();

      toast.success(`Payment of SBD ${amount} recorded successfully!`);
      mutate(`/bookings/${booking._id}`);
      mutate(`/bookings/admin/${booking._id}/payments`);
      mutate('/bookings/admin/all');
      onPaymentRecorded?.();
      setPaymentOpen(false);
      setAmount('');
    } catch (err) {
      toast.error('Failed to record payment');
    }
  };

  return (
    <>
      <div className="space-y-2 print:hidden">
        <Button size="sm" className="w-full" onClick={() => setPaymentOpen(true)}>
          <DollarSign className="w-4 h-4 mr-1.5" /> Record Payment
        </Button>
        <div className="grid grid-cols-2 gap-2">
          <Button size="sm" variant="outline" onClick={() => onPreview('invoice')}>
            <FileText className="w-4 h-4 mr-1.5" /> Preview Invoice
          </Button>
          <Button size="sm" variant="outline" onClick={() => onPreview('receipt')}>
            <Receipt className="w-4 h-4 mr-1.5" /> Preview Receipt
          </Button>
        </div>
      </div>

      {/* Record Payment Modal */}
      <Dialog open={paymentOpen} onOpenChange={setPaymentOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-blue-600" /> Record Payment
            </DialogTitle>
            <DialogDescription>Updates the booking balance and payment history.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 rounded-lg bg-gray-50 dark:bg-slate-900/40 border border-gray-100 dark:border-slate-800">
              <div>
                <p className="text-xs text-gray-500 dark:text-slate-400">Remaining Balance</p>
                <p className="text-lg font-semibold">
                  SBD {(booking.totalPrice - (booking.deposit || 0)).toLocaleString()}
                </p>
              </div>
              <History className="w-5 h-5 text-gray-300 dark:text-slate-600" />
            </div>

            <div>
              <Label>Transaction Amount</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500 text-xs font-medium">SBD</span>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="pl-11"
                />
              </div>
            </div>

            <div>
              <Label>Payment Method</Label>
              <Select value={method} onValueChange={setMethod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="card">
                    <div className="flex items-center gap-2 text-sm"><CreditCard className="w-4 h-4 text-gray-500" /> Card Payment</div>
                  </SelectItem>
                  <SelectItem value="cash">
                    <div className="flex items-center gap-2 text-sm"><Banknote className="w-4 h-4 text-green-500" /> Cash Payment</div>
                  </SelectItem>
                  <SelectItem value="eft">
                    <div className="flex items-center gap-2 text-sm"><Send className="w-4 h-4 text-blue-500" /> Bank Transfer (EFT)</div>
                  </SelectItem>
                  <SelectItem value="other">Other Method</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setPaymentOpen(false)}>Cancel</Button>
            <Button onClick={handleRecordPayment}>Record Payment</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
