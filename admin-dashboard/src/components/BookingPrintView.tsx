'use client';

import { CheckCircle2, MapPin, Printer } from 'lucide-react';

interface PrintTemplateProps {
  booking: any;
  payments: any[];
}

export default function BookingPrintView({ booking, payments }: PrintTemplateProps) {
  const formatDate = (d: string) => {
    return new Date(d).toLocaleDateString('en-ZA', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const totalPaid = payments
    .filter(p => p.status === 'succeeded')
    .reduce((sum, p) => sum + p.amount, 0);

  const balanceDue = booking.totalPrice - totalPaid;

  return (
    <div className="hidden print:block fixed inset-0 bg-white z-[9999] p-10 font-sans text-slate-900 overflow-y-auto">
      {/* Header */}
      <div className="flex justify-between items-start mb-12 border-b-2 border-slate-100 pb-8">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-10 h-10 bg-slate-900 rounded-lg flex items-center justify-center text-white font-black text-xl">S</div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900">SASCU FLEET</h1>
          </div>
          <p className="text-slate-500 text-sm font-medium">Honiara, Solomon Islands</p>
          <p className="text-slate-500 text-sm font-medium">Phone: +677 21234 • Email: info@sascu.com</p>
        </div>
        <div className="text-right">
          <h2 className="text-4xl font-black text-slate-200 uppercase tracking-widest mb-2">
            {balanceDue <= 0 ? 'Official Receipt' : 'Service Invoice'}
          </h2>
          <p className="text-slate-900 font-bold">No: {booking.bookingRef}</p>
          <p className="text-slate-500 text-xs mt-1">Date Issued: {new Date().toLocaleDateString()}</p>
        </div>
      </div>

      {/* Bill To & Details Grid */}
      <div className="grid grid-cols-2 gap-12 mb-12">
        <div>
          <h3 className="text-[10px] uppercase font-black text-slate-400 tracking-wider mb-3">Customer Information</h3>
          <p className="text-lg font-bold text-slate-900">{booking.user?.name}</p>
          <p className="text-slate-600 font-medium">{booking.user?.email}</p>
          <p className="text-slate-600 font-medium">{booking.user?.phone || 'No phone provided'}</p>
          <div className="mt-4 p-3 bg-slate-50 rounded-lg border border-slate-100">
            <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Driver's License</p>
            <p className="font-mono font-bold text-slate-700">{booking.driversLicense}</p>
          </div>
        </div>
        <div className="space-y-4">
          <h3 className="text-[10px] uppercase font-black text-slate-400 tracking-wider">Booking Period</h3>
          <div className="flex items-center gap-4">
             <div className="h-12 w-1 bg-slate-200 rounded-full" />
             <div className="space-y-1">
                <p className="text-sm">
                  <span className="font-bold text-slate-400 uppercase text-[9px] mr-2">Pickup</span>
                  <span className="text-slate-800 font-bold">{formatDate(booking.startDate)}</span>
                </p>
                <p className="text-sm">
                  <span className="font-bold text-slate-400 uppercase text-[9px] mr-2">Return</span>
                  <span className="text-slate-800 font-bold">{formatDate(booking.endDate)}</span>
                </p>
             </div>
          </div>
          <div className="pt-2">
            <p className="text-[10px] uppercase font-black text-slate-400 mb-1">Vehicle Selection</p>
            <p className="text-slate-900 font-bold text-lg">{booking.vehicle?.make} {booking.vehicle?.model}</p>
            <p className="text-slate-500 text-sm font-medium">Plate: <span className="text-slate-900 uppercase">{booking.vehicle?.licensePlate}</span> • Type: {booking.vehicle?.type}</p>
          </div>
        </div>
      </div>

      {/* Financial Table */}
      <div className="mb-12">
        <table className="w-full">
          <thead>
            <tr className="border-b-2 border-slate-900 text-left">
              <th className="py-4 text-[10px] uppercase font-black text-slate-500 tracking-widest px-2">Description</th>
              <th className="py-4 text-[10px] uppercase font-black text-slate-500 tracking-widest text-right">Unit Price</th>
              <th className="py-4 text-[10px] uppercase font-black text-slate-500 tracking-widest text-right">Qty/Days</th>
              <th className="py-4 text-[10px] uppercase font-black text-slate-500 tracking-widest text-right px-2">Total</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-slate-100">
              <td className="py-6 px-2">
                <p className="font-bold text-slate-900">Vehicle Rental Service</p>
                <p className="text-xs text-slate-500">Premium {booking.vehicle?.type} class vehicle rental.</p>
              </td>
              <td className="py-6 text-right font-medium">SBD {booking.vehicle?.pricePerDay?.toLocaleString()}</td>
              <td className="py-6 text-right font-medium">{Math.ceil((new Date(booking.endDate).getTime() - new Date(booking.startDate).getTime()) / (1000 * 3600 * 24))}</td>
              <td className="py-6 text-right font-black px-2">SBD {booking.totalPrice?.toLocaleString()}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Totals Section */}
      <div className="flex justify-end mb-16">
        <div className="w-80 space-y-3">
          <div className="flex justify-between text-slate-500">
            <span className="font-bold uppercase text-[10px]">Subtotal (Excl. Tax)</span>
            <span className="font-medium text-slate-900">SBD {booking.totalPrice?.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-slate-500">
            <span className="font-bold uppercase text-[10px]">Government GST (0%)</span>
            <span className="font-medium text-slate-900">SBD 0.00</span>
          </div>
          <div className="flex justify-between items-center py-4 border-y-2 border-slate-100">
             <span className="font-black uppercase text-xs text-slate-900">Total Charged</span>
             <span className="text-2xl font-black text-slate-900 italic">SBD {booking.totalPrice?.toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-center text-emerald-600 bg-emerald-50 px-3 py-2 rounded-lg">
             <span className="font-bold uppercase text-[10px]">Total Paid to Date</span>
             <span className="font-black">SBD {totalPaid.toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-center text-rose-600 border border-rose-100 px-3 py-2 rounded-lg">
             <span className="font-bold uppercase text-[10px]">Remaining Balance</span>
             <span className="font-black text-lg">SBD {balanceDue.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Transaction Log (If payments exist) */}
      {payments.length > 0 && (
        <div className="mb-12">
          <h3 className="text-[10px] uppercase font-black text-slate-400 tracking-wider mb-4 px-2">Payment Transaction History</h3>
          <div className="border border-slate-100 rounded-xl overflow-hidden">
            <table className="w-full text-xs">
               <thead className="bg-slate-50">
                  <tr className="text-left text-slate-400 font-bold border-b border-slate-100">
                    <th className="p-3">Reference/ID</th>
                    <th className="p-3">Method</th>
                    <th className="p-3">Date</th>
                    <th className="p-3 text-right">Amount</th>
                  </tr>
               </thead>
               <tbody>
                  {payments.filter(p => p.status === 'succeeded').map((p, i) => (
                    <tr key={i} className="border-b border-slate-50 text-slate-700 font-medium">
                      <td className="p-3 uppercase">P-{p._id.slice(-6)}</td>
                      <td className="p-3 capitalize">{p.paymentMethod}</td>
                      <td className="p-3">{new Date(p.createdAt).toLocaleDateString()}</td>
                      <td className="p-3 text-right font-bold">SBD {p.amount.toLocaleString()}</td>
                    </tr>
                  ))}
               </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Footer / Legal */}
      <div className="grid grid-cols-2 gap-12 mt-auto border-t-2 border-slate-100 pt-12">
        <div>
          <h4 className="text-[10px] uppercase font-black text-slate-900 mb-2">Terms & Conditions</h4>
          <ul className="text-[9px] text-slate-500 leading-relaxed space-y-1">
             <li>• Vehicles must be returned with the same amount of fuel as collected.</li>
             <li>• Any damages sustained during the rental period are the sole responsibility of the renter.</li>
             <li>• Late returns will be charged at the hourly rate of SBD 250.00.</li>
             <li>• Driver must maintain a valid Solomon Islands license at all times.</li>
          </ul>
        </div>
        <div className="text-right flex flex-col justify-end">
           <div className="w-48 h-0.5 bg-slate-900 ml-auto mb-2" />
           <p className="text-[10px] uppercase font-black text-slate-900">Authorized Signature</p>
           <p className="text-[9px] text-slate-400 mt-1">SASCU Fleet Management Official Stamp</p>
        </div>
      </div>

      <div className="mt-12 text-center text-[10px] text-slate-300 font-bold uppercase tracking-[0.2em]">
        Thank you for choosing SASCU Fleet Management
      </div>
    </div>
  );
}
