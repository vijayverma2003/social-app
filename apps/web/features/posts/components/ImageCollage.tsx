"use client";

import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { FullScreenImageCarousel } from "./FullScreenImageCarousel";

interface ImageAttachment {
  id: string;
  url: string;
  fileName: string;
  contentType: string;
  width?: number | null | undefined;
  height?: number | null | undefined;
}

interface ImageCollageProps {
  images: ImageAttachment[];
  className?: string;
}

export const ImageCollage = ({ images, className = "" }: ImageCollageProps) => {
  const [isCarouselOpen, setIsCarouselOpen] = useState(false);
  const [initialImageIndex, setInitialImageIndex] = useState(0);

  // Filter to only image attachments
  const imageAttachments = images.filter((img) =>
    img.contentType?.startsWith("image/")
  );

  // Don't render if no images
  if (imageAttachments.length === 0) {
    return null;
  }

  const totalImages = imageAttachments.length;
  const displayImages = imageAttachments.slice(0, 4);
  const remainingCount = totalImages > 4 ? totalImages - 4 : 0;

  // Grid layout classes based on number of images
  const getGridClasses = (count: number) => {
    switch (count) {
      case 1:
        return "grid-cols-1";
      default:
        return "grid-cols-2";
    }
  };

  const handleImageClick = (index: number) => {
    setInitialImageIndex(index);
    setIsCarouselOpen(true);
  };

  return (
    <>
      <div
        className={cn("relative w-full rounded-2xl overflow-hidden", className)}
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className={cn("grid gap-1", getGridClasses(displayImages.length))}>
          {displayImages.map((attachment, index) => {
            const isFourth = index === 3;
            const shouldBlur = totalImages > 4 && isFourth;

            let spanClass = "";
            if (displayImages.length === 3 && index === 2)
              spanClass = "col-span-3";

            return (
              <div
                key={attachment.id}
                className={cn(
                  "relative overflow-hidden cursor-pointer transition-opacity hover:opacity-90 min-h-0",
                  spanClass ? "aspect-video" : "aspect-square",
                  spanClass
                )}
                onClick={(e) => {
                  e.stopPropagation();
                  handleImageClick(index);
                }}
              >
                <Image
                  src={attachment.url}
                  alt={attachment.fileName}
                  width={300}
                  height={300}
                  className={cn(
                    "object-cover w-full h-full",
                    shouldBlur && "blur-md"
                  )}
                  style={{ maxHeight: "100%" }}
                />
                {shouldBlur && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center backdrop-blur-sm">
                    <span className="text-white font-semibold text-lg drop-shadow-lg">
                      +{remainingCount} more
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <FullScreenImageCarousel
        images={imageAttachments}
        initialIndex={initialImageIndex}
        isOpen={isCarouselOpen}
        onClose={() => setIsCarouselOpen(false)}
      />
    </>
  );
};
