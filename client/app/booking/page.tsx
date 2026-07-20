import { Suspense } from "react";
import Breadcrumb from "@/components/Breadcrumb";
import { Loader2 } from "lucide-react";
import { BookingPageContent } from "./BookingPageContent";

export default function BookingPage() {
  return (
    <div className="-mt-[108px] md:-mt-[88px]">
      {/* Hero Section */}
      <section className="relative bg-linear-to-br from-primary/10 via-primary/5 to-background border-b">
        <div className="container mx-auto px-4 md:px-8 pt-36 md:pt-24 pb-16">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
              Complete Your Booking
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Just a few details and you&apos;re ready to hit the road
            </p>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="container mx-auto px-4 md:px-8 py-12">
        {/* Breadcrumb */}
        <div className="mb-6">
          <Breadcrumb
            items={[
              { label: "Vehicles", href: "/vehicles" },
              { label: "Complete Booking" },
            ]}
          />
        </div>

        <Suspense
          fallback={
            <div className="bg-card border rounded-lg p-12 text-center">
              <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
              <p className="text-lg font-medium text-muted-foreground">
                Loading booking form...
              </p>
            </div>
          }
        >
          <BookingPageContent />
        </Suspense>
      </section>
    </div>
  );
}
