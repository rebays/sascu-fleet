"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState, useEffect } from "react";
import { getVehicles } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { VehicleDisplay } from "@/lib/types";
import { DatePicker } from "@/components/ui/date-picker";
import { FieldError } from "@/components/ui/field-error";
import { VehicleCard } from "@/components/VehicleCard";
import {
  Search,
  Calendar,
  Car,
  CheckCircle,
  Shield,
  Clock,
  Headphones,
  ArrowRight,
} from "lucide-react";

export default function Home() {
  const router = useRouter();
  const [vehicles, setVehicles] = useState<VehicleDisplay[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchStartDate, setSearchStartDate] = useState("");
  const [searchEndDate, setSearchEndDate] = useState("");
  const [searchErrors, setSearchErrors] = useState<{
    startDate?: string;
    endDate?: string;
  }>({});
  const [bookingRefError, setBookingRefError] = useState("");

  const today = new Date().toISOString().split("T")[0];

  const handleStartDateChange = (value: string) => {
    setSearchStartDate(value);
    setSearchErrors((prev) => ({ ...prev, startDate: undefined }));
    // Keep the return date valid: it can never be before the pickup date
    if (searchEndDate && value && searchEndDate < value) {
      setSearchEndDate(value);
    }
  };

  const handleEndDateChange = (value: string) => {
    setSearchEndDate(value);
    setSearchErrors((prev) => ({ ...prev, endDate: undefined }));
  };

  useEffect(() => {
    async function fetchVehicles() {
      try {
        const data = await getVehicles();
        setVehicles(data.slice(0, 6)); // Show only first 6 vehicles
      } catch (error) {
        console.error("Failed to fetch vehicles:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchVehicles();
  }, []);

  const handleSearch = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const errors: { startDate?: string; endDate?: string } = {};
    if (!searchStartDate) errors.startDate = "Please select a pickup date";
    if (!searchEndDate) errors.endDate = "Please select a return date";
    if (Object.keys(errors).length > 0) {
      setSearchErrors(errors);
      return;
    }

    const formData = new FormData(e.currentTarget);
    const vehicleType = formData.get("vehicleType");

    const params = new URLSearchParams();
    params.set("startDate", searchStartDate);
    params.set("endDate", searchEndDate);
    if (vehicleType) params.set("type", vehicleType.toString());

    router.push(`/vehicles/search?${params.toString()}`);
  };

  const handleTrackBooking = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const bookingRef = (formData.get("bookingRef") as string).trim();

    if (!bookingRef) {
      setBookingRefError("Please enter your booking reference number");
      return;
    }

    router.push(`/track-booking?ref=${encodeURIComponent(bookingRef)}`);
  };

  return (
    <div className="-mt-16 lg:-mt-[88px] mb-0">
      {/* Hero Section with Search Overlay */}
      <section className="relative h-screen flex items-center pt-16 lg:pt-24">
        {/* Background Video with Overlay */}
        <div className="absolute inset-0 overflow-hidden">
          <video
            className="absolute inset-0 h-full w-full object-cover opacity-60"
            src="/hero-vid.webm"
            autoPlay
            loop
            muted
            playsInline
          />
          <div className="absolute inset-0 bg-linear-to-b from-green-950/80 to-green-950"></div>
        </div>

        {/* Content Container */}
        <div className="container mx-auto px-4 md:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            {/* Hero Text - Left Side */}
            <div className="text-white">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-4 text-white">
                 <span className="text-primary">Book.</span> Drive. Repeat.
              </h1>
              <p className="text-lg md:text-xl text-gray-300 max-w-2xl mb-6">
                The Official Vehicle Booking Platform for SASCU.
              </p>
            </div>

            {/* Search Widget - Right Side */}
            <div className="w-full lg:w-[420px] lg:ml-auto">
              <div className="bg-card/95 backdrop-blur border rounded-lg shadow-2xl p-6 md:p-8">
                {/* <div className="flex items-center gap-2 mb-6"> */}
                {/* <Search className="h-5 w-5 text-primary" /> */}
                {/* <h2 className="text-2xl font-bold">Find A Ride</h2>
                </div> */}

                <form onSubmit={handleSearch}>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label
                        htmlFor="startDate"
                        className="text-sm font-medium flex items-center gap-2"
                      >
                        <Calendar className="h-4 w-4" />
                        Pickup Date
                      </label>
                      <DatePicker
                        id="startDate"
                        value={searchStartDate}
                        onChange={handleStartDateChange}
                        min={today}
                        placeholder="Select pickup date"
                        error={!!searchErrors.startDate}
                      />
                      <FieldError>{searchErrors.startDate}</FieldError>
                    </div>

                    <div className="space-y-2">
                      <label
                        htmlFor="endDate"
                        className="text-sm font-medium flex items-center gap-2"
                      >
                        <Calendar className="h-4 w-4" />
                        Return Date
                      </label>
                      <DatePicker
                        id="endDate"
                        value={searchEndDate}
                        onChange={handleEndDateChange}
                        min={searchStartDate || today}
                        placeholder="Select return date"
                        error={!!searchErrors.endDate}
                      />
                      <FieldError>{searchErrors.endDate}</FieldError>
                    </div>

                    <div className="space-y-2">
                      <label
                        htmlFor="vehicleType"
                        className="text-sm font-medium flex items-center gap-2"
                      >
                        <Car className="h-4 w-4" />
                        Vehicle Type
                      </label>
                      <select
                        id="vehicleType"
                        name="vehicleType"
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      >
                        <option value="">All Types</option>
                        <option value="car">Car</option>
                        <option value="truck">Truck</option>
                        <option value="bike">Bike</option>
                        <option value="scooter">Scooter</option>
                      </select>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full mt-6 inline-flex items-center justify-center gap-2 rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 cursor-pointer"
                  >
                    Search Vehicles
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Vehicles Section */}
      <section className="container mx-auto px-4 md:px-8 py-16 bg-white">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-primary">Our Fleet</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Choose from our diverse selection of well-maintained vehicles
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="aspect-[4/5] w-full animate-pulse rounded-2xl border-4 border-white bg-muted shadow-lg"
              ></div>
            ))}
          </div>
        ) : vehicles.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {vehicles.map((vehicle) => (
                <VehicleCard
                  key={vehicle._id}
                  vehicle={vehicle}
                  href={`/vehicles/${vehicle._id}`}
                />
              ))}
            </div>
            <div className="text-center mt-12">
              <Link
                href="/vehicles"
                className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-8 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              >
                View All Vehicles
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </>
        ) : (
          <div className="text-center py-12">
            <Car className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No vehicles available</p>
          </div>
        )}
      </section>

      {/* Track Booking Section */}
      <section className="relative h-[80vh] lg:h-[66vh] min-h-[500px] flex items-center mb-0">
        {/* Background Image with Overlay */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage:
              "url('https://images.pexels.com/photos/1557652/pexels-photo-1557652.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2')",
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-l from-black/70 via-black/50 to-black/30"></div>
        </div>

        {/* Content Container */}
        <div className="container mx-auto px-4 md:px-8 relative z-10">
          <div className="flex flex-col lg:grid lg:grid-cols-2 gap-8 lg:items-center">
            {/* Track Booking Info - First on Mobile, Right Side on Desktop */}
            <div className="text-white lg:order-2 lg:ml-auto">
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-4">
                Stay Updated
              </h2>
              <p className="text-lg md:text-xl text-white/90 max-w-2xl mb-6">
                Track your booking status and get real-time updates on your
                reservation
              </p>
            </div>

            {/* Track Booking Widget - Second on Mobile, Left Side on Desktop */}
            <div className="w-full lg:w-[420px] lg:order-1">
              <div className="bg-card/95 backdrop-blur border rounded-lg shadow-2xl p-6 md:p-8">
                {/* <h2 className="text-2xl font-bold mb-6">Track Your Booking</h2> */}

                <form onSubmit={handleTrackBooking}>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label
                        htmlFor="bookingRef"
                        className="text-sm font-medium flex items-center gap-2"
                      >
                        <Search className="h-4 w-4" />
                        Booking Reference
                      </label>
                      <input
                        type="text"
                        id="bookingRef"
                        name="bookingRef"
                        placeholder="BOOK-20260104-001"
                        onChange={() => setBookingRefError("")}
                        aria-invalid={!!bookingRefError}
                        className={cn(
                          "w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                          bookingRefError &&
                            "border-destructive focus-visible:ring-destructive/40"
                        )}
                      />
                      <FieldError className="mt-1.5">
                        {bookingRefError}
                      </FieldError>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full mt-6 inline-flex items-center justify-center gap-2 rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 cursor-pointer"
                  >
                    Track Booking
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
