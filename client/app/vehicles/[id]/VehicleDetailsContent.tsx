"use client";

import Link from "next/link";
import Image from "next/image";
import { useSearchParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import {
  getVehicleById,
  calculateBookingPrice,
  getBookedDates,
  checkDateConflict,
  type BookedDate,
} from "@/lib/api";
import { VEHICLE_TYPE_DISPLAY, API_URL } from "@/lib/constants";
import { formatCurrency } from "@/lib/utils";
import type { VehicleDisplay } from "@/lib/types";
import { DatePicker } from "@/components/ui/date-picker";
import { FieldError } from "@/components/ui/field-error";
import {
  Car,
  Bike,
  Truck,
  MapPin,
  Calendar,
  AlertCircle,
  CheckCircle,
  XCircle,
  Info,
  Loader2,
  Clock,
} from "lucide-react";

// Map vehicle types to icons
const VehicleIcon = ({ type }: { type: string }) => {
  const iconClass = "h-8 w-8";
  switch (type) {
    case "bike":
    case "scooter":
      return <Bike className={iconClass} />;
    case "truck":
      return <Truck className={iconClass} />;
    default:
      return <Car className={iconClass} />;
  }
};

// Helper function to get the full image URL
const getImageUrl = (imagePath: string): string => {
  // If it's already a full URL, return as-is
  if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
    return imagePath;
  }
  // Otherwise, construct URL using backend base URL
  const baseUrl = API_URL.replace("/api", "");
  return `${baseUrl}${imagePath.startsWith("/") ? "" : "/"}${imagePath}`;
};

export function VehicleDetailsContent({ id }: { id: string }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [vehicle, setVehicle] = useState<VehicleDisplay | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bookedDates, setBookedDates] = useState<BookedDate[]>([]);
  const [dateConflict, setDateConflict] = useState<BookedDate | null>(null);

  const startDateFromUrl = searchParams.get("startDate");
  const endDateFromUrl = searchParams.get("endDate");

  const [startDate, setStartDate] = useState(startDateFromUrl || "");
  const [endDate, setEndDate] = useState(endDateFromUrl || "");
  const [dateErrors, setDateErrors] = useState<{
    startDate?: string;
    endDate?: string;
  }>({});

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    async function fetchVehicleData() {
      try {
        setLoading(true);
        setError(null);

        // Fetch vehicle details and booked dates in parallel
        const [vehicleData, bookedDatesData] = await Promise.all([
          getVehicleById(id),
          getBookedDates(id),
        ]);

        setVehicle(vehicleData);
        setBookedDates(bookedDatesData.data || []);
      } catch (err: any) {
        setError(err.message || "Failed to load vehicle");
        setVehicle(null);
      } finally {
        setLoading(false);
      }
    }

    fetchVehicleData();
  }, [id]);

  // Sync state with URL params
  useEffect(() => {
    if (startDateFromUrl) setStartDate(startDateFromUrl);
    if (endDateFromUrl) setEndDate(endDateFromUrl);
  }, [startDateFromUrl, endDateFromUrl]);

  // Validate dates whenever they change
  useEffect(() => {
    if (startDate && endDate && bookedDates && bookedDates.length > 0) {
      const conflict = checkDateConflict(startDate, endDate, bookedDates);
      setDateConflict(conflict);
    } else {
      setDateConflict(null);
    }
  }, [startDate, endDate, bookedDates]);

  const handleStartDateChange = (value: string) => {
    setStartDate(value);
    setDateErrors((prev) => ({ ...prev, startDate: undefined }));
    // Keep the end date valid: it can never be before the start date
    if (endDate && value && endDate < value) {
      setEndDate(value);
    }
  };

  const handleEndDateChange = (value: string) => {
    setEndDate(value);
    setDateErrors((prev) => ({ ...prev, endDate: undefined }));
  };

  const handleBookNow = () => {
    const errors: { startDate?: string; endDate?: string } = {};
    if (!startDate) errors.startDate = "Please select a pickup date";
    if (!endDate) errors.endDate = "Please select a return date";
    if (Object.keys(errors).length > 0) {
      setDateErrors(errors);
      return;
    }

    if (dateConflict) {
      return;
    }

    router.push(
      `/booking?vehicleId=${vehicle?._id}&startDate=${startDate}&endDate=${endDate}`
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading vehicle details...</p>
        </div>
      </div>
    );
  }

  if (error || !vehicle) {
    return (
      <>
        {error && (
          <div className="bg-destructive/10 border border-destructive/50 rounded-lg p-6 mb-8 max-w-2xl mx-auto">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-lg font-semibold text-destructive mb-2">
                  Error Loading Vehicle
                </h3>
                <p className="text-destructive/90 mb-2">{error}</p>
                <p className="text-sm text-destructive/70">
                  Make sure the backend server is running
                </p>
              </div>
            </div>
          </div>
        )}
        <div className="text-center">
          <Link
            href="/vehicles"
            className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Back to Vehicles
          </Link>
        </div>
      </>
    );
  }

  const pricing =
    startDate && endDate && vehicle
      ? calculateBookingPrice(vehicle, startDate, endDate)
      : null;

  const halfDayRate =
    vehicle.pricePerHalfDay && vehicle.pricePerHalfDay > 0
      ? vehicle.pricePerHalfDay
      : vehicle.pricePerDay / 2;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Left Column - Vehicle Details */}
      <div className="lg:col-span-2 space-y-6">
        {/* Vehicle Image */}
        <div className="relative bg-muted/40 rounded-lg h-96 border overflow-hidden">
          {vehicle.images && vehicle.images.length > 0 ? (
            <Image
              src={getImageUrl(vehicle.images[0])}
              alt={vehicle.displayName}
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 66vw"
              priority
            />
          ) : (
            <div className="h-full flex items-center justify-center">
              <VehicleIcon type={vehicle.type} />
            </div>
          )}
        </div>

        {/* Vehicle Specifications */}
        <div className="bg-card border rounded-lg p-6">
          <h2 className="text-2xl font-bold mb-4">Vehicle Specifications</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Make</p>
              <p className="font-semibold">{vehicle.make}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Model</p>
              <p className="font-semibold">{vehicle.model}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Year</p>
              <p className="font-semibold">{vehicle.year}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">
                License Plate
              </p>
              <p className="font-semibold">{vehicle.licensePlate}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Location</p>
              <p className="font-semibold">{vehicle.location}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Daily Rate</p>
              <p className="font-semibold text-primary">
                {formatCurrency(vehicle.pricePerDay)}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">
                Half-Day Rate
              </p>
              <p className="font-semibold text-primary">
                {formatCurrency(halfDayRate)}
              </p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-4 flex items-start gap-1.5">
            <Info className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
            Rentals of 12 hours or less are charged the half-day rate.
            Rentals longer than 12 hours are charged the full daily rate.
          </p>
        </div>

        {vehicle.description && (
          <div className="bg-card border rounded-lg p-6">
            <h2 className="text-2xl font-bold mb-4">Description</h2>
            <p className="text-muted-foreground leading-relaxed">
              {vehicle.description}
            </p>
          </div>
        )}

        {vehicle.features && vehicle.features.length > 0 && (
          <div className="bg-card border rounded-lg p-6">
            <h2 className="text-2xl font-bold mb-4">Features</h2>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {vehicle.features.map((feature, index) => (
                <li key={index} className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Rental Terms & Policies */}
        <div className="bg-card border rounded-lg p-6">
          <h2 className="text-2xl font-bold mb-4">
            Rental Terms & Policies
          </h2>
          <div className="space-y-4 text-sm">
            <div>
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                Pricing
              </h3>
              <p className="text-muted-foreground">
                Rentals of 12 hours or less are charged the half-day rate.
                Rentals of more than 12 hours are charged the full daily rate.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <Info className="h-4 w-4 text-primary" />
                Driver Requirements
              </h3>
              <p className="text-muted-foreground">
                Valid driver's license required. Minimum age: 21 years.
                Additional fees may apply for drivers under 25.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-primary" />
                Insurance Coverage
              </h3>
              <p className="text-muted-foreground">
                Basic insurance included. Optional comprehensive coverage
                available at checkout.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-primary" />
                Cancellation Policy
              </h3>
              <p className="text-muted-foreground">
                Free cancellation up to 24 hours before pickup. Cancellations
                within 24 hours subject to 50% fee.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" />
                Pickup & Return
              </h3>
              <p className="text-muted-foreground">
                Vehicle must be picked up and returned to the same location.
                Late returns subject to additional daily rate.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Column - Booking Widget */}
      <div className="lg:col-span-1">
        <div className="bg-card border rounded-lg p-6 lg:sticky lg:top-24">
          <h3 className="text-2xl font-bold mb-6">Reserve Vehicle</h3>

          {/* Show booked dates information */}
          {bookedDates && bookedDates.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-2">
                <Info className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-yellow-900 mb-2">
                    Currently Booked Dates
                  </h4>
                  <ul className="text-sm text-yellow-800 space-y-1">
                    {bookedDates.map((booking, index) => (
                      <li key={index}>
                        {new Date(booking.startDate).toLocaleDateString()} -{" "}
                        {new Date(booking.endDate).toLocaleDateString()}
                        <span className="text-yellow-600">
                          {" "}
                          ({booking.status})
                        </span>
                      </li>
                    ))}
                  </ul>
                  <p className="text-xs text-yellow-700 mt-2">
                    Please select dates that don't overlap
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Date Selection */}
          <div className="space-y-4 mb-6">
            <div>
              <label
                htmlFor="startDate"
                className="text-sm font-medium flex items-center gap-2 mb-2"
              >
                <Calendar className="h-4 w-4" />
                Pickup Date <span className="text-destructive">*</span>
              </label>
              <DatePicker
                id="startDate"
                value={startDate}
                onChange={handleStartDateChange}
                min={new Date().toISOString().split("T")[0]}
                placeholder="Select pickup date"
                error={!!dateErrors.startDate}
              />
              <FieldError className="mt-2">{dateErrors.startDate}</FieldError>
            </div>

            <div>
              <label
                htmlFor="endDate"
                className="text-sm font-medium flex items-center gap-2 mb-2"
              >
                <Calendar className="h-4 w-4" />
                Return Date <span className="text-destructive">*</span>
              </label>
              <DatePicker
                id="endDate"
                value={endDate}
                onChange={handleEndDateChange}
                min={startDate || new Date().toISOString().split("T")[0]}
                placeholder="Select return date"
                error={!!dateErrors.endDate}
              />
              <FieldError className="mt-2">{dateErrors.endDate}</FieldError>
            </div>
          </div>

          {/* Pricing Summary */}
          {pricing && (
            <div className="bg-muted/50 rounded-lg p-4 mb-6">
              <h4 className="font-semibold mb-3">Rental Summary</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Duration</span>
                  <span className="font-medium">
                    {pricing.days} day{pricing.days !== 1 ? "s" : ""}
                    {pricing.priceType === "hourly" &&
                      ` (${pricing.hours} hours)`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Rate</span>
                  <span className="font-medium">
                    {formatCurrency(vehicle.pricePerDay)}/day
                  </span>
                </div>
                <div className="flex justify-between pt-2 border-t">
                  <span className="font-semibold">Total Cost</span>
                  <span className="text-xl font-bold text-primary">
                    {formatCurrency(pricing.totalPrice)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Validation Status */}
          {dateConflict && startDate && endDate ? (
            <div className="bg-destructive/10 border border-destructive/50 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <XCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-destructive mb-1">
                    Date Conflict Detected
                  </p>
                  <p className="text-sm text-destructive/90 mb-1">
                    Your dates conflict with booking {dateConflict.bookingRef}
                  </p>
                  <p className="text-xs text-destructive/70">
                    {new Date(dateConflict.startDate).toLocaleDateString()} -{" "}
                    {new Date(dateConflict.endDate).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          ) : startDate && endDate ? (
            <>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-green-900">
                      Available for your dates!
                    </p>
                    <p className="text-sm text-green-700 mt-1">
                      Click below to proceed with booking
                    </p>
                  </div>
                </div>
              </div>
              <button
                onClick={handleBookNow}
                className="w-full inline-flex items-center justify-center gap-2 rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                Reserve
              </button>
            </>
          ) : (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-blue-900">
                  Select both pickup and return dates to see pricing and check
                  availability
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
