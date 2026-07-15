"use client";

import { useSearchParams } from "next/navigation";
import { FormEvent, useState, useEffect } from "react";
import { trackBooking, type TrackingResponse } from "@/lib/api";
import { cn } from "@/lib/utils";
import { FieldError } from "@/components/ui/field-error";
import {
  Search,
  Info,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { BookingDetailsDisplay } from "./BookingDetailsDisplay";

export function TrackBookingContent() {
  const searchParams = useSearchParams();
  const [trackingNumber, setTrackingNumber] = useState("");
  const [bookingDetails, setBookingDetails] = useState<
    TrackingResponse["data"] | null
  >(null);
  const [error, setError] = useState("");
  const [fieldError, setFieldError] = useState("");
  const [isExpired, setIsExpired] = useState(false);
  const [loading, setLoading] = useState(false);

  // Check for URL parameter and auto-search
  useEffect(() => {
    const refParam = searchParams.get("ref");
    if (refParam) {
      setTrackingNumber(refParam);
      // Automatically search when coming from homepage
      searchBooking(refParam);
    }
  }, [searchParams]);

  const searchBooking = async (bookingRef: string) => {
    setError("");
    setIsExpired(false);
    setBookingDetails(null);
    setLoading(true);

    try {
      const response = await trackBooking(bookingRef.trim());
      setBookingDetails(response.data);
    } catch (err: any) {
      // Check if it's an expired booking error (400 status)
      if (
        err.status === 400 &&
        err.message?.toLowerCase().includes("expired")
      ) {
        setIsExpired(true);
        setError(err.message || "This booking has expired.");
      } else {
        setError(
          err.message ||
            "Failed to track booking. Please check your reference number."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!trackingNumber.trim()) {
      setFieldError("Please enter your booking reference number");
      return;
    }

    searchBooking(trackingNumber);
  };

  return (
    <>
      {/* Search Form */}
      <div className="max-w-2xl mx-auto mb-12">
        <div className="bg-card border rounded-lg p-8 md:p-10">
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Search className="h-6 w-6 text-primary" />
            </div>
            <h2 className="text-2xl font-bold">Track Booking</h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="trackingNumber"
                className="text-sm font-medium mb-3 block"
              >
                Booking Reference Number
              </label>
              <input
                type="text"
                id="trackingNumber"
                name="trackingNumber"
                placeholder="BOOK-20260102-001"
                value={trackingNumber}
                onChange={(e) => {
                  setTrackingNumber(e.target.value);
                  setFieldError("");
                }}
                aria-invalid={!!fieldError}
                className={cn(
                  "w-full rounded-md border border-input bg-background px-4 py-3 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                  fieldError &&
                    "border-destructive focus-visible:ring-destructive/40"
                )}
              />
              <FieldError className="mt-2">{fieldError}</FieldError>
              <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                <Info className="h-3 w-3" />
                Format: BOOK-YYYYMMDD-XXX (e.g., BOOK-20260102-001)
              </p>
            </div>

            <button
              type="submit"
              className="w-full inline-flex items-center justify-center gap-2 rounded-md bg-primary px-6 py-3.5 text-base font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 cursor-pointer"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Searching...
                </>
              ) : (
                <>Track My Booking</>
              )}
            </button>
          </form>

          {error && (
            <div
              className={`mt-6 border rounded-lg p-5 ${
                isExpired
                  ? "bg-yellow-50 border-yellow-300"
                  : "bg-destructive/10 border-destructive/50"
              }`}
            >
              <div className="flex items-start gap-3">
                <AlertCircle
                  className={`h-6 w-6 flex-shrink-0 mt-0.5 ${
                    isExpired ? "text-yellow-600" : "text-destructive"
                  }`}
                />
                <div>
                  <h3
                    className={`font-semibold mb-1 ${
                      isExpired ? "text-yellow-900" : "text-destructive"
                    }`}
                  >
                    {isExpired ? "Booking Expired" : "Booking Not Found"}
                  </h3>
                  <p
                    className={`text-sm ${
                      isExpired ? "text-yellow-800" : "text-destructive/90"
                    }`}
                  >
                    {error}
                  </p>
                  {isExpired && (
                    <p className="text-sm text-yellow-800 mt-2">
                      This booking has passed its end date and is no longer
                      active. For assistance, please contact support.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Booking Details */}
      {bookingDetails && <BookingDetailsDisplay bookingDetails={bookingDetails} />}
    </>
  );
}
