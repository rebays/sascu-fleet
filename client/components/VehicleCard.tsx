import Link from "next/link";
import { Car, Bike, Truck, Bus, Calendar, MapPin, ArrowRight } from "lucide-react";
import { VEHICLE_TYPE_DISPLAY, API_URL } from "@/lib/constants";
import { formatCurrency } from "@/lib/utils";
import type { VehicleDisplay } from "@/lib/types";
import { VehicleImageCarousel } from "@/components/VehicleImageCarousel";

const VehicleIcon = ({
  type,
  className,
}: {
  type: string;
  className?: string;
}) => {
  switch (type) {
    case "bike":
    case "scooter":
      return <Bike className={className} />;
    case "truck":
      return <Truck className={className} />;
    case "bus":
      return <Bus className={className} />;
    default:
      return <Car className={className} />;
  }
};

const getImageUrl = (imagePath: string): string => {
  if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
    return imagePath;
  }
  const baseUrl = API_URL.replace("/api", "");
  return `${baseUrl}${imagePath.startsWith("/") ? "" : "/"}${imagePath}`;
};

interface VehicleCardProps {
  vehicle: VehicleDisplay;
  href: string;
  ctaLabel?: string;
  totalPrice?: { amount: number; days: number };
}

export function VehicleCard({
  vehicle,
  href,
  ctaLabel = "View Details",
  totalPrice,
}: VehicleCardProps) {
  const halfDayRate =
    vehicle.pricePerHalfDay && vehicle.pricePerHalfDay > 0
      ? vehicle.pricePerHalfDay
      : vehicle.pricePerDay / 2;

  return (
    <Link
      href={href}
      className="group relative block aspect-[4/5] w-full overflow-hidden rounded-2xl border-4 border-white shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl"
    >
      {/* Full-bleed image */}
      <div className="absolute inset-0 bg-muted">
        {vehicle.images && vehicle.images.length > 0 ? (
          <VehicleImageCarousel
            images={vehicle.images.map(getImageUrl)}
            alt={vehicle.displayName}
            imageClassName="object-cover transition-transform duration-500 group-hover:scale-110"
            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <VehicleIcon
              type={vehicle.type}
              className="h-12 w-12 text-muted-foreground"
            />
          </div>
        )}
      </div>

      {/* Type badge */}
      <div className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-foreground shadow backdrop-blur">
        <VehicleIcon type={vehicle.type} className="h-3.5 w-3.5" />
        {VEHICLE_TYPE_DISPLAY[vehicle.type] || vehicle.type}
      </div>

      {/* Bottom white gradient fading up roughly half the card */}
      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-white via-white/90 to-transparent" />

      {/* Text content on top of the gradient */}
      <div className="absolute inset-x-0 bottom-0 p-5">
        <h3 className="mb-1 truncate text-lg font-bold text-foreground">
          {vehicle.displayName}
        </h3>
        <div className="mb-2 flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5" />
            {vehicle.year}
          </span>
          <span className="flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5" />
            {vehicle.location}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xl font-bold text-primary">
              {formatCurrency(vehicle.pricePerDay)}
              <span className="text-xs font-normal text-muted-foreground">
                /day
              </span>
            </span>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(halfDayRate)} half-day (12hrs or less)
            </p>
          </div>
          <span className="inline-flex items-center gap-1 text-sm font-medium text-foreground transition-all group-hover:gap-2">
            {ctaLabel}
            <ArrowRight className="h-4 w-4" />
          </span>
        </div>
        {totalPrice && (
          <p className="mt-1 text-xs font-semibold text-foreground">
            Total: {formatCurrency(totalPrice.amount)} ({totalPrice.days} day
            {totalPrice.days !== 1 ? "s" : ""})
          </p>
        )}
      </div>
    </Link>
  );
}
