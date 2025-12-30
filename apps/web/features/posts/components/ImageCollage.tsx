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
  maxHeight?: number;
}

export const ImageCollage = ({
  images,
  className = "",
  maxHeight = 600,
}: ImageCollageProps) => {
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
      case 2:
        return "grid-cols-2";
      case 3:
        return "grid-cols-2";
      case 4:
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
        <div
          className={cn("grid gap-1", getGridClasses(displayImages.length))}
          style={{ maxHeight }}
        >
          {displayImages.map((attachment, index) => {
            const isFourth = index === 3;
            const shouldBlur = totalImages > 4 && isFourth;
            const aspectRatio =
              attachment.width && attachment.height
                ? attachment.width / attachment.height
                : 1;

            // For 3 images, make the last one span full width
            const spanClass =
              displayImages.length === 3 && index === 2 ? "col-span-2" : "";

            return (
              <div
                key={attachment.id}
                className={cn(
                  "relative overflow-hidden bg-muted cursor-pointer transition-opacity hover:opacity-90",
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
                  width={400}
                  height={400}
                  className={cn("object-cover w-full", shouldBlur && "blur-md")}
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
