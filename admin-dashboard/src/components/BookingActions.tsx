'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  DollarSign, Mail, Printer, CreditCard, Banknote, 
  Loader2, Receipt, Send, ShieldCheck, CheckCircle2, History
} from 'lucide-react';
import { toast } from 'sonner';
import { useSWRConfig } from 'swr';

interface BookingActionsProps {
  booking: any;
  onPaymentRecorded?: () => void;
}

export default function BookingActions({ booking, onPaymentRecorded }: BookingActionsProps) {
  const { mutate } = useSWRConfig();

  const [paymentOpen, setPaymentOpen] = useState(false);
  const [invoiceOpen, setInvoiceOpen] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [sendingReceipt, setSendingReceipt] = useState(false);
  const [receiptOpen, setReceiptOpen] = useState(false);
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

  const handleSendInvoice = async () => {
    setSendingEmail(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/bookings/admin/${booking._id}/send-invoice`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        }
      );

      if (!res.ok) throw new Error();
      toast.success('Invoice successfully dispatched to client');
      setInvoiceOpen(false);
    } catch (err) {
      toast.error('Failed to send invoice');
    } finally {
      setSendingEmail(false);
    }
  };

  const handleSendReceipt = async () => {
    setSendingReceipt(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/bookings/admin/${booking._id}/send-receipt`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        }
      );

      if (!res.ok) throw new Error();
      toast.success('Receipt successfully dispatched to client');
      setReceiptOpen(false);
    } catch (err) {
      toast.error('Failed to send receipt');
    } finally {
      setSendingReceipt(false);
    }
  };

  return (
    <>
      <div className="grid grid-cols-2 gap-3 mt-4 print:hidden">
        <Button 
          onClick={() => setPaymentOpen(true)} 
          className="rounded-xl flex gap-2 bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-100 dark:shadow-none"
        >
          <DollarSign className="w-4 h-4" /> Record Payment
        </Button>
        <Button 
          variant="outline" 
          onClick={() => setInvoiceOpen(true)} 
          className="rounded-xl flex gap-2 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900"
        >
          <Mail className="w-4 h-4" /> Send Invoice
        </Button>
        <Button 
          variant="outline" 
          onClick={() => setReceiptOpen(true)} 
          className="rounded-xl flex gap-2 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900"
        >
          <Receipt className="w-4 h-4" /> Send Receipt
        </Button>
        <Button 
          variant="outline" 
          onClick={() => window.print()} 
          className="rounded-xl flex gap-2 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900"
        >
          <Printer className="w-4 h-4" /> Print View
        </Button>
      </div>

      {/* Record Payment Modal */}
      <Dialog open={paymentOpen} onOpenChange={setPaymentOpen}>
        <DialogContent className="rounded-2xl p-0 overflow-hidden border-none shadow-2xl">
          <div className="bg-slate-900 p-6 text-white">
            <DialogHeader className="space-y-1">
              <DialogTitle className="text-xl font-bold flex items-center gap-2 text-white">
                <DollarSign className="w-5 h-5 text-blue-400" /> Record New Payment
              </DialogTitle>
              <DialogDescription className="text-slate-400 text-xs text-left">
                Updates booking balance and payment history.
              </DialogDescription>
            </DialogHeader>
          </div>
          
          <div className="p-6 space-y-5 bg-white dark:bg-slate-900">
            <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-800">
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Remaining Balance</p>
                <p className="text-xl font-black text-slate-900 dark:text-white">
                  SBD {(booking.totalPrice - (booking.deposit || 0)).toLocaleString()}
                </p>
              </div>
              <History className="w-6 h-6 text-slate-300" />
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase text-slate-500">Transaction Amount</Label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">SBD</div>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="pl-12 rounded-xl border-slate-200 dark:border-slate-800 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase text-slate-500">Payment Channel</Label>
                <Select value={method} onValueChange={setMethod}>
                  <SelectTrigger className="rounded-xl border-slate-200 dark:border-slate-800">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="card">
                      <div className="flex items-center gap-2 text-sm"><CreditCard className="w-4 h-4 text-slate-500" /> Card Payment</div>
                    </SelectItem>
                    <SelectItem value="cash">
                      <div className="flex items-center gap-2 text-sm"><Banknote className="w-4 h-4 text-emerald-500" /> Cash Payment</div>
                    </SelectItem>
                    <SelectItem value="eft">
                      <div className="flex items-center gap-2 text-sm"><Send className="w-4 h-4 text-blue-500" /> Bank Transfer (EFT)</div>
                    </SelectItem>
                    <SelectItem value="other">Other Method</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter className="p-6 bg-slate-50 dark:bg-slate-800/50 flex gap-3">
            <Button variant="outline" className="rounded-xl px-6 flex-1" onClick={() => setPaymentOpen(false)}>Cancel</Button>
            <Button className="rounded-xl px-6 flex-1 bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200 dark:shadow-none" onClick={handleRecordPayment}>Record Entry</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modern Email Notification Modals */}
      <Dialog open={invoiceOpen} onOpenChange={setInvoiceOpen}>
        <DialogContent className="rounded-2xl p-0 overflow-hidden border-none shadow-2xl">
           <div className="p-8 text-center bg-white dark:bg-slate-900">
            <div className="w-20 h-20 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Mail className="w-10 h-10 text-blue-600" />
            </div>
            <DialogHeader>
              <DialogTitle className="text-2xl font-black text-slate-900 dark:text-white mb-2 text-center">
                Dispatch Invoice?
              </DialogTitle>
              <DialogDescription className="text-sm text-slate-500 text-center">
                A digital invoice will be securely emailed to:
                <br />
                <strong className="text-blue-600 italic font-medium">{booking.user?.email}</strong>
              </DialogDescription>
            </DialogHeader>
          </div>
          <DialogFooter className="p-6 bg-slate-50 dark:bg-slate-800/50 flex gap-3">
            <Button variant="outline" className="rounded-xl px-8" onClick={() => setInvoiceOpen(false)}>Cancel</Button>
            <Button className="rounded-xl px-8 bg-slate-900 hover:bg-black text-white" onClick={handleSendInvoice} disabled={sendingEmail}>
              {sendingEmail ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Send className="w-4 h-4 mr-2" /> Send to Client</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={receiptOpen} onOpenChange={setReceiptOpen}>
        <DialogContent className="rounded-2xl p-0 overflow-hidden border-none shadow-2xl">
           <div className="p-8 text-center bg-white dark:bg-slate-900">
            <div className="w-20 h-20 bg-emerald-50 dark:bg-emerald-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Receipt className="w-10 h-10 text-emerald-600" />
            </div>
            <DialogHeader>
              <DialogTitle className="text-2xl font-black text-slate-900 dark:text-white mb-2 text-center">
                Dispatch Receipt?
              </DialogTitle>
              <DialogDescription className="text-sm text-slate-500 text-center">
                A digital payment receipt will be sent to:
                <br />
                <strong className="text-emerald-600 italic font-medium">{booking.user?.email}</strong>
              </DialogDescription>
            </DialogHeader>
          </div>
          <DialogFooter className="p-6 bg-slate-50 dark:bg-slate-800/50 flex gap-3">
            <Button variant="outline" className="rounded-xl px-8" onClick={() => setReceiptOpen(false)}>Cancel</Button>
            <Button className="rounded-xl px-8 bg-slate-900 hover:bg-black text-white" onClick={handleSendReceipt} disabled={sendingReceipt}>
              {sendingReceipt ? <Loader2 className="w-4 h-4 animate-spin" /> : <><CheckCircle2 className="w-4 h-4 mr-2" /> Send to Client</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}