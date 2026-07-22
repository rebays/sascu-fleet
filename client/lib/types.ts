// API Response Types matching backend models

export type VehicleType = 'car' | 'bike' | 'scooter' | 'truck' | 'suv' | 'bus';

export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed';

export type PaymentStatus = 'pending' | 'partial' | 'paid' | 'failed' | 'refunded';

export type UserRole = 'user' | 'admin';

// Vehicle Model (from backend/models/Vehicle.js)
export interface Vehicle {
  _id: string;
  make: string;
  model: string;
  year: number;
  type: VehicleType;
  licensePlate: string;
  pricePerHour: number;
  pricePerDay: number;
  pricePerDayMember?: number;
  pricePerHalfDay?: number;
  pricePerHalfDayMember?: number;
  pricePerDayOutOfTown?: number;
  pricePerDayMemberOutOfTown?: number;
  pricePerHalfDayOutOfTown?: number;
  pricePerHalfDayMemberOutOfTown?: number;
  location: string;
  status?: 'active' | 'inactive';
  image?: string;
  images?: string[]; // Backend returns images array
  createdAt: string;
  updatedAt: string;
}

// Booking Model (from backend/models/Booking.js)
export interface Booking {
  _id: string;
  user: string | User;
  vehicle: string | Vehicle;
  startDate: string;
  endDate: string;
  totalPrice: number;
  bookingRef: string;
  deposit: number;
  balance: number;
  memberId?: string;
  status: BookingStatus;
  paymentStatus: PaymentStatus;
  payments: Payment[];
  createdAt: string;
  updatedAt: string;
}

// User Model (from backend/models/User.js)
export interface User {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  memberId?: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

// Payment Model (from backend/models/Payment.js)
export interface Payment {
  _id: string;
  booking: string;
  bookingRef: string;
  amount: number;
  paymentMethod: 'stripe' | 'card' | 'cash' | 'bank_transfer' | 'manual';
  status: 'pending' | 'succeeded' | 'failed' | 'refunded';
  paidBy?: string | User;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// Invoice Model (from backend/models/Invoice.js)
export interface Invoice {
  _id: string;
  booking: string | Booking;
  bookingRef: string;
  invoiceNumber: string;
  issueDate: string;
  dueDate?: string;
  totalAmount: number;
  paidAmount: number;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  sentAt?: string;
  paidAt?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// API Response wrappers
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface ApiError {
  success: false;
  message: string;
}

// Helper type for client-side display
export interface VehicleDisplay extends Vehicle {
  displayName: string; // Computed: `${make} ${model}`
  capacity?: number; // To be added to backend later
  features?: string[]; // To be added to backend later
  description?: string; // To be added to backend later
}
