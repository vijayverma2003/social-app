"use client";

import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { FullScreenImageCarousel } from "./FullScreenImageCarousel";
import ModalPortal from "@/app/(user)/components/ModalPortal";

interface ImageAttachment {
  id: string;
  url: string;
  fileName: string;
  contentType: string;
  width?: number | null | undefined;
  height?: number | null | undefined;
  alt: string | null;
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
  const remainingCount = totalImages > 3 ? totalImages - 3 : 0;

  // Grid layout classes based on number of images
  const getGridClasses = (count: number) => {
    switch (count) {
      case 1:
        return "grid-cols-1";
      case 2:
        return "grid-cols-2";
      default:
        return "grid-cols-3";
    }
  };

  const handleImageClick = (index: number) => {
    setInitialImageIndex(index);
    setIsCarouselOpen(true);
  };

  return (
    <>
      <div className={cn("grid gap-1 rounded-2xl overflow-hidden", getGridClasses(displayImages.length))}>
        {displayImages.slice(0, 3).map((image, index) => (
          <div
            onClick={() => handleImageClick(index)}
            key={image.id}
            className={cn("cursor-pointer relative", totalImages >= 2 && "aspect-square", totalImages >= 3 && index === 0 && "row-span-3 col-span-2 aspect-square")}
          >
            <Image
              src={image.url}
              alt={image.alt || image.fileName}
              width={image.width || 300}
              height={image.height || 300}
              className={cn("object-cover w-full h-full rounded-xl overflow-hidden")}
              unoptimized={image.contentType === "image/gif"}
            />
            {totalImages > 3 && index === 2 && <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
              <p className="text-white text-sm">+{remainingCount} more</p>
            </div>}
          </div>
        ))}
      </div>

      <ModalPortal>
        <FullScreenImageCarousel
          images={imageAttachments}
          initialIndex={initialImageIndex}
          isOpen={isCarouselOpen}
          onClose={() => setIsCarouselOpen(false)}
        />
      </ModalPortal>
    </>
  );
};
