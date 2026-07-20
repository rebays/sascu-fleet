"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useState, useEffect } from "react";
import {
  getVehicleById,
  createBooking,
  type GuestBookingData,
} from "@/lib/api";
import { cn, formatCurrency, calculateDays } from "@/lib/utils";
import { VEHICLE_TYPE_DISPLAY } from "@/lib/constants";
import type { VehicleDisplay } from "@/lib/types";
import { DatePicker } from "@/components/ui/date-picker";
import { FieldError } from "@/components/ui/field-error";
import {
  Car,
  Calendar,
  MapPin,
  User,
  Mail,
  Phone,
  FileText,
  IdCard,
  AlertCircle,
  Loader2,
  ArrowRight,
} from "lucide-react";

type BookingFormErrors = {
  name?: string;
  email?: string;
  phone?: string;
  licenseNumber?: string;
  pickupDate?: string;
  returnDate?: string;
  pickupLocation?: string;
};

export function BookingPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const vehicleId = searchParams.get("vehicleId");
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");

  const [vehicle, setVehicle] = useState<VehicleDisplay | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [pickupDate, setPickupDate] = useState(startDate || "");
  const [returnDate, setReturnDate] = useState(endDate || "");
  const [fieldErrors, setFieldErrors] = useState<BookingFormErrors>({});

  const today = new Date().toISOString().split("T")[0];

  const clearFieldError = (field: keyof BookingFormErrors) => {
    setFieldErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const validateField = (
    field: keyof BookingFormErrors,
    value: string
  ): string | undefined => {
    switch (field) {
      case "name":
        return value.trim() ? undefined : "Given name is required";
      case "email":
        if (!value.trim()) return "Email address is required";
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
          ? undefined
          : "Enter a valid email address";
      case "phone":
        return value.trim() ? undefined : "Phone number is required";
      case "licenseNumber":
        return value.trim() ? undefined : "Driver license number is required";
      case "pickupDate":
        return value ? undefined : "Please select a pickup date";
      case "returnDate":
        if (!value) return "Please select a return date";
        return pickupDate && value < pickupDate
          ? "Return date can't be before the pickup date"
          : undefined;
      case "pickupLocation":
        return value ? undefined : "Please select a pickup location";
      default:
        return undefined;
    }
  };

  const handleFieldBlur = (
    field: keyof BookingFormErrors,
    value: string
  ) => {
    setFieldErrors((prev) => ({ ...prev, [field]: validateField(field, value) }));
  };

  const handlePickupDateChange = (value: string) => {
    setPickupDate(value);
    clearFieldError("pickupDate");
    // Keep the return date valid: it can never be before the pickup date
    if (returnDate && value && returnDate < value) {
      setReturnDate(value);
    }
  };

  const handleReturnDateChange = (value: string) => {
    setReturnDate(value);
    clearFieldError("returnDate");
  };

  useEffect(() => {
    async function fetchVehicle() {
      if (!vehicleId) return;

      try {
        setLoading(true);
        const data = await getVehicleById(vehicleId);
        setVehicle(data);
      } catch (err: any) {
        setError("Failed to load vehicle details");
      } finally {
        setLoading(false);
      }
    }

    fetchVehicle();
  }, [vehicleId]);

  const days =
    pickupDate && returnDate ? calculateDays(pickupDate, returnDate) : 1;

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    const formData = new FormData(e.currentTarget);
    const values = {
      name: formData.get("name") as string,
      email: formData.get("email") as string,
      phone: formData.get("phone") as string,
      licenseNumber: formData.get("licenseNumber") as string,
      pickupDate,
      returnDate,
      pickupLocation: formData.get("pickupLocation") as string,
    };

    const errors: BookingFormErrors = {};
    (Object.keys(values) as (keyof typeof values)[]).forEach((field) => {
      const message = validateField(field, values[field]);
      if (message) errors[field] = message;
    });

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setError("Please fix the highlighted fields below");
      return;
    }

    setSubmitting(true);

    if (!vehicleId) {
      setError("No vehicle selected");
      setSubmitting(false);
      return;
    }

    const bookingData: GuestBookingData = {
      name: values.name,
      email: values.email,
      phone: values.phone,
      licenseNumber: values.licenseNumber,
      memberId: (formData.get("memberId") as string) || undefined,
      vehicleId: vehicleId,
      startDate: pickupDate,
      endDate: returnDate,
      pickupLocation: values.pickupLocation,
      additionalNotes: formData.get("additionalNotes") as string,
    };

    try {
      const response = await createBooking(bookingData);
      // Redirect to confirmation page with booking reference
      router.push(
        `/booking/confirmation?trackingNumber=${response.data.bookingRef}`
      );
    } catch (err: any) {
      setError(err.message || "Failed to create booking. Please try again.");
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-card border rounded-lg p-12 text-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
        <p className="text-lg font-medium text-muted-foreground">
          Loading vehicle details...
        </p>
      </div>
    );
  }

  if (!vehicleId || !vehicle) {
    return (
      <div className="bg-destructive/10 border border-destructive/50 rounded-lg p-8">
        <div className="flex items-start gap-4">
          <AlertCircle className="h-6 w-6 text-destructive flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-xl font-bold text-destructive mb-2">
              No Vehicle Selected
            </h3>
            <p className="text-destructive/90 mb-4">
              Please select a vehicle from the vehicles page to continue with
              your booking.
            </p>
            <Link
              href="/vehicles"
              className="inline-flex items-center gap-2 rounded-md bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Browse Vehicles
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Left Column - Form */}
      <div className="lg:col-span-2">
        {/* Error Message */}
        {error && (
          <div className="bg-destructive/10 border border-destructive/50 rounded-lg p-4 mb-6 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
            <div className="text-sm text-destructive/90">{error}</div>
          </div>
        )}

        {/* Booking Form */}
        <div className="bg-card border rounded-lg p-6 md:p-8">
          <div className="flex items-center gap-2 mb-6">
            <User className="h-6 w-6 text-primary" />
            <h2 className="text-2xl font-bold">Your Information</h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Personal Information */}
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                Personal Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label
                    htmlFor="name"
                    className="text-sm font-medium mb-2 block"
                  >
                    Given Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    placeholder="John Doe"
                    onBlur={(e) => handleFieldBlur("name", e.target.value)}
                    onChange={() => clearFieldError("name")}
                    aria-invalid={!!fieldErrors.name}
                    className={cn(
                      "w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                      fieldErrors.name &&
                        "border-destructive focus-visible:ring-destructive/40"
                    )}
                  />
                  <FieldError className="mt-1.5">
                    {fieldErrors.name}
                  </FieldError>
                </div>
                <div>
                  <label
                    htmlFor="email"
                    className="text-sm font-medium mb-2 flex items-center gap-2"
                  >
                    <Mail className="h-4 w-4" />
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    placeholder="john.doe@example.com"
                    onBlur={(e) => handleFieldBlur("email", e.target.value)}
                    onChange={() => clearFieldError("email")}
                    aria-invalid={!!fieldErrors.email}
                    className={cn(
                      "w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                      fieldErrors.email &&
                        "border-destructive focus-visible:ring-destructive/40"
                    )}
                  />
                  <FieldError className="mt-1.5">
                    {fieldErrors.email}
                  </FieldError>
                </div>
                <div>
                  <label
                    htmlFor="phone"
                    className="text-sm font-medium mb-2 flex items-center gap-2"
                  >
                    <Phone className="h-4 w-4" />
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    placeholder="(555) 123-4567"
                    onBlur={(e) => handleFieldBlur("phone", e.target.value)}
                    onChange={() => clearFieldError("phone")}
                    aria-invalid={!!fieldErrors.phone}
                    className={cn(
                      "w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                      fieldErrors.phone &&
                        "border-destructive focus-visible:ring-destructive/40"
                    )}
                  />
                  <FieldError className="mt-1.5">
                    {fieldErrors.phone}
                  </FieldError>
                </div>
                <div className="md:col-span-2">
                  <label
                    htmlFor="licenseNumber"
                    className="text-sm font-medium mb-2 flex items-center gap-2"
                  >
                    <FileText className="h-4 w-4" />
                    Driver License Number
                  </label>
                  <input
                    type="text"
                    id="licenseNumber"
                    name="licenseNumber"
                    placeholder="DL123456789"
                    onBlur={(e) =>
                      handleFieldBlur("licenseNumber", e.target.value)
                    }
                    onChange={() => clearFieldError("licenseNumber")}
                    aria-invalid={!!fieldErrors.licenseNumber}
                    className={cn(
                      "w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                      fieldErrors.licenseNumber &&
                        "border-destructive focus-visible:ring-destructive/40"
                    )}
                  />
                  <FieldError className="mt-1.5">
                    {fieldErrors.licenseNumber}
                  </FieldError>
                </div>
                <div className="md:col-span-2">
                  <label
                    htmlFor="memberId"
                    className="text-sm font-medium mb-2 flex items-center gap-2"
                  >
                    <IdCard className="h-4 w-4" />
                    SASCU Member ID (Optional)
                  </label>
                  <input
                    type="text"
                    id="memberId"
                    name="memberId"
                    placeholder="e.g. SASCU-00123"
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  />
                  <p className="text-xs text-muted-foreground mt-1.5">
                    If you&apos;re a SASCU member, enter your member ID to
                    receive member pricing.
                  </p>
                </div>
              </div>
            </div>

            {/* Rental Details */}
            <div className="pt-6 border-t">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                Rental Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="pickupDate"
                    className="text-sm font-medium mb-2 block"
                  >
                    Pickup Date
                  </label>
                  <DatePicker
                    id="pickupDate"
                    value={pickupDate}
                    onChange={handlePickupDateChange}
                    min={today}
                    placeholder="Select pickup date"
                    error={!!fieldErrors.pickupDate}
                  />
                  <FieldError className="mt-1.5">
                    {fieldErrors.pickupDate}
                  </FieldError>
                </div>
                <div>
                  <label
                    htmlFor="returnDate"
                    className="text-sm font-medium mb-2 block"
                  >
                    Return Date
                  </label>
                  <DatePicker
                    id="returnDate"
                    value={returnDate}
                    onChange={handleReturnDateChange}
                    min={pickupDate || today}
                    placeholder="Select return date"
                    error={!!fieldErrors.returnDate}
                  />
                  <FieldError className="mt-1.5">
                    {fieldErrors.returnDate}
                  </FieldError>
                </div>
                <div className="md:col-span-2">
                  <label
                    htmlFor="pickupLocation"
                    className="text-sm font-medium mb-2 flex items-center gap-2"
                  >
                    <MapPin className="h-4 w-4" />
                    Pickup Location
                  </label>
                  <select
                    id="pickupLocation"
                    name="pickupLocation"
                    onBlur={(e) =>
                      handleFieldBlur("pickupLocation", e.target.value)
                    }
                    onChange={() => clearFieldError("pickupLocation")}
                    aria-invalid={!!fieldErrors.pickupLocation}
                    className={cn(
                      "w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                      fieldErrors.pickupLocation &&
                        "border-destructive focus-visible:ring-destructive/40"
                    )}
                  >
                    <option value="">Select a location</option>
                    <option value="headoffice">Henderson</option>
                  </select>
                  <FieldError className="mt-1.5">
                    {fieldErrors.pickupLocation}
                  </FieldError>
                </div>
                <div className="md:col-span-2">
                  <label
                    htmlFor="additionalNotes"
                    className="text-sm font-medium mb-2 block"
                  >
                    Additional Notes (Optional)
                  </label>
                  <textarea
                    id="additionalNotes"
                    name="additionalNotes"
                    rows={3}
                    placeholder="Any special requests or requirements..."
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  ></textarea>
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="w-full inline-flex items-center justify-center gap-2 rounded-md bg-primary px-6 py-3.5 text-base font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Processing Booking...
                </>
              ) : (
                <>
                  Confirm Booking
                  <ArrowRight className="h-5 w-5" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Right Column - Summary (Sticky) */}
      <div className="lg:col-span-1">
        <div className="lg:sticky lg:top-4 space-y-6">
          {/* Vehicle Summary */}
          <div className="bg-card border rounded-lg p-6">
            <div className="flex items-center gap-2 mb-4">
              <Car className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-bold">Your Vehicle</h3>
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Vehicle</p>
                <p className="font-semibold">{vehicle.displayName}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Type</p>
                <p className="font-semibold">
                  {VEHICLE_TYPE_DISPLAY[vehicle.type] || vehicle.type}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Year</p>
                <p className="font-semibold">{vehicle.year}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1 flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  Location
                </p>
                <p className="font-semibold">{vehicle.location}</p>
              </div>
            </div>
          </div>

          {/* Pricing Summary */}
          {pickupDate && returnDate && (
            <div className="bg-card border rounded-lg p-6">
              <div className="flex items-center gap-2 mb-4">
                <FileText className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-bold">Booking Summary</h3>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Pickup</span>
                  <span className="font-medium">{pickupDate}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Return</span>
                  <span className="font-medium">{returnDate}</span>
                </div>
                <div className="flex justify-between text-sm pb-3 border-b">
                  <span className="text-muted-foreground">Duration</span>
                  <span className="font-medium">
                    {days} day{days !== 1 ? "s" : ""}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Rate per day</span>
                  <span className="font-medium">
                    {formatCurrency(vehicle.pricePerDay)}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-3 border-t">
                  <span className="font-semibold">Total Cost</span>
                  <span className="text-2xl font-bold text-primary">
                    {formatCurrency(vehicle.pricePerDay * days)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Important Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-900">
                <p className="font-semibold mb-2">Important Information</p>
                <ul className="space-y-1 text-xs">
                  <li>• Valid driver&apos;s license required</li>
                  <li>• Deposit required at pickup</li>
                  <li>• Payment details needed</li>
                  <li>• Free cancellation up to 24hrs</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
