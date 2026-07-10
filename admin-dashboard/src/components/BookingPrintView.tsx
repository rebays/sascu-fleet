'use client';

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
      minute: '2-digit',
    });
  };

  const totalPaid = payments
    .filter((p) => p.status === 'succeeded')
    .reduce((sum, p) => sum + p.amount, 0);

  const balanceDue = booking.totalPrice - totalPaid;

  return (
    <div className="hidden print:block fixed inset-0 bg-white z-[9999] p-10 font-sans text-gray-900 overflow-y-auto">
      {/* Header */}
      <div className="flex justify-between items-start mb-8 border-b border-gray-200 pb-6">
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/sascu-logo-ori.png" alt="SASCU" className="w-10 h-10 object-contain" />
          <div>
            <h1 className="text-lg font-bold text-gray-900">SASCU Fleet</h1>
            <p className="text-gray-500 text-xs">Honiara, Solomon Islands</p>
          </div>
        </div>
        <div className="text-right">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-400 mb-1">
            {balanceDue <= 0 ? 'Receipt' : 'Invoice'}
          </h2>
          <p className="font-semibold text-gray-900">#{booking.bookingRef}</p>
          <p className="text-gray-500 text-xs mt-0.5 capitalize">Status: {booking.status}</p>
        </div>
      </div>

      {/* Customer & Booking Info */}
      <div className="grid grid-cols-2 gap-10 mb-8">
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">Customer</h3>
          <p className="font-semibold text-gray-900">{booking.user?.name}</p>
          <p className="text-gray-600 text-sm">{booking.user?.email}</p>
          <p className="text-gray-600 text-sm">{booking.user?.phone || 'No phone provided'}</p>
          {booking.driversLicense && (
            <p className="text-gray-600 text-sm mt-1">License: {booking.driversLicense}</p>
          )}
        </div>
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">Booking Details</h3>
          <p className="font-semibold text-gray-900">
            {booking.vehicle?.make} {booking.vehicle?.model}
          </p>
          <p className="text-gray-600 text-sm">
            Plate: {booking.vehicle?.licensePlate}
          </p>
          <p className="text-gray-600 text-sm mt-1">Pickup: {formatDate(booking.startDate)}</p>
          <p className="text-gray-600 text-sm">Return: {formatDate(booking.endDate)}</p>
          <p className="text-gray-600 text-sm mt-1 capitalize">
            Rate Zone: {booking.locationType === 'out-of-town' ? 'Out of Town' : 'In Town'}
          </p>
          {booking.pickupLocation && (
            <p className="text-gray-600 text-sm mt-1">Location: {booking.pickupLocation}</p>
          )}
        </div>
      </div>

      {/* Pricing Summary */}
      <div className="mb-8 rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-4 py-2 bg-gray-50 border-b border-gray-200">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500">Pricing Summary</h3>
        </div>
        <div className="p-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Total Price</span>
            <span className="font-medium text-gray-900">SBD {booking.totalPrice?.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Amount Paid</span>
            <span className="font-medium text-green-600">SBD {totalPaid.toLocaleString()}</span>
          </div>
          <div className="border-t border-gray-100 my-2" />
          <div className="flex justify-between items-center">
            <span className="font-semibold text-gray-900">Balance Due</span>
            <span className="text-lg font-bold text-red-600">SBD {balanceDue.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Payment History */}
      {payments.filter((p) => p.status === 'succeeded').length > 0 && (
        <div className="mb-8">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">Payment History</h3>
          <div className="rounded-lg border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr className="text-left text-gray-500">
                  <th className="p-3 text-xs font-semibold uppercase tracking-wide">Method</th>
                  <th className="p-3 text-xs font-semibold uppercase tracking-wide">Date</th>
                  <th className="p-3 text-xs font-semibold uppercase tracking-wide text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {payments
                  .filter((p) => p.status === 'succeeded')
                  .map((p, i) => (
                    <tr key={i} className="border-t border-gray-100">
                      <td className="p-3 capitalize text-gray-700">{p.paymentMethod}</td>
                      <td className="p-3 text-gray-500">{new Date(p.createdAt).toLocaleDateString()}</td>
                      <td className="p-3 text-right font-medium text-gray-900">SBD {p.amount.toLocaleString()}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="text-center text-xs text-gray-400 pt-6 border-t border-gray-200">
        SASCU Fleet Management &middot; Thank you for your business
      </div>
    </div>
  );
}
