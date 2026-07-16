import Link from "next/link";
import { Suspense, use } from "react";
import Breadcrumb from "@/components/Breadcrumb";
import { Loader2 } from "lucide-react";
import { VehicleDetailsContent } from "./VehicleDetailsContent";

// This component is needed to unwrap the params Promise
function VehiclePageWrapper({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <VehicleDetailsContent id={id} />;
}

export default function VehicleDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <div>
      {/* Hero Section */}
      <section className="relative bg-linear-to-br from-primary/10 via-primary/5 to-background border-b">
        <div className="container mx-auto px-4 md:px-8 py-16">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
              Vehicle Details
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              View specifications and reserve your vehicle
            </p>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="container mx-auto px-4 md:px-8 py-12">
        {/* Breadcrumb */}
        <div className="mb-8">
          <Breadcrumb
            items={[
              { label: "Vehicles", href: "/vehicles" },
              { label: "Vehicle Details" },
            ]}
          />
        </div>

        <Suspense
          fallback={
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
                <p className="text-muted-foreground">
                  Loading vehicle details...
                </p>
              </div>
            </div>
          }
        >
          <VehiclePageWrapper params={params} />
        </Suspense>
      </div>
    </div>
  );
}
