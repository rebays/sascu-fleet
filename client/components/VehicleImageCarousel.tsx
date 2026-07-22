"use client";

import { useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface VehicleImageCarouselProps {
  images: string[];
  alt: string;
  className?: string;
  imageClassName?: string;
  sizes?: string;
  priority?: boolean;
}

// Buttons stop propagation/default so this can be nested inside a Link
// (e.g. VehicleCard) without triggering navigation when switching photos.
export function VehicleImageCarousel({
  images,
  alt,
  className,
  imageClassName,
  sizes,
  priority,
}: VehicleImageCarouselProps) {
  const [index, setIndex] = useState(0);
  const goTo = (i: number) => setIndex((i + images.length) % images.length);

  return (
    <div className={cn("relative h-full w-full overflow-hidden", className)}>
      <Image
        src={images[index]}
        alt={alt}
        fill
        priority={priority}
        sizes={sizes}
        className={imageClassName}
      />

      {images.length > 1 && (
        <>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              goTo(index - 1);
            }}
            aria-label="Previous photo"
            className="absolute left-2 top-1/2 z-10 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white transition-colors hover:bg-black/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              goTo(index + 1);
            }}
            aria-label="Next photo"
            className="absolute right-2 top-1/2 z-10 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white transition-colors hover:bg-black/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            <ChevronRight className="h-4 w-4" />
          </button>

          <div className="absolute bottom-2 left-1/2 z-10 flex -translate-x-1/2 gap-1.5">
            {images.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIndex(i);
                }}
                aria-label={`Go to photo ${i + 1}`}
                className={cn(
                  "h-1.5 rounded-full bg-white/60 transition-all",
                  i === index ? "w-4 bg-white" : "w-1.5"
                )}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
