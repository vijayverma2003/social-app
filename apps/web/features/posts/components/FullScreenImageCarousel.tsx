"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel";
import { cn } from "@/lib/utils";

interface ImageAttachment {
  id: string;
  url: string;
  fileName: string;
  contentType: string;
  width?: number | null | undefined;
  height?: number | null | undefined;
  alt: string | null;
}

interface FullScreenImageCarouselProps {
  images: ImageAttachment[];
  initialIndex?: number;
  isOpen: boolean;
  onClose: () => void;
}

export const FullScreenImageCarousel = ({
  images,
  initialIndex = 0,
  isOpen,
  onClose,
}: FullScreenImageCarouselProps) => {
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);

  // Filter to only image attachments
  const imageAttachments = images.filter((img) =>
    img.contentType?.startsWith("image/")
  );

  // Navigate to initial index when opened
  useEffect(() => {
    if (
      isOpen &&
      api &&
      initialIndex >= 0 &&
      initialIndex < imageAttachments.length
    ) {
      api.scrollTo(initialIndex);
    }
  }, [isOpen, api, initialIndex, imageAttachments.length]);

  // Track current slide
  useEffect(() => {
    if (!api) return;

    setCurrent(api.selectedScrollSnap());

    api.on("select", () => {
      setCurrent(api.selectedScrollSnap());
    });
  }, [api]);

  // Handle keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowLeft" && api) {
        api.scrollPrev();
      } else if (e.key === "ArrowRight" && api) {
        api.scrollNext();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, api, onClose]);

  // Prevent body scroll when carousel is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen || imageAttachments.length === 0) {
    return null;
  }

  const canScrollPrev = api?.canScrollPrev() ?? false;
  const canScrollNext = api?.canScrollNext() ?? false;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center"
      onClick={onClose}
    >
      {/* Close button */}
      <Button
        variant="ghost"
        size="icon"
        className={cn(
          "absolute top-4 right-4 z-50 rounded-full",
          "bg-black/50 hover:bg-black/70 text-white",
          "h-10 w-10"
        )}
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        aria-label="Close carousel"
      >
        <X className="h-5 w-5" />
      </Button>

      {/* Left arrow */}
      {imageAttachments.length > 1 && (
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "absolute left-4 z-50 rounded-full",
            "bg-black/50 hover:bg-black/70 text-white",
            "h-12 w-12",
            !canScrollPrev && "opacity-50 cursor-not-allowed"
          )}
          onClick={(e) => {
            e.stopPropagation();
            api?.scrollPrev();
          }}
          disabled={!canScrollPrev}
          aria-label="Previous image"
        >
          <ChevronLeft className="h-6 w-6" />
        </Button>
      )}

      {/* Right arrow */}
      {imageAttachments.length > 1 && (
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "absolute right-4 z-50 rounded-full",
            "bg-black/50 hover:bg-black/70 text-white",
            "h-12 w-12",
            !canScrollNext && "opacity-50 cursor-not-allowed"
          )}
          onClick={(e) => {
            e.stopPropagation();
            api?.scrollNext();
          }}
          disabled={!canScrollNext}
          aria-label="Next image"
        >
          <ChevronRight className="h-6 w-6" />
        </Button>
      )}

      {/* Carousel content */}
      <div
        className="max-w-2xl w-full flex items-center justify-center p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <Carousel
          setApi={setApi}
          className="w-full h-full"
          opts={{
            align: "center",
            loop: false,
            startIndex: initialIndex,
          }}
        >
          <CarouselContent className="h-full">
            {imageAttachments.map((attachment) => (
              <CarouselItem key={attachment.id} className="basis-full">
                <div className="relative w-full h-full flex items-center justify-center">
                  <Image
                    src={attachment.url}
                    alt={attachment.alt || attachment.fileName}
                    width={attachment.width || 672}
                    height={attachment.height || 672}
                    className="object-contain max-w-2xl max-h-[80vh]"
                    priority
                  />
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
      </div>

      {/* Image counter */}
      {imageAttachments.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-50">
          <div className="bg-black/50 text-white px-4 py-2 rounded-full text-sm">
            {current + 1} / {imageAttachments.length}
          </div>
        </div>
      )}
    </div>
  );
};
