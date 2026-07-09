import { API_URL } from "./constants";
import type { Vehicle, VehicleDisplay } from "./types";

// Helper function to handle API errors
class ApiError extends Error {
  constructor(message: string, public status?: number, public data?: any) {
    super(message);
    this.name = "ApiError";
  }
}

// Helper to transform Vehicle to VehicleDisplay
function transformVehicle(vehicle: Vehicle): VehicleDisplay {
  return {
    ...vehicle,
    displayName: `${vehicle.make} ${vehicle.model}`,
  };
}

/**
 * Vehicle API Functions
 */

/**
 * Get all available vehicles
 * Maps to: GET /api/vehicles
 */
export async function getVehicles(): Promise<VehicleDisplay[]> {
  try {
    const response = await fetch(`${API_URL}/vehicles`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      // Enable credentials if using cookies for auth later
      // credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new ApiError(
        error.message || "Failed to fetch vehicles",
        response.status,
        error
      );
    }

    const vehicles: Vehicle[] = await response.json();
    return vehicles.map(transformVehicle);
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(
      "Network error: Unable to connect to the server. Please check your connection.",
      undefined,
      error
    );
  }
}

/**
 * Get a single vehicle by ID
 * Maps to: GET /api/vehicles/:id
 */
export async function getVehicleById(id: string): Promise<VehicleDisplay> {
  try {
    const response = await fetch(`${API_URL}/vehicles/${id}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new ApiError(
        error.message || "Failed to fetch vehicle",
        response.status,
        error
      );
    }

    const vehicle: Vehicle = await response.json();
    return transformVehicle(vehicle);
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(
      "Network error: Unable to connect to the server. Please check your connection.",
      undefined,
      error
    );
  }
}

/**
 * Filter vehicles by type
 * Note: This is client-side filtering since backend doesn't support type filtering yet
 */
export async function getVehiclesByType(
  type?: string
): Promise<VehicleDisplay[]> {
  const vehicles = await getVehicles();

  if (!type) {
    return vehicles;
  }

  return vehicles.filter((vehicle) => vehicle.type === type);
}

/**
 * Search vehicles by date range and type
 * Maps to: GET /api/vehicles/search?startDate=...&endDate=...&type=...
 */
export interface VehicleSearchParams {
  startDate?: string;
  endDate?: string;
  type?: string;
}

export async function searchVehicles(
  params: VehicleSearchParams
): Promise<VehicleDisplay[]> {
  try {
    // Build query parameters
    const queryParams = new URLSearchParams();
    if (params.startDate) queryParams.set("startDate", params.startDate);
    if (params.endDate) queryParams.set("endDate", params.endDate);
    if (params.type) queryParams.set("type", params.type);

    // Call backend search endpoint that filters by availability
    const response = await fetch(
      `${API_URL}/vehicles/available?${queryParams.toString()}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new ApiError(
        error.message || "Failed to search vehicles",
        response.status,
        error
      );
    }

    const result = await response.json();
    const vehicles: Vehicle[] = result.data || result;
    return vehicles.map(transformVehicle);
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(
      "Network error: Unable to connect to the server. Please check your connection.",
      undefined,
      error
    );
  }
}

/**
 * Calculate booking price
 * Helper function to calculate total price based on dates
 */
export function calculateBookingPrice(
  vehicle: VehicleDisplay,
  startDate: string,
  endDate: string
): {
  days: number;
  hours: number;
  totalPrice: number;
  priceType: "daily" | "hourly";
} {
  const start = new Date(startDate);
  const end = new Date(endDate);

  const diffMs = end.getTime() - start.getTime();
  const hours = diffMs / (1000 * 60 * 60);
  const days = hours / 24;

  // Use daily rate if >= 1 day, otherwise hourly
  if (days >= 1) {
    return {
      days: Math.ceil(days),
      hours,
      totalPrice: Math.ceil(days) * vehicle.pricePerDay,
      priceType: "daily",
    };
  } else {
    return {
      days,
      hours: Math.ceil(hours),
      totalPrice: Math.ceil(hours) * vehicle.pricePerHour,
      priceType: "hourly",
    };
  }
}

/**
 * Booking API Functions
 */

export interface GuestBookingData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  licenseNumber: string;
  vehicleId: string;
  startDate: string;
  endDate: string;
  pickupLocation?: string;
  additionalNotes?: string;
}

export interface BookingResponse {
  success: boolean;
  message: string;
  data: {
    bookingRef: string;
    booking: any;
    customerInfo: {
      name: string;
      email: string;
      phone: string;
      licenseNumber: string;
    };
  };
}

// Backend booking response structure
interface BackendBookingData {
  bookingRef: string;
  status: string;
  paymentStatus: string;
  user: {
    name: string;
    email: string;
    phone: string;
  };
  vehicle: {
    make: string;
    model: string;
    year: number;
    licensePlate: string;
    location: string;
    images?: string[];
    pricePerDay?: number;
    pricePerHour?: number;
  };
  startDate: string;
  endDate: string;
  createdAt: string;
  totalPrice: number;
  deposit: number;
  balance: number;
}

// Client-friendly tracking response
export interface TrackingResponse {
  success: boolean;
  data: {
    bookingRef: string;
    status: string;
    paymentStatus: string;
    vehicle: {
      make: string;
      model: string;
      year: number;
      licensePlate: string;
      location: string;
      images?: string[];
      pricePerDay?: number;
      pricePerHour?: number;
    };
    customer: {
      name: string;
      email: string;
      phone: string;
    };
    dates: {
      startDate: string;
      endDate: string;
      createdAt: string;
    };
    pricing: {
      totalPrice: number;
      deposit: number;
      balance: number;
    };
  };
  message?: string;
}

/**
 * Create a booking (no authentication required)
 * Maps to: POST /api/bookings
 */
export async function createBooking(
  bookingData: GuestBookingData
): Promise<BookingResponse> {
  try {
    const response = await fetch(`${API_URL}/bookings`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(bookingData),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new ApiError(
        error.message || "Failed to create booking",
        response.status,
        error
      );
    }

    return await response.json();
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(
      "Network error: Unable to connect to the server. Please check your connection.",
      undefined,
      error
    );
  }
}

/**
 * Track booking by reference number (public)
 * Maps to: GET /api/bookings/track/:bookingRef
 */
export async function trackBooking(
  bookingRef: string
): Promise<TrackingResponse> {
  try {
    const response = await fetch(`${API_URL}/bookings/track/${bookingRef}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new ApiError(
        error.message || "Booking not found",
        response.status,
        error
      );
    }

    const backendResponse: { success: boolean; data: BackendBookingData } =
      await response.json();

    // Transform backend response to client-friendly format
    return {
      success: backendResponse.success,
      data: {
        bookingRef: backendResponse.data.bookingRef,
        status: backendResponse.data.status,
        paymentStatus: backendResponse.data.paymentStatus,
        vehicle: {
          make: backendResponse.data.vehicle.make,
          model: backendResponse.data.vehicle.model,
          year: backendResponse.data.vehicle.year,
          licensePlate: backendResponse.data.vehicle.licensePlate,
          location: backendResponse.data.vehicle.location,
          images: backendResponse.data.vehicle.images,
          pricePerDay: backendResponse.data.vehicle.pricePerDay,
          pricePerHour: backendResponse.data.vehicle.pricePerHour,
        },
        customer: {
          name: backendResponse.data.user.name,
          email: backendResponse.data.user.email,
          phone: backendResponse.data.user.phone,
        },
        dates: {
          startDate: backendResponse.data.startDate,
          endDate: backendResponse.data.endDate,
          createdAt: backendResponse.data.createdAt,
        },
        pricing: {
          totalPrice: backendResponse.data.totalPrice,
          deposit: backendResponse.data.deposit,
          balance: backendResponse.data.balance,
        },
      },
    };
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(
      "Network error: Unable to connect to the server. Please check your connection.",
      undefined,
      error
    );
  }
}

/**
 * Get confirmed booked dates for a vehicle (pending bookings don't block dates)
 * Maps to: GET /api/vehicles/:id/bookings/confirmed
 */
export interface BookedDate {
  startDate: string;
  endDate: string;
  status: string;
  bookingRef: string;
}

export interface BookedDatesResponse {
  success: boolean;
  data: BookedDate[];
}

export async function getBookedDates(
  vehicleId: string
): Promise<BookedDatesResponse> {
  try {
    const response = await fetch(
      `${API_URL}/vehicles/${vehicleId}/bookings/confirmed`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new ApiError(
        error.message || "Failed to fetch booked dates",
        response.status,
        error
      );
    }

    return await response.json();
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(
      "Network error: Unable to connect to the server. Please check your connection.",
      undefined,
      error
    );
  }
}

/**
 * Check if a date range conflicts with booked dates
 */
export function checkDateConflict(
  startDate: string,
  endDate: string,
  bookedDates: BookedDate[]
): BookedDate | null {
  const start = new Date(startDate);
  const end = new Date(endDate);

  for (const booking of bookedDates) {
    const bookingStart = new Date(booking.startDate);
    const bookingEnd = new Date(booking.endDate);

    // Check if dates overlap
    if (start < bookingEnd && end > bookingStart) {
      return booking; // Return the conflicting booking
    }
  }

  return null; // No conflict
}

/**
 * Export the ApiError class for use in components
 */
export { ApiError };
