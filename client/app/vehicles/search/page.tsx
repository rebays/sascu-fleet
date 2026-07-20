import { Suspense } from "react";
import Breadcrumb from "@/components/Breadcrumb";
import { Loader2 } from "lucide-react";
import { VehicleSearchContent } from "./VehicleSearchContent";

export default function VehicleSearchPage() {
  return (
    <div className="-mt-[108px] md:-mt-[88px]">
      {/* Hero Section */}
      <section className="relative bg-linear-to-br from-primary/10 via-primary/5 to-background border-b">
        <div className="container mx-auto px-4 md:px-8 pt-36 md:pt-24 pb-16">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
              Search Results
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Showing available vehicles based on your search criteria
            </p>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="container mx-auto px-4 md:px-8 py-12">
        {/* Breadcrumb */}
        <div className="mb-8">
          <Breadcrumb
            items={[
              { label: "Vehicles", href: "/vehicles" },
              { label: "Search Results" },
            ]}
          />
        </div>

        <Suspense
          fallback={
            <div className="flex items-center justify-center gap-3 text-muted-foreground py-12">
              <Loader2 className="h-6 w-6 animate-spin" />
              <p className="text-lg">Searching for available vehicles...</p>
            </div>
          }
        >
          <VehicleSearchContent />
        </Suspense>
      </section>
    </div>
  );
}
