import Link from "next/link";
import { Suspense } from "react";
import Breadcrumb from "@/components/Breadcrumb";
import {
  CheckCircle,
  Info,
  Mail,
  Phone,
  Clock,
  ArrowRight,
  FileText,
  CreditCard,
  Search,
  Home,
  Car,
} from "lucide-react";
import { BookingConfirmationContent } from "./BookingConfirmationContent";

export default function BookingConfirmationPage() {
  return (
    <div className="-mt-[108px] md:-mt-[88px]">
      {/* Hero Section - Success Style */}
      <section className="relative bg-gradient-to-br from-green-50 via-green-50/50 to-background border-b border-green-200">
        <div className="container mx-auto px-4 md:px-8 pt-36 md:pt-24 pb-16">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 border-4 border-green-200 mb-6">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
              Booking Confirmed!
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Thank you for choosing SASCU. Your reservation has been
              successfully submitted.
            </p>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="container mx-auto px-4 md:px-8 py-12">
        <div className="max-w-3xl mx-auto">
          {/* Breadcrumb */}
          <div className="mb-8">
            <Breadcrumb
              items={[
                { label: "Vehicles", href: "/vehicles" },
                { label: "Complete Booking", href: "/booking" },
                { label: "Confirmation" },
              ]}
            />
          </div>

          {/* Tracking Number - Wrapped in Suspense */}
          <Suspense fallback={<div className="h-32 animate-pulse bg-muted/20 rounded-lg mb-8" />}>
            <BookingConfirmationContent />
          </Suspense>

          {/* What Happens Next - Timeline Style */}
          <div className="bg-card border rounded-lg p-8 mb-8">
            <div className="flex items-center gap-2 mb-6">
              <Info className="h-6 w-6 text-primary" />
              <h3 className="text-2xl font-bold">What Happens Next?</h3>
            </div>
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="w-8 h-8 rounded-full bg-primary/10 border-2 border-primary flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold text-primary">1</span>
                  </div>
                  <div className="w-0.5 h-full bg-primary/20 mt-2"></div>
                </div>
                <div className="pb-6">
                  <h4 className="font-semibold mb-1 flex items-center gap-2">
                    <Mail className="h-4 w-4 text-primary" />
                    Confirmation Email
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    You&apos;ll receive a confirmation email with all booking
                    details within minutes
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="w-8 h-8 rounded-full bg-primary/10 border-2 border-primary flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold text-primary">2</span>
                  </div>
                  <div className="w-0.5 h-full bg-primary/20 mt-2"></div>
                </div>
                <div className="pb-6">
                  <h4 className="font-semibold mb-1 flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-primary" />
                    Booking Review
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Our team will review and verify your reservation details
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="w-8 h-8 rounded-full bg-primary/10 border-2 border-primary flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold text-primary">3</span>
                  </div>
                  <div className="w-0.5 h-full bg-primary/20 mt-2"></div>
                </div>
                <div className="pb-6">
                  <h4 className="font-semibold mb-1 flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-primary" />
                    Payment Link
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    You&apos;ll receive a secure payment link to complete your
                    reservation
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="w-8 h-8 rounded-full bg-primary/10 border-2 border-primary flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold text-primary">4</span>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold mb-1 flex items-center gap-2">
                    <FileText className="h-4 w-4 text-primary" />
                    Rental Agreement
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Once payment is confirmed, you&apos;ll receive your rental
                    agreement
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="bg-card border rounded-lg p-8 mb-8">
            <div className="flex items-center gap-2 mb-6">
              <Phone className="h-6 w-6 text-primary" />
              <h3 className="text-2xl font-bold">Need Assistance?</h3>
            </div>
            <p className="text-muted-foreground mb-6">
              Our team is here to help with any questions about your booking
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-start gap-3 p-4 bg-muted/20 rounded-lg border">
                <Mail className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-sm mb-1">Email</p>
                  <p className="text-sm text-muted-foreground">
                    bookings@sascufleet.com
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 bg-muted/20 rounded-lg border">
                <Phone className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-sm mb-1">Phone</p>
                  <p className="text-sm text-muted-foreground">
                    (555) 123-4567
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 bg-muted/20 rounded-lg border">
                <Clock className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-sm mb-1">Hours</p>
                  <p className="text-sm text-muted-foreground">
                    Mon-Fri, 8AM - 6PM
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-gradient-to-br from-muted/40 via-muted/20 to-background border rounded-lg p-8">
            <h3 className="text-xl font-bold mb-6 text-center">
              What would you like to do next?
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link
                href="/track-booking"
                className="group flex flex-col items-center gap-3 p-6 bg-card border rounded-lg transition-all hover:shadow-md hover:border-primary/50"
              >
                <div className="text-center">
                  <h4 className="font-semibold mb-1">Track Booking</h4>
                  <p className="text-xs text-muted-foreground">
                    Check your booking status
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>

              <Link
                href="/vehicles"
                className="group flex flex-col items-center gap-3 p-6 bg-card border rounded-lg transition-all hover:shadow-md hover:border-primary/50"
              >
                <div className="text-center">
                  <h4 className="font-semibold mb-1">Browse Vehicles</h4>
                  <p className="text-xs text-muted-foreground">
                    Explore more options
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>

              <Link
                href="/"
                className="group flex flex-col items-center gap-3 p-6 bg-card border rounded-lg transition-all hover:shadow-md hover:border-primary/50"
              >
                <div className="text-center">
                  <h4 className="font-semibold mb-1">Back to Home</h4>
                  <p className="text-xs text-muted-foreground">
                    Return to homepage
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
