"use client";

import Image from "next/image";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

interface ImageAttachment {
  id: string;
  url: string;
  fileName: string;
  contentType: string;
  width?: number | null | undefined;
  height?: number | null | undefined;
}

interface ImageCarouselProps {
  images: ImageAttachment[];
  className?: string;
  maxHeight?: number;
}

export const ImageCarousel = ({
  images,
  className = "",
  maxHeight = 600,
}: ImageCarouselProps) => {
  // Filter to only image attachments
  const imageAttachments = images.filter((img) =>
    img.contentType?.startsWith("image/")
  );

  // Don't render if no images
  if (imageAttachments.length === 0) {
    return null;
  }

  return (
    <div
      className={`relative w-full ${className}`}
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <Carousel className="w-full">
        <CarouselContent>
          {imageAttachments.map((attachment) => {
            const aspectRatio =
              attachment.width && attachment.height
                ? attachment.width / attachment.height
                : 1;

            return (
              <CarouselItem key={attachment.id} className="basis-full">
                <div className="rounded-2xl overflow-hidden">
                  <div
                    className="relative w-full"
                    style={{
                      aspectRatio,
                      maxHeight,
                    }}
                  >
                    <Image
                      src={attachment.url}
                      alt={attachment.fileName}
                      width={attachment.width || 800}
                      height={attachment.height || 600}
                      className="object-contain w-full h-full"
                    />
                  </div>
                </div>
              </CarouselItem>
            );
          })}
        </CarouselContent>
        {imageAttachments.length > 1 && (
          <>
            <CarouselPrevious
              className="left-2 top-1/2 -translate-y-1/2 z-10"
              onMouseDown={(e) => {
                e.stopPropagation();
              }}
              onClick={(e) => {
                e.stopPropagation();
              }}
            />
            <CarouselNext
              className="right-2 top-1/2 -translate-y-1/2 z-10"
              onMouseDown={(e) => {
                e.stopPropagation();
              }}
              onClick={(e) => {
                e.stopPropagation();
              }}
            />
          </>
        )}
      </Carousel>
    </div>
  );
};
