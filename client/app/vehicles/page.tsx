import Link from "next/link";
import { getVehicles } from "@/lib/api";
import type { VehicleDisplay } from "@/lib/types";
import Breadcrumb from "@/components/Breadcrumb";
import { VehicleCard } from "@/components/VehicleCard";
import { Car, Calendar, AlertCircle } from "lucide-react";

export default async function VehiclesPage() {
  let vehicles: VehicleDisplay[] = [];
  let error: string | null = null;

  try {
    vehicles = await getVehicles();
  } catch (err: any) {
    error = err.message || "Failed to load vehicles";
    vehicles = [];
  }

  return (
    <div>
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-muted/60 via-muted/40 to-background border-b">
        <div className="container mx-auto px-4 md:px-8 py-16">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
              Our Fleet
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Browse our complete selection of quality vehicles
            </p>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="container mx-auto px-4 md:px-8 py-12">
        {/* Breadcrumb */}
        <div className="mb-8">
          <Breadcrumb items={[{ label: "Vehicles" }]} />
        </div>

        {/* Info Banner */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8 flex items-start gap-3">
          <Calendar className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm">
            <p className="text-blue-900">
              <strong>Tip:</strong> Use the{" "}
              <Link href="/" className="underline font-semibold">
                search tool
              </Link>{" "}
              on the homepage to find available vehicles for specific dates.
            </p>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-destructive/10 border border-destructive/50 rounded-lg p-6 mb-8">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-lg font-semibold text-destructive mb-2">
                  Error Loading Vehicles
                </h3>
                <p className="text-destructive/90 mb-2">{error}</p>
                <p className="text-sm text-destructive/70">
                  Make sure the backend server is running
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Vehicles Count */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">
            All Vehicles
            {vehicles.length > 0 && (
              <span className="text-muted-foreground ml-2">
                ({vehicles.length})
              </span>
            )}
          </h2>
        </div>

        {/* Empty State */}
        {vehicles.length === 0 && !error && (
          <div className="bg-card border rounded-lg p-12 text-center">
            <Car className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No vehicles available</h3>
            <p className="text-muted-foreground mb-6">
              Please check back later or contact us for more information.
            </p>
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Back to Home
            </Link>
          </div>
        )}

        {/* Vehicle Grid */}
        {vehicles.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {vehicles.map((vehicle) => (
              <VehicleCard
                key={vehicle._id}
                vehicle={vehicle}
                href={`/vehicles/${vehicle._id}`}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
