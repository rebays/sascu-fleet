"use client";

import Link from "next/link";
import { type TrackingResponse } from "@/lib/api";
import { VehicleImageCarousel } from "@/components/VehicleImageCarousel";
import {
  BOOKING_STATUS_DISPLAY,
  PAYMENT_STATUS_DISPLAY,
  API_URL,
} from "@/lib/constants";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  User,
  Car,
  Calendar,
  DollarSign,
  MapPin,
  AlertCircle,
  CheckCircle,
  Clock,
  Info,
} from "lucide-react";

// Helper function to get the full image URL
const getImageUrl = (imagePath: string): string => {
  if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
    return imagePath;
  }
  const baseUrl = API_URL.replace("/api", "");
  return `${baseUrl}${imagePath.startsWith("/") ? "" : "/"}${imagePath}`;
};

// Helper function to get status badge color
const getStatusColor = (status: string) => {
  switch (status) {
    case "confirmed":
      return "bg-green-100 text-green-800 border-green-200";
    case "pending":
      return "bg-yellow-100 text-yellow-800 border-yellow-200";
    case "cancelled":
      return "bg-red-100 text-red-800 border-red-200";
    case "completed":
      return "bg-blue-100 text-blue-800 border-blue-200";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
  }
};

const getPaymentStatusColor = (status: string) => {
  switch (status) {
    case "paid":
      return "bg-green-100 text-green-800 border-green-200";
    case "partial":
      return "bg-yellow-100 text-yellow-800 border-yellow-200";
    default:
      return "bg-red-100 text-red-800 border-red-200";
  }
};

export function BookingDetailsDisplay({
  bookingDetails,
}: {
  bookingDetails: TrackingResponse["data"];
}) {
  return (
    <div className="max-w-5xl mx-auto">
      {/* Status Header */}
      <div className="bg-card border rounded-lg p-8 mb-8">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle className="h-6 w-6 text-green-600" />
              <h2 className="text-3xl font-bold">Booking Found!</h2>
            </div>
            <div className="bg-muted/40 border rounded-lg p-4 inline-block">
              <p className="text-xs text-muted-foreground mb-1">
                Reference Number
              </p>
              <p className="text-2xl font-mono font-bold text-foreground tracking-wide">
                {bookingDetails.bookingRef}
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-3">
            <div
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-semibold ${getStatusColor(
                bookingDetails.status
              )}`}
            >
              <Clock className="h-5 w-5" />
              <div>
                <p className="text-xs opacity-80">Booking Status</p>
                <p>
                  {BOOKING_STATUS_DISPLAY[bookingDetails.status] ||
                    bookingDetails.status}
                </p>
              </div>
            </div>
            <div
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-semibold ${getPaymentStatusColor(
                bookingDetails.paymentStatus
              )}`}
            >
              <DollarSign className="h-5 w-5" />
              <div>
                <p className="text-xs opacity-80">Payment Status</p>
                <p>
                  {PAYMENT_STATUS_DISPLAY[bookingDetails.paymentStatus] ||
                    bookingDetails.paymentStatus}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Customer Information */}
        <div className="bg-card border rounded-lg p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-5 w-5 text-primary" />
            </div>
            <h3 className="text-lg font-bold">Customer Details</h3>
          </div>
          <div className="space-y-4">
            <div className="pb-3 border-b">
              <p className="text-xs text-muted-foreground mb-1">Name</p>
              <p className="font-semibold">{bookingDetails.customer.name}</p>
            </div>
            <div className="pb-3 border-b">
              <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                Email
              </p>
              <p className="font-semibold text-sm break-all">
                {bookingDetails.customer.email}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                Phone
              </p>
              <p className="font-semibold">{bookingDetails.customer.phone}</p>
            </div>
          </div>
        </div>

        {/* Vehicle Information */}
        <div className="bg-card border rounded-lg p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Car className="h-5 w-5 text-primary" />
            </div>
            <h3 className="text-lg font-bold">Vehicle Details</h3>
          </div>

          {/* Vehicle Image */}
          {bookingDetails.vehicle.images &&
            bookingDetails.vehicle.images.length > 0 && (
              <div className="relative bg-muted/40 h-48 rounded-lg overflow-hidden mb-4 border">
                <VehicleImageCarousel
                  images={bookingDetails.vehicle.images.map(getImageUrl)}
                  alt={`${bookingDetails.vehicle.make} ${bookingDetails.vehicle.model}`}
                  imageClassName="object-cover"
                  sizes="(max-width: 768px) 100vw, 400px"
                />
              </div>
            )}

          <div className="space-y-4">
            <div className="pb-3 border-b">
              <p className="text-xs text-muted-foreground mb-1">Vehicle</p>
              <p className="font-semibold">
                {bookingDetails.vehicle.make} {bookingDetails.vehicle.model}
              </p>
              <p className="text-sm text-muted-foreground">
                Year: {bookingDetails.vehicle.year}
              </p>
            </div>
            <div className="pb-3 border-b">
              <p className="text-xs text-muted-foreground mb-1">
                License Plate
              </p>
              <p className="font-semibold font-mono">
                {bookingDetails.vehicle.licensePlate}
              </p>
            </div>
            <div className="pb-3 border-b">
              <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                Location
              </p>
              <p className="font-semibold">{bookingDetails.vehicle.location}</p>
            </div>

            {/* Pricing Information */}
            {((bookingDetails.vehicle.pricePerDay ?? 0) > 0 ||
              (bookingDetails.vehicle.pricePerHour ?? 0) > 0) && (
              <div>
                <p className="text-xs text-muted-foreground mb-2">
                  Rental Rates
                </p>
                <div className="space-y-2">
                  {(bookingDetails.vehicle.pricePerDay ?? 0) > 0 && (
                    <div className="flex items-center justify-between bg-muted/30 rounded-md">
                      <span className="text-sm">Daily Rate</span>
                      <span className="font-semibold text-primary">
                        {formatCurrency(bookingDetails.vehicle.pricePerDay!)}
                      </span>
                    </div>
                  )}
                  {(bookingDetails.vehicle.pricePerHour ?? 0) > 0 && (
                    <div className="flex items-center justify-between bg-muted/30 rounded-md">
                      <span className="text-sm">Hourly Rate</span>
                      <span className="font-semibold text-primary">
                        {formatCurrency(bookingDetails.vehicle.pricePerHour!)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Rental Details */}
        <div className="bg-card border rounded-lg p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Calendar className="h-5 w-5 text-primary" />
            </div>
            <h3 className="text-lg font-bold">Rental Period</h3>
          </div>
          <div className="space-y-4">
            <div className="pb-3 border-b">
              <p className="text-xs text-muted-foreground mb-1">Pickup Date</p>
              <p className="font-semibold">
                {formatDate(bookingDetails.dates.startDate)}
              </p>
            </div>
            <div className="pb-3 border-b">
              <p className="text-xs text-muted-foreground mb-1">Return Date</p>
              <p className="font-semibold">
                {formatDate(bookingDetails.dates.endDate)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Booked On</p>
              <p className="font-semibold">
                {formatDate(bookingDetails.dates.createdAt)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Summary - Full Width */}
      <div className="bg-gradient-to-br from-primary/5 to-primary/10 border-2 border-primary/20 rounded-lg p-8 mb-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <DollarSign className="h-6 w-6 text-primary" />
          </div>
          <h3 className="text-2xl font-bold">Payment Summary</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-background/80 border rounded-lg p-5">
            <p className="text-sm text-muted-foreground mb-2">Total Cost</p>
            <p className="text-3xl font-bold text-primary">
              {formatCurrency(bookingDetails.pricing.totalPrice)}
            </p>
          </div>
          <div className="bg-background/80 border rounded-lg p-5">
            <p className="text-sm text-muted-foreground mb-2">Amount Paid</p>
            <p className="text-3xl font-bold text-green-600">
              {formatCurrency(bookingDetails.pricing.deposit)}
            </p>
          </div>
          <div className="bg-background/80 border rounded-lg p-5">
            <p className="text-sm text-muted-foreground mb-2">Balance Due</p>
            <p
              className={`text-3xl font-bold ${
                bookingDetails.pricing.balance > 0
                  ? "text-destructive"
                  : "text-green-600"
              }`}
            >
              {formatCurrency(bookingDetails.pricing.balance)}
            </p>
          </div>
        </div>
      </div>

      {/* Important Information */}
      <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6 md:p-8">
        <div className="flex items-start gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
            <Info className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-blue-900 mb-2">
              Important Reminders
            </h3>
            <p className="text-sm text-blue-800">
              Please review before your pickup date
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-start gap-3 p-4 bg-white/60 rounded-lg">
            <CheckCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-blue-900 mb-1">
                Required Documents
              </p>
              <p className="text-sm text-blue-800">
                Bring valid driver license and payment method
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-4 bg-white/60 rounded-lg">
            <CheckCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-blue-900 mb-1">Arrival Time</p>
              <p className="text-sm text-blue-800">
                Arrive 15 minutes before pickup time
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-4 bg-white/60 rounded-lg">
            <CheckCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-blue-900 mb-1">Modifications</p>
              <p className="text-sm text-blue-800">
                Contact us to modify your booking
              </p>
            </div>
          </div>
          {bookingDetails.pricing.balance > 0 && (
            <div className="flex items-start gap-3 p-4 bg-red-50 border-2 border-red-200 rounded-lg">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-red-900 mb-1">
                  Payment Required
                </p>
                <p className="text-sm text-red-800">
                  Balance of {formatCurrency(bookingDetails.pricing.balance)}{" "}
                  due before pickup
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
