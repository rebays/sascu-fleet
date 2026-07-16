import Link from "next/link";
import { Suspense } from "react";
import Breadcrumb from "@/components/Breadcrumb";
import { Info, Loader2 } from "lucide-react";
import { TrackBookingContent } from "./TrackBookingContent";

export default function TrackBookingPage() {
  return (
    <div>
      {/* Hero Section */}
      <section className="relative bg-linear-to-br from-primary/10 via-primary/5 to-background border-b">
        <div className="container mx-auto px-4 md:px-8 py-16">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
              Track Your Booking
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Enter your booking reference to view your reservation details and
              status
            </p>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="container mx-auto px-4 md:px-8 py-12">
        {/* Breadcrumb */}
        <div className="mb-8">
          <Breadcrumb items={[{ label: "Track Booking" }]} />
        </div>

        <Suspense
          fallback={
            <div className="max-w-2xl mx-auto">
              <div className="bg-card border rounded-lg p-12 text-center">
                <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
                <p className="text-lg font-medium text-muted-foreground">
                  Loading tracking form...
                </p>
              </div>
            </div>
          }
        >
          <TrackBookingContent />
        </Suspense>

        {/* Help Section - Always visible */}
        <div className="max-w-2xl mx-auto mt-12">
          <div className="bg-card border rounded-lg p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-muted/40 flex items-center justify-center mx-auto mb-4">
              <Info className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-bold mb-2">Need Help?</h3>
            <p className="text-muted-foreground mb-6">
              Can&apos;t find your booking reference or having issues?
            </p>
            <Link
              href="/about"
              className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Contact Support
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
